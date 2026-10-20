import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { HttpOptions } from "@capacitor/core/types/core-plugins";
import { useUserStore } from "../store/user.js";

const BASE_URL = import.meta.env.VITE_BASE_API_URL ?? "";
export const API_PREFIX =
  import.meta.env.VITE_API_PREFIX ?? "/api/method/one_fm.api.v1.";

// Shared in-flight refresh so concurrent 401s trigger only one token refresh.
let refreshPromise: Promise<boolean> | null = null;

// Endpoints that are reached before the user has a session. A 401 from one of these
// is the server's ANSWER (wrong password, disabled account, bad OTP) - not an expired
// session - so it must never trigger logout + redirect. Doing so tears the page down
// before LoginPage can render "invalid password", which is why users report being
// "kicked back to the Employee ID screen" instead of being told their password is wrong.
// Matched in full, never as a substring: "v1.utils.enrollment_status" is a DIFFERENT,
// session-protected endpoint from the guest "v1.authentication.enrollment_status".
const GUEST_ENDPOINTS = [
  "v1.authentication.user_login",
  "v1.authentication.forgot_password",
  "v1.authentication.verify_otp",
  "v1.authentication.change_password",
  "v1.authentication.enrollment_status",
];

// Endpoints that must never carry the stored bearer token: the guest ones, plus the
// refresh call itself. By the time we refresh, the access token is expired by
// definition, and frappe/auth.py:629 rejects ANY request carrying an unusable bearer
// with a 401 before the whitelisted method runs - so attaching it made every refresh
// fail and silently defeated the stay-signed-in flow.
const NO_AUTH_HEADER_ENDPOINTS = [
  ...GUEST_ENDPOINTS,
  "v1.authentication.refresh_token",
];

const endpointOf = (url: string) => url.split("?")[0];

const isGuestEndpoint = (url: string) =>
  GUEST_ENDPOINTS.includes(endpointOf(url));

const skipAuthHeader = (url: string) =>
  NO_AUTH_HEADER_ENDPOINTS.includes(endpointOf(url));

const DEFAULT_HEADERS = (
  method: "get" | "post" | "put" | "delete",
  skipAuth = false,
) => {
  const userStore = useUserStore();

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (method === "get") {
    delete headers["Content-Type"];
  }

  // A leftover token on a guest endpoint is rejected by Frappe's validate_auth()
  // with a framework 401 before our whitelisted method ever runs - no Activity Log,
  // no error log, and the login simply appears to fail. Send credentials only where
  // they mean something.
  if (userStore.token && !skipAuth) {
    headers["Authorization"] = `${userStore.token}`;
  }

  return headers;
};

export const httpService = {
  // Exchange the stored refresh token for a fresh access token. Shared in-flight
  // so a burst of parallel 401s only refreshes once. Returns true on success.
  _refreshSession: (): Promise<boolean> => {
    const userStore = useUserStore();
    if (!userStore.refreshToken) return Promise.resolve(false);

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          // Lazy import avoids a circular dependency (authentication imports httpService).
          const authApi = (await import("./authentication")).default;
          const { data } = await authApi.refreshToken({
            refresh_token: userStore.refreshToken,
          });
          const newToken = data?.data?.token;
          const newRefresh = data?.data?.refresh_token;
          if (newToken) {
            userStore.setToken(newToken);
            if (newRefresh) userStore.setRefreshToken(newRefresh);
            return true;
          }
          return false;
        } catch (e) {
          return false;
        } finally {
          refreshPromise = null;
        }
      })();
    }
    return refreshPromise;
  },

  _request: async (
    method: "get" | "post" | "put" | "delete",
    url: string,
    options?: Omit<HttpOptions, "url">,
    isRetry = false,
  ) => {
    const isGuestCall = isGuestEndpoint(url);

    const mergedHeaders = {
      ...DEFAULT_HEADERS(method, skipAuthHeader(url)),
      ...options?.headers,
    };

    let requestOptions = { ...options };

    // Normalize Content-Type key for case-insensitive comparison
    const contentTypeKey = Object.keys(mergedHeaders).find(k => k.toLowerCase() === 'content-type');
    const contentType = contentTypeKey ? mergedHeaders[contentTypeKey] : '';

    // CapacitorHttp on the web fails to serialize objects into form-urlencoded strings
    // natively, which causes fetch() to throw a TypeError. We fix this by manually encoding it.
    // NOTE: On native platforms (iOS/Android), CapacitorHttp serializes JSON natively,
    // so we only manually stringify JSON if we're on the web platform.
    if (Capacitor.getPlatform() === 'web') {
      if (requestOptions.data && typeof requestOptions.data === 'object' && contentType === "application/x-www-form-urlencoded") {
        requestOptions.data = new URLSearchParams(requestOptions.data).toString();
      } else if (requestOptions.data && typeof requestOptions.data === 'object' && contentType === "application/json") {
        requestOptions.data = JSON.stringify(requestOptions.data);
      }
    }

    const response = await CapacitorHttp[method]({
      ...requestOptions,
      headers: mergedHeaders,
      url: `${BASE_URL}${API_PREFIX}${url}`,
    });

    // Handle 401 Unauthorized — session expired or invalid token
    if (response.status === 401) {
      // On a guest endpoint the 401 IS the answer (wrong password, disabled
      // account, bad OTP). Hand it to the caller so it can show a field-level
      // error; never log out or navigate, or the message is never seen.
      if (isGuestCall) {
        throw response;
      }

      const userStore = useUserStore();

      // Try a one-shot token refresh before giving up, so a merely-expired
      // access token (OAuth2 tokens live ~1h) does NOT force a re-login.
      // Skip when refreshing the refresh call itself or when already retried.
      const isRefreshCall = url.includes("refresh_token");
      if (!isRetry && !isRefreshCall && userStore.refreshToken) {
        const refreshed = await httpService._refreshSession();
        if (refreshed) {
          // Retry the original request once; DEFAULT_HEADERS re-reads the new token.
          return httpService._request(method, url, options, true);
        }
      }

      // Refresh unavailable/failed — genuinely log out.
      userStore.logout();

      // Redirect to login page
      // Using window.location ensures a full navigation even if the router isn't available
      window.location.href = '/employee-id';

      // Attach a user-friendly message before throwing
      if (!response.data) response.data = {};
      response.data.message = 'Your session has expired. Please log in again.';
      throw response;
    }

    if (response.status >= 400) {
      throw response;
    }

    return response;
  },

  get: function (url: string, options?: Omit<HttpOptions, "url">) {
    return this._request("get", url, options);
  },

  post: function (url: string, options?: Omit<HttpOptions, "url">) {
    return this._request("post", url, options);
  },

  put: function (url: string, options?: Omit<HttpOptions, "url">) {
    return this._request("put", url, options);
  },

  delete: function (url: string, options?: Omit<HttpOptions, "url">) {
    return this._request("delete", url, options);
  },
};
