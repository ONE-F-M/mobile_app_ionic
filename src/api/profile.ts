import { httpService } from "./http.service";

const getUserProfile = async (payload: { employee_id: string }) =>
  await httpService.get(`user.get_user_details`, {
    params: payload,
  });

const getNotifications = async (payload: { employee_id: string }) =>
  await httpService.get(`notification.get_notification_list`, {
    params: payload,
  });

interface NotificationDeviceId {
  employee_id: string;
  fcm_token: string;
  device_os: "ios" | "android";
}
const setDeviceIdNotifications = async (payload: NotificationDeviceId) =>
  await httpService.post(`user.store_fcm_token`, {
    data: payload,
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
  setDeviceIdNotifications,
};
