import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { HttpOptions } from "@capacitor/core/types/core-plugins";
import { useUserStore } from "../store/user.js";

const BASE_URL = import.meta.env.VITE_BASE_API_URL ?? "";
export const API_PREFIX =
  import.meta.env.VITE_API_PREFIX ?? "/api/method/one_fm.api.v1.";

const REQUEST_TIMEOUT_MS = 20000;
const TIMEOUT_PATTERN = /timed? ?out|timeout/i;

// The router and translator are created after this module is first imported,
// so main.js hands them over once they exist.
let appRouter: { replace: (path: string) => unknown } | null = null;
let appTranslator: ((key: string) => string) | null = null;

export const setRouter = (router: { replace: (path: string) => unknown }) => {
  appRouter = router;
};

export const setTranslator = (t: (key: string) => string) => {
  appTranslator = t;
};

const translate = (key: string) => (appTranslator ? appTranslator(key) : key);

// Shared in-flight refresh so concurrent 401s trigger only one token refresh.
let refreshPromise: Promise<boolean> | null = null;

const DEFAULT_HEADERS = (method: "get" | "post" | "put" | "delete") => {
  const userStore = useUserStore();

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (method === "get") {
    delete headers["Content-Type"];
  }

  if (userStore.token) {
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
    const mergedHeaders = {
      ...DEFAULT_HEADERS(method),
      ...options?.headers,
    };

    let requestOptions = { ...options };

    // Normalize Content-Type key for case-insensitive comparison
    const contentTypeKey = Object.keys(mergedHeaders).find(k => k.toLowerCase() === 'content-type');
    const contentType = contentTypeKey ? mergedHeaders[contentTypeKey] : '';

    // Form-urlencoded objects are encoded here with URLSearchParams on web and iOS.
    // - web: CapacitorHttp fails to serialize objects into form-urlencoded strings, which
    //   makes fetch() throw a TypeError.
    // - iOS: the native plugin builds the form body itself and does not percent-encode "+",
    //   so the server reads every "+" (e.g. in a base64 video) as a space. A string body is
    //   sent to the server as is, so URLSearchParams sends "+" as %2B.
    // Android encodes "+" correctly, so it keeps sending the data object to CapacitorHttp.
    // JSON is only stringified on web; native platforms serialize JSON themselves.
    const platform = Capacitor.getPlatform();
    if (platform === 'web' || platform === 'ios') {
      if (requestOptions.data && typeof requestOptions.data === 'object' && contentType === "application/x-www-form-urlencoded") {
        requestOptions.data = new URLSearchParams(requestOptions.data).toString();
      } else if (platform === 'web' && requestOptions.data && typeof requestOptions.data === 'object' && contentType === "application/json") {
        requestOptions.data = JSON.stringify(requestOptions.data);
      }
    }

    let response;
    try {
      response = await CapacitorHttp[method]({
        ...requestOptions,
        headers: mergedHeaders,
        url: `${BASE_URL}${API_PREFIX}${url}`,
        connectTimeout: REQUEST_TIMEOUT_MS,
        readTimeout: REQUEST_TIMEOUT_MS,
      });
    } catch (error) {
      const text = `${(error as any)?.message ?? error ?? ""}`;
      if (TIMEOUT_PATTERN.test(text)) {
        throw {
          status: 0,
          data: {
            message: translate("utils.request_timeout.title"),
            error: translate("utils.request_timeout.message"),
          },
        };
      }
      throw error;
    }

    // Handle 401 Unauthorized — session expired or invalid token
    if (response.status === 401) {
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

      // Redirect to login page through the in-app router (no full WebView reload)
      appRouter?.replace('/employee-id');

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
