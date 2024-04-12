import { httpService } from "./http.service";

type UserLoginParams = {
  employee_id: string;
  password: string;
};

type UserNameParams = Omit<UserLoginParams, "password">;

const userLogin = async (payload: UserLoginParams) =>
  await httpService.post(`authentication.user_login`, {
    data: payload,
  });

const getUserEnrollment = async (payload: UserNameParams) =>
  await httpService.post(`authentication.enrollment_status`, {
    data: payload,
  });

export default {
  userLogin,
  getUserEnrollment,
};
