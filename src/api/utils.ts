import { httpService } from "./http.service";

const getGoogleMapApiKey = async () =>
  await httpService.get(`v1.utils.google_map_api`);

export default {
  getGoogleMapApiKey,
};
