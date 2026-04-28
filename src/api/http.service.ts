import { Capacitor, CapacitorHttp } from "@capacitor/core";
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
    const mergedHeaders = {
      ...DEFAULT_HEADERS(method),
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
