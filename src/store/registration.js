import { defineStore } from "pinia";

export const useRegistrationStore = defineStore(
  "registration",
  {
    state: () => ({
      employee_id: "",
      employee_name: "",
      method: "email",
      temp_id: "",
      code: "",
      password: "",
    }),
  }
);
