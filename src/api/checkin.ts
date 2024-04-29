import { httpService } from "./http.service";

interface GetSiteLocationPayload {
  employee_id: string;
  latitude: string;
  longitude: string;
}

const getSiteLocation = async (payload: GetSiteLocationPayload) =>
  await httpService.post(`face_recognition.get_site_location`, {
    data: payload,
  });

interface GetCheckinListPayload {
  employee_id: string;
  from_date: string;
  to_date: string;
}

const getCheckinList = async (payload: GetCheckinListPayload) =>
  await httpService.post(`face_recognition.checkin_list`, {
    data: payload,
  });

const verifyCheckin = async (payload: GetSiteLocationPayload) =>
  await httpService.post(`face_recognition.verify_checkin_checkout`, {
    data: payload,
  });

export default {
  getSiteLocation,
  getCheckinList,
  verifyCheckin,
};
