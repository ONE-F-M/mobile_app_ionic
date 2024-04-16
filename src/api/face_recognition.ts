import { httpService as http } from "./http.service";

type EnrollParams = {
  employee_id: string;
  video: string; //base64
}

export const enroll = async (data: EnrollParams) =>
  await http.post(`face_recognition.enroll`, { data })

export default { enroll }


