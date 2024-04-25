import { httpService } from "./http.service";

const getServices = async () =>
  await httpService.get(`configuration.app_service`);

const getServicesGroups = async () =>
  await httpService.get(`configuration.app_service_group`);

const getUserServices = async () =>
  await httpService.get(`configuration.user_app_service`);

interface UpdateServicesPayload {
  service_detail: {
    service: string;
  }[];
}

const updateServices = async (payload: UpdateServicesPayload) =>
  await httpService.post(`configuration.update_create_user_app_service`, {
    data: payload,
  });

export default {
  getServices,
  getServicesGroups,
  getUserServices,
  updateServices,
};
