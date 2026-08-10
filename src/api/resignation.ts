import { httpService as http } from "./http.service";

type ResignationParams = {
  employee_id: string;
  reason?: string;
  reason_for_exit?: string;
  attachment?: string; // JSON string with attachment_name and base64
  supervisor?: string;
  resignation_initiation_date?: string;
  relieving_date?: string;
};

const createResignation = async (data: ResignationParams) =>
  await http.post(`v1.resignation.create_resignation`, {
    data: data,
    headers: { "Content-Type": "application/json" },
  });

const withdrawResignation = async (data: ResignationParams) =>
  await http.post(`v1.resignation.withdraw_resignation`, {
    data: data,
    headers: { "Content-Type": "application/json" },
  });

const getSupervisorDropdown = async () =>
  await http.get(`v1.resignation.get_supervisor_dropdown`);

const getEmployeeSupervisor = async (employee_id: string) =>
  await http.get(`v1.resignation.get_employee_supervisor`, {
    params: { employee_id },
  });

const getMyActiveResignation = async (employee_id?: string) =>
  await http.get(`v1.resignation.get_my_active_resignation`, {
    params: { employee_id },
  });

const getAllMyResignations = async (employee_id?: string) =>
  await http.get(`v1.resignation.get_all_my_resignations`, {
    params: { employee_id },
  });


type ExtensionParams = {
  employee_id: string;
  supervisor: string;
  reason: string;
  extended_date: string;
  resignation_id: string;
  attachment: string;
};

type CorrectionParams = {
  employee_id: string;
  new_date: string;
  new_initiation_date: string;
  attachment: string;
  resignation_id: string;
};

const extendResignation = async (payload: ExtensionParams) =>
  await http.post(`v1.resignation.extend_resignation`, {
    data: payload,
    headers: { "Content-Type": "application/json" },
  });


const correctResignationDate = async (payload: CorrectionParams) =>
  await http.post(`v1.resignation.correct_resignation_date_app`, {
    data: payload,
    headers: { "Content-Type": "application/json" },
  });

export default {
  createResignation,
  withdrawResignation,
  getSupervisorDropdown,
  getEmployeeSupervisor,
  getMyActiveResignation,
  getAllMyResignations,
  extendResignation,
  correctResignationDate,
};
