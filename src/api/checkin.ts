import { httpService } from "./http.service";
import { LocationPayload } from "../types/api";

const getSiteLocation = async (payload: LocationPayload) =>
  await httpService.post(`v1.face_recognition.get_site_location`, {
    data: payload,
  });

interface GetCheckinListPayload {
  employee_id: string;
  from_date: string;
  to_date: string;
}

const getCheckinList = async (payload: GetCheckinListPayload) =>
  await httpService.post(`v1.face_recognition.checkin_list`, {
    data: payload,
  });

const verifyCheckin = async (payload: LocationPayload) =>
  await httpService.post(`v1.face_recognition.verify_checkin_checkout`, {
    data: payload,
    "headers": {
      "Content-Type": "multipart/form-data"
    }
  });

export default {
  getSiteLocation,
  getCheckinList,
  verifyCheckin,
};
