import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => {
    return {
      userName: null,
      employeeId: null,
      userId: null,
      isRegistered: false,
      verificationMethod: null,
    };
  },
  persist: true,
  actions: {
    setUserName(userName) {
      this.userName = userName;
    },

    setEmployeeId(id) {
      this.employeeId = id;
    },

    setRegistered(status) {
      this.isRegistered = status;
    },

    setUserId(id) {
      this.userId = id;
    },

    setVerificationMethod(method) {
      this.verificationMethod = method;
    },

    reset() {
      this.userName = null;
      this.employeeId = null;
      this.userId = null;
      this.isRegistered = false;
      this.verificationMethod = null;
    },
  },
});
