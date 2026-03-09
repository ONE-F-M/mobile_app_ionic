import { defineStore } from "pinia";
import { useAuthStore } from "@/store/auth.js";
import checkin from "@/api/checkin";
import leave from "@/api/leave";
import shifts from "@/api/shifts";

export const useUserStore = defineStore("user", {
  state: () => {
    return {
      user: null,
      token: null,
      isEndpointEnabled: 1,

      // 2. New State for Caching
      cachedCheckinList: null,
      cachedCheckinFrom: null,
      cachedCheckinTo: null,
      lastCheckinFetch: 0,

      cachedLeavesList: null,
      cachedLeavesFrom: null,
      cachedLeavesTo: null,
      cachedLeavesType: null,
      cachedLeavesStatus: null,
      lastLeavesFetch: 0,

      cachedShiftsList: null,
      cachedShiftsFrom: null,
      cachedShiftsTo: null,
      lastShiftsFetch: 0,

      shiftWorking: null,
    };
  },
  persist: true,
  getters: {
    isShiftWorking: (state) => !!(state.shiftWorking ?? state.user?.shift_working),
  },
  actions: {
    setEndpointStatus(status) {
      this.isEndpointEnabled = status;
    },
    setShiftWorking(value) {
      this.shiftWorking = value ? 1 : 0;
    },
    setUser(user) {
      this.user = user;
      if (user && user.shift_working !== undefined) {
        this.shiftWorking = user.shift_working ? 1 : 0;
      }
    },

    setToken(token) {
      this.token = token;
    },

    // 3. New Prefetch Action
    // Prefetch checkins from the last month (aligning with CheckinPage default)
    async prefetchCheckins(employeeId) {
      if (!employeeId) return;

      try {
        const date = new Date();
        const today = date.toISOString().split('T')[0]; // YYYY-MM-DD

        date.setMonth(date.getMonth() - 1);
        const start = date.toISOString().split('T')[0];

        const { data } = await checkin.getCheckinList({
          employee_id: employeeId,
          from_date: start,
          to_date: today,
        });

        // Store the result, range and the timestamp
        this.cachedCheckinList = data.data;
        this.cachedCheckinFrom = start;
        this.cachedCheckinTo = today;
        this.lastCheckinFetch = Date.now();

      } catch (error) {
        // Silently fail - this is just a prefetch optimization.
        // If it fails, the actual page will retry and handle the error UI.
        console.warn("Prefetch checkins failed:", error);
      }
    },

    // Prefetch leaves from the last year (matching LeavesListPage default range)
    async prefetchLeaves(employeeId) {
      if (!employeeId) return;

      try {
        const date = new Date();
        const today = date.toISOString().split('T')[0];

        date.setFullYear(date.getFullYear() - 1);
        const start = date.toISOString().split('T')[0];

        const { data } = await leave.getLeavesList({
          employee_id: employeeId,
          from_date: start,
          to_date: today,
          leave_type: '',
          status: '',
        });

        this.cachedLeavesList = data.data;
        this.cachedLeavesFrom = start;
        this.cachedLeavesTo = today;
        this.cachedLeavesType = '';
        this.cachedLeavesStatus = '';
        this.lastLeavesFetch = Date.now();

      } catch (error) {
        console.warn("Prefetch leaves failed:", error);
      }
    },

    // Prefetch shifts for the last year/next year (matching ShiftRequestListPage default range)
    async prefetchShifts(employeeId) {
      if (!employeeId) return;

      try {
        const date = new Date();
        const start = new Date(date);
        start.setFullYear(start.getFullYear() - 1);
        const end = new Date(date);
        end.setFullYear(end.getFullYear() + 1);

        const from_date = start.toISOString().split("T")[0];
        const to_date = end.toISOString().split("T")[0];

        const { data } = await shifts.getShiftsList({
          employee_id: employeeId,
          from_date: from_date,
          to_date: to_date,
        });

        this.cachedShiftsList = data.data;
        this.cachedShiftsFrom = from_date;
        this.cachedShiftsTo = to_date;
        this.lastShiftsFetch = Date.now();
      } catch (error) {
        console.warn("Prefetch shifts failed:", error);
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
      this.cachedCheckinFrom = null;
      this.cachedCheckinTo = null;
      this.lastCheckinFetch = 0;

      this.cachedLeavesList = null;
      this.cachedLeavesFrom = null;
      this.cachedLeavesTo = null;
      this.cachedLeavesType = null;
      this.cachedLeavesStatus = null;
      this.lastLeavesFetch = 0;

      this.cachedShiftsList = null;
      this.cachedShiftsFrom = null;
      this.cachedShiftsTo = null;
      this.lastShiftsFetch = 0;

      this.shiftWorking = null;
    },
  },
});