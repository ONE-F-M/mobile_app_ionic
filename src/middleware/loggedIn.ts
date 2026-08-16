import { useUserStore } from "@/store/user";

/**
 * Global navigation guard. Export this and use it in router.beforeEach().
 * - Routes with meta.isGuest = true → redirect authenticated users to /home
 * - Routes with meta.requiresAuth = true → redirect unauthenticated users to /
 */
export function authGuard(to: any, from: any, next: any) {
  const userStore = useUserStore();
  const isAuthenticated = !!(userStore.user && userStore.token);

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Save where the user was trying to go
    next({ path: "/", query: { redirect: to.fullPath } });
  } else if (to.meta.isGuest && isAuthenticated) {
    next({ path: "/home" });
  } else {
    next();
  }
}

// Keep legacy named exports for backward compatibility
export const isLoggedInForbidden = (to: any, from: any, next: any) => {
  const userStore = useUserStore();
  if (userStore.user && userStore.token) {
    next({ path: "/home" });
  } else {
    next();
  }
};

export const isAuthenticated = (to: any, from: any, next: any) => {
  const userStore = useUserStore();
  if (!userStore.user || !userStore.token) {
    next({ path: "/" });
  } else {
    next();
  }
};
