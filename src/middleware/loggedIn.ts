import { useUserStore } from "@/store/user";

// Prevents logged-in users from accessing /, /login, /employee-id.
export function isLoggedInForbidden(to, from, next) {
	const userStore = useUserStore();
	if (userStore.user) {
	  next({ path: '/home' });
	} else {
	  next();
	}
  }
  
  //Prevents logged-out users from visiting /enrollment, /home, /profile, etc.
  export function isAuthenticated(to, from, next) {
	  const userStore = useUserStore();
	  if (!userStore.user) {  // If user is NOT logged in
		  next({ path: "/" }); // Redirect to login page
		} else {
		  next(); // Allow navigation
		}
	}