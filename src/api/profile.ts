import { httpService } from "./http.service";

const getUserProfile = async (payload: { employee_id: string }) =>
  await httpService.get(`api.get_user_details`, {
    params: payload,
  });

const getNotifications = async (payload: { employee_id: string }) =>
  await httpService.get(`v1.notification.get_notification_list`, {
    params: payload,
  });

interface NotificationDeviceId {
  employee_id: string;
  fcm_token: string;
  device_os: "ios" | "android";
}
const setDeviceIdNotifications = async (payload: NotificationDeviceId) =>
  await httpService.post(`v1.user.store_fcm_token`, {
    data: payload,
  });

const pushNotification = async () =>
  await httpService.post(`v1.api.push_notification_rest_api_for_checkin`, {
    data: {
      employee_id: "HR-EMP-02756",
      title: "Ionic Test message",
      body: "Test message from app",
      checkout: "False",
      arriveLate: "True",
      checkin: "True",
    },
    headers: {
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
    },
  });

const updateProfileImage = async (payload: {
  employee_id: string;
  image: string;
}) =>
  await httpService.post(`v1.user.change_user_profile_image`, {
    data: payload,
  });

export default {
  getUserProfile,
  getNotifications,
  updateProfileImage,
  setDeviceIdNotifications,
  pushNotification,
};
