import { httpService as http, httpService } from "./http.service";
import { LocationPayload } from "../types/api";
import { HttpParams } from "@capacitor/core/types/core-plugins";

type GetLeaves = LocationPayload & {
  leave_type: string;
  leave_status: string;
};
const getLeavesList = async (payload: GetLeaves) =>
  await httpService.post(`v1.leave_application.leave_application_list`, {
    data: payload,
  });

type EnrollParams = {
  employee_id: string;
  from_date: string;
  leave_type: string;
  proof_document: string; // { attachment_name: string, attachment: string };
  reason: string;
  to_date: string;
  resumption_date: string;
};
const createLeave = async (data: EnrollParams) =>
  await http.post(`v1.leave_application.create_new_leave_application`, {
    data,
  });

interface LeaveBalanceParams extends HttpParams {
  employee_id: string;
  leave_type: string;
}
const balance = async (params: LeaveBalanceParams) =>
  await http.get(`v1.leave_application.get_leave_balance`, { params });

interface LeaveTypeParams extends HttpParams {
  employee_id: string;
  leave_type: string;
}
const types = async (params: LeaveTypeParams) =>
  await http.get(`v1.leave_application.get_leave_types`, { params });

interface LeaveDetailsParams extends HttpParams {
  employee_id: string;
  leave_id: string;
}
const details = async (params: LeaveDetailsParams) =>
  await http.get(`v1.leave_application.get_leave_detail`, { params });

const profDocument = async (params: LeaveDetailsParams) =>
  await http.get(`v1.leave_application.fetch_proof_document`, { params });

const updateLeaveStatus = async (params: LeaveDetailsParams) =>
  await http.post(`v1.leave_application.leave_approver_action`, { params });

const getEmployeesList = async () =>
  await http.post(`v1.leave_application.get_employees_list`, {});

type EmployeeDetailsParams = {
  employee_id: string;
}

const getEmployee_reliever_permission = async (params: EmployeeDetailsParams) =>
  await http.post(`v1.leave_application.get_employees_role_to_display_reliever_field`, { params });

export default {
  getLeavesList,
  createLeave,
  balance,
  types,
  details,
  profDocument,
  updateLeaveStatus,
  getEmployeesList,
  getEmployee_reliever_permission,
};
