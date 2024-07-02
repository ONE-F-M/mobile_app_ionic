import { useUserStore } from "@/store/user";

export function isLoggedInForbidden(to, from, next) {
  const userStore = useUserStore();

  if (userStore.user) {
    next({ path: '/home' });
  } else {
    next();
  }
}
