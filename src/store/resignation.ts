import { defineStore } from 'pinia';
import resignation from '@/api/resignation';
import { useUserStore } from '@/store/user';

export const useResignationStore = defineStore('resignation', {
  state: () => ({
    activeResignation: null,
    // Whether fetchActiveResignation() has ever completed successfully on
    // this device -- lets the app-open notifier tell "we've never actually
    // confirmed a baseline yet" (don't notify, nothing to compare against)
    // apart from "we confirmed there was nothing, and now there is
    // something" (genuinely new -- notify), which both otherwise look
    // identical from activeResignation alone.
    hasFetchedOnce: false,
    // A specific (often historical/terminal) resignation opened from the
    // list -- kept separate from activeResignation so viewing an old record
    // never overwrites the persisted state that the app-open notification
    // check diffs against.
    viewedResignation: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchActiveResignation() {
      const userStore = useUserStore();
      if (!userStore.user?.employee_id) return;

      this.loading = true;
      this.error = null;
      try {
        const res = await resignation.getMyActiveResignation(userStore.user.employee_id);
        if (res.data?.message && res.data.message.name) {
          this.activeResignation = res.data.message;
        } else {
          this.activeResignation = null;
        }
        this.hasFetchedOnce = true;
      } catch (err) {
        this.error = err;
        console.error('Failed to fetch active resignation:', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchResignationById(resignationId) {
      const userStore = useUserStore();
      if (!userStore.user?.employee_id || !resignationId) return;

      this.loading = true;
      this.error = null;
      try {
        const res = await resignation.getResignationByName(resignationId, userStore.user.employee_id);
        this.viewedResignation = res.data?.message?.name ? res.data.message : null;
      } catch (err) {
        this.error = err;
        this.viewedResignation = null;
        console.error('Failed to fetch resignation by id:', err);
      } finally {
        this.loading = false;
      }
    },
    clearActiveResignation() {
      this.activeResignation = null;
      this.viewedResignation = null;
      this.hasFetchedOnce = false;
      this.error = null;
    }
  },
  persist: true
});
