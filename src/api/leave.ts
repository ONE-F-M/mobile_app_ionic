import { httpService } from "./http.service";
import { LocationPayload } from "../types/api";

const getLeavesList = async (payload: LocationPayload) =>
  await httpService.post(`v1.leave_application.leave_application_list`, {
    data: payload,
  });

export default {
  getLeavesList
};
