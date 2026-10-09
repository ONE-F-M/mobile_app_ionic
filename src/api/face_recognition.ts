import { httpService as http } from "./http.service";

type EnrollParams = {
  employee_id: string;
  video: string; //base64
  video_mime?: string; // mime type the clip was recorded with
};

export const enroll = async (data: EnrollParams) =>
  await http.post(`v1.face_recognition.enroll`, {
    data
  });

export default { enroll };
