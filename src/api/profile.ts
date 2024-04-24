import { httpService } from "./http.service";

const getUserProfile = async (payload: { employee_id: string }) =>
  await httpService.get(`user.get_user_details`, {
    params: payload,
  });

const getNotifications = async (payload: { employee_id: string }) =>
  await httpService.get(`notification.get_notification_list`, {
    params: payload,
  });

const updateProfileImage = async (payload: {
  employee_id: string;
  image: string;
}) =>
  await httpService.post(`user.change_user_profile_image`, {
    data: payload,
  });

export default {
  getUserProfile,
  getNotifications,
  updateProfileImage,
};
