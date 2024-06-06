import { httpService as http } from "./http.service";

type EnrollParams = {
  employee_id: string;
  video: string; //base64
};

export const enroll = async (data: EnrollParams) =>
  await http.post(`v1.face_recognition.enroll`, {
    data,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export default { enroll };
