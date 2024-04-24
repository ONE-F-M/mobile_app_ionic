import { httpService } from "./http.service";

const getServices = async () =>
  await httpService.get(`configuration.user_app_service`);

export default {
  getServices,
};
