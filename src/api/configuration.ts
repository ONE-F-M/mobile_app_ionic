import { httpService } from "./http.service";

const getServices = async () =>
  await httpService.get(`configuration.app_service`);

const getServicesGroups = async () =>
  await httpService.get(`configuration.app_service_group`);

const getUserServices = async () =>
  await httpService.get(`configuration.user_app_service`);

export default {
  getServices,
  getServicesGroups,
  getUserServices,
};
