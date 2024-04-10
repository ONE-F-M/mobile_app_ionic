import axios, { api_prefix } from "./axios";

type UserLoginParams = {
  employee_id: string;
  password: string;
};

export const userLogin = async (payload: UserLoginParams) =>
  await axios.post(`${api_prefix}.authentication.user_login`, payload);

export const setHeaders = (token: string) => {
  axios.defaults.headers.common["Authorization"] = `${token}`;
};

export default {
  userLogin,
  setHeaders,
};
