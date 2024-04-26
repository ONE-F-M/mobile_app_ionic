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

const verifyCheckin = async (payload: GetSiteLocationPayload) =>
  await httpService.post(`face_recognition.verify_checkin_checkout`, {
    data: payload,
  });

export default {
  getSiteLocation,
  verifyCheckin,
};
