import { httpService as http, httpService } from "./http.service";
import { LocationPayload } from "../types/api";

const getLeavesList = async (payload: LocationPayload) =>
  await httpService.post(`v1.leave_application.leave_application_list`, {
    data: payload,
  });

type EnrollParams = {
  employee_id: string;
  from_date: string;
  leave_type: string;
  proof_document: string, // { attachment_name: string, attachment: string };
  reason: string;
  to_date: string;
};
export const createLeave = async (data: EnrollParams) =>
  await http.post(`v1.leave_application.create_new_leave_application`, { data });

export default {
  getLeavesList,
  createLeave,
};
