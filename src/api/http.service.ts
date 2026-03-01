import { CapacitorHttp } from "@capacitor/core";
import { HttpOptions } from "@capacitor/core/types/core-plugins";
import { useUserStore } from "../store/user.js";

const BASE_URL = import.meta.env.VITE_BASE_API_URL ?? "";
export const API_PREFIX =
  import.meta.env.VITE_API_PREFIX ?? "/api/method/one_fm.api.v1.";

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
  _request: async (
    method: "get" | "post" | "put" | "delete",
    url: string,
    options?: Omit<HttpOptions, "url">,
  ) => {
    const response = await CapacitorHttp[method]({
      ...options,
      headers: {
        ...DEFAULT_HEADERS(method),
        ...options?.headers,
      },

      url: `${BASE_URL}${API_PREFIX}${url}`,
    });

    // Handle 401 Unauthorized — session expired or invalid token
    if (response.status === 401) {
      const userStore = useUserStore();
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
