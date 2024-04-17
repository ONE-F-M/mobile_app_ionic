import { httpService } from "./http.service";

type UserLoginParams = {
  employee_id: string;
  password: string;
};

type ForgotPasswordParams = {
  employee_id: string;
  otp_source: "email" | "whatsapp" | "sms";
};

type UpdatePasswordParams = {
  otp: string; //code
  id: string; // temp id from forgot_password response
  employee_id: string;
  new_password: string;
};

type UserNameParams = Omit<UserLoginParams, "password">;

export const userLogin = async (payload: UserLoginParams) =>
  await httpService.post(`authentication.user_login`, {
    data: payload,
  });

export const getUserEnrollment = async (payload: UserNameParams) =>
  await httpService.put(`authentication.enrollment_status`, {
    data: payload,
  });

export const forgotPassword = async (data: ForgotPasswordParams) =>
  await httpService.post("authentication.forgot_password", { data })

export const updatePassword = async (data: UpdatePasswordParams) => {
  await httpService.post("authentication.update_password", { data })
}

export default {
  userLogin,
  getUserEnrollment,
  forgotPassword,
  updatePassword,
};
