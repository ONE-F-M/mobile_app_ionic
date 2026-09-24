import { useUserStore } from "../store/user.js";
import { LocationPayload } from "../types/api";

// Hardcoded staging URL - bypasses environment configuration
const STAGING_BASE_URL = "https://staging-api.one-fm.com";
const API_PREFIX = "/api/method/one_fm.api.v1.";

interface GetCheckinListPayload {
  employee_id: string;
  from_date: string;
  to_date: string;
}

const getHeaders = () => {
  const userStore = useUserStore();
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (userStore.token) {
    headers["Authorization"] = `${userStore.token}`;
  }

  return headers;
};

const _makeRequest = async (endpoint: string, data: any = {}) => {
  const headers = getHeaders();
  const url = `${STAGING_BASE_URL}${API_PREFIX}${endpoint}`;

  // Encode data as form-urlencoded
  const formData = new URLSearchParams();
  const flattenData = (obj: any, prefix = "") => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}[${key}]` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          flattenData(value, newKey);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${newKey}[${index}]`, item);
          });
        } else {
          formData.append(newKey, value);
        }
      }
    }
  };

  flattenData(data);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error("Staging API request failed");
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  return response.json();
};

const getSiteLocation = async (payload: LocationPayload) => {
  const response = await _makeRequest("v1.face_recognition.get_site_location", {
    data: payload,
  });
  return response;
};

const getCheckinList = async (payload: GetCheckinListPayload) => {
  const response = await _makeRequest("v1.face_recognition.checkin_list", {
    data: payload,
  });
  return response;
};

const verifyCheckin = async (payload: LocationPayload) => {
  const response = await _makeRequest("v1.face_recognition.verify_checkin_checkout", {
    data: payload,
  });
  return response;
};

export default {
  getSiteLocation,
  getCheckinList,
  verifyCheckin,
};
