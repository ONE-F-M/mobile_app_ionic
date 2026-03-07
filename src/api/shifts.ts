import { httpService as http } from "./http.service";
import { HttpParams } from "@capacitor/core/types/core-plugins";

export interface ShiftRequestParams {
    employee_id: string;
    from_date: string;
    to_date: string;
    purpose?: string;
    status?: string;
}

const getShiftsList = async (params: ShiftRequestParams) =>
    await http.get(`v1.shift_request.shift_request_list`, { params: params as any });

export interface CreateShiftParams {
    employee_id: string;
    purpose: string;
    from_date: string;
    to_date: string;
    reason?: string;
}

const createShift = async (data: CreateShiftParams) =>
    await http.post(`v1.shift_request.create_shift_request`, { data });

export interface ShiftDetailsParams {
    shift_request_id: string;
}

const details = async (params: ShiftDetailsParams) =>
    await http.get(`v1.shift_request.get_shift_request_detail`, { params: params as any });

export interface ShiftActionParams {
    shift_request_id: string;
    action: string;
}

const updateShiftStatus = async (data: ShiftActionParams) =>
    await http.post(`v1.shift_request.shift_request_action`, { data });

export default {
    getShiftsList,
    createShift,
    details,
    updateShiftStatus,
};
