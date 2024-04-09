import axios from "axios";
import router from "@/router";
//import store from "@/store";
//import token from "@/utils/storage/token"

const url = import.meta.env.VITE_BASE_API_URL ?? "";

const instance = axios.create({ baseURL: url });

instance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response.status === 401) {
      if (error.response.data.message == "Unauthenticated") {
        // token.remove()
        // store.commit("setUser", false)
        router.push({path: "/login"})
      }
    }

    return Promise.reject(error.response.data)
  }
);

/*
const auth = token.get()
if (auth) {
  instance.defaults.header.common["Authorization"] = `Bearer ${auth}`;
}
*/

export default instance;

