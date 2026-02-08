import { defineStore } from "pinia";
import { useAuthStore } from "@/store/auth.js";
import checkin from "@/api/checkin"; // 1. Import the API

export const useUserStore = defineStore("user", {
  state: () => {
    return {
      user: null,
      token: null,
      isEndpointEnabled: 1,

      // 2. New State for Caching
      cachedCheckinList: null,
      lastCheckinFetch: 0,
    };
  },
  persist: true,
  actions: {
    setEndpointStatus(status) {
      this.isEndpointEnabled = status;
    },
    setUser(user) {
      this.user = user;
    },

    setToken(token) {
      this.token = token;
    },

    // 3. New Prefetch Action
    // Prefetch checkins from the last 6 months (from 6 months ago to today) to match your CheckinPage logic
    async prefetchCheckins(employeeId) {
      if (!employeeId) return;

      try {
        const date = new Date();
        const today = date.toISOString().split('T')[0]; // YYYY-MM-DD

        date.setMonth(date.getMonth() - 6);
        const start = date.toISOString().split('T')[0];

        const { data } = await checkin.getCheckinList({
          employee_id: employeeId,
          from_date: start,
          to_date: today,
        });

        // Store the result and the timestamp
        this.cachedCheckinList = data.data;
        this.lastCheckinFetch = Date.now();

      } catch (error) {
        // Silently fail - this is just a prefetch optimization.
        // If it fails, the actual page will retry and handle the error UI.
        console.warn("Prefetch checkins failed:", error);
      }
    },

    logout() {
      const authStore = useAuthStore();

      authStore.reset();

      this.user = null;
      this.token = null;
      this.isEndpointEnabled = null;

      // Clear cache on logout
      this.cachedCheckinList = null;
      this.lastCheckinFetch = 0;
    },
  },
});