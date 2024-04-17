import { CapacitorHttp } from "@capacitor/core";
import { HttpOptions } from "@capacitor/core/types/core-plugins";
import { useUserStore } from "../store/user.js";

const BASE_URL = import.meta.env.VITE_BASE_API_URL ?? "";
export const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? "/api/method/one_fm.api.v1.";

const DEFAULT_HEADERS = () => {
  const userStore = useUserStore();

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (userStore.token) {
    headers["Authorization"] = `Bearer ${userStore.token}`;
  }

  return {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
};

export const httpService = {
  get: (url: string, options?: Omit<HttpOptions, "url">) => {
    return CapacitorHttp.get({
      ...options,
      headers: {
        ...DEFAULT_HEADERS(),
        ...options?.headers,
      },
      url: `${BASE_URL}${API_PREFIX}${url}`,
    });
  },

  post: (url: string, options?: Omit<HttpOptions, "url">) => {
    return CapacitorHttp.post({
      ...options,
      headers: {
        ...DEFAULT_HEADERS(),
        ...options?.headers,
      },
      url: `${BASE_URL}${API_PREFIX}${url}`,
    });
  },

  put: (url: string, options?: Omit<HttpOptions, "url">) => {
    return CapacitorHttp.put({
      ...options,
      headers: {
        ...DEFAULT_HEADERS(),
        ...options?.headers,
      },
      url: `${BASE_URL}${API_PREFIX}${url}`,
    });
  },

  delete: (url: string, options?: Omit<HttpOptions, "url">) => {
    return CapacitorHttp.delete({
      ...options,
      headers: {
        ...DEFAULT_HEADERS(),
        ...options?.headers,
      },
      url: `${BASE_URL}${API_PREFIX}${url}`,
    });
  },
};
