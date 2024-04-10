import axios from "axios";
import router from "@/router";

const url = import.meta.env.VITE_BASE_API_URL ?? "";
export const api_prefix = import.meta.env.VITE_API_PREFIX ?? "/api/method/one_fm.api.v1";

const instance = axios.create({ baseURL: url });

instance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response.status === 401) {
      if (error.response.data.message == "Unauthenticated") {
        router.push({path: "/login"})
      }
    }

    return Promise.reject(error.response.data)
  }
);

export default instance;

