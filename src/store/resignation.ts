import { defineStore } from 'pinia';
import resignation from '@/api/resignation';
import { useUserStore } from '@/store/user';

export const useResignationStore = defineStore('resignation', {
  state: () => ({
    activeResignation: null,
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
      } catch (err) {
        this.error = err;
        console.error('Failed to fetch active resignation:', err);
      } finally {
        this.loading = false;
      }
    },
    clearActiveResignation() {
      this.activeResignation = null;
      this.error = null;
    }
  },
  persist: true
});
