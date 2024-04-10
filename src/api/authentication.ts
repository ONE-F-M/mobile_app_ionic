import axios, { api_prefix } from "./axios";

type UserLoginParams = {
  employee_id: string,
  password: string
}

export const user_login = async (params:UserLoginParams) =>
  await axios.post(`${api_prefix}.authentication.user_login`, params)


export default {
  user_login
}

