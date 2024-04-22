import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => {
    return {
      userName: null,
      employeeId: null,
      userId: null,
      tempId: null,
      isRegistered: false,
      passwordToken: null,
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

    setTempId(id) {
      this.tempId = id;
    },

    setVerificationMethod(method) {
      this.verificationMethod = method;
    },

    setPasswordCode(code) {
      this.passwordToken = code;
    },

    reset() {
      this.userName = null;
      this.employeeId = null;
      this.userId = null;
      this.isRegistered = false;
      this.passwordToken = null;
      this.tempId = null;
      this.verificationMethod = null;
    },
  },
});
