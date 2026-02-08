import { createRouter, createWebHistory } from "@ionic/vue-router";
import { isLoggedInForbidden, isAuthenticated } from '@/middleware/loggedIn';

// OPTIMIZATION 1: Removed static import of EnrollmentStartPage to reduce initial bundle size.

const routes = [
  {
    path: "/",
    component: () => import("@/views/SelectLanguage.vue"),
    beforeEnter: isLoggedInForbidden,
  },
  {
    path: "/employee-id",
    component: () => import("@/views/authentication/EmployeeId.vue"),
    beforeEnter: isLoggedInForbidden,
  },
  {
    path: "/login",
    component: () => import("@/views/authentication/LoginPage.vue"),
    beforeEnter: isLoggedInForbidden,
  },
  // Auth Flow Group
  {
    path: "/register",
    redirect: "/register/method",
  },
  {
    path: "/register/method",
    component: () => import("@/views/authentication/VerificationMethodPage.vue"),
  },
  {
    path: "/register/verify-code",
    component: () => import("@/views/authentication/VerifyOtpCodePage.vue"),
  },
  {
    path: "/register/set-password",
    component: () => import("@/views/authentication/SetPasswordPage.vue"),
  },

  // OPTIMIZATION 2: Enrollment Flow
  {
    path: "/enrollment",
    // Lazy loaded now
    component: () => import("@/views/enrollment/EnrollmentStartPage.vue"),
    meta: { requiresAuth: true } // Using meta fields for cleaner auth checks
  },
  {
    path: "/enroll-success",
    component: () => import("@/views/enrollment/EnrollmentResult.vue"),
    props: { type: "success", action: "/home" },
    meta: { requiresAuth: true }
  },
  {
    path: "/enroll-failure",
    component: () => import("@/views/enrollment/EnrollmentResult.vue"),
    props: { type: "failure", action: "/enrollment" },
    meta: { requiresAuth: true }
  },

  // Main App Flow
  {
    path: "/home",
    component: () => import("@/views/user/Tabs.vue"),
    redirect: "/dashboard",
    meta: { requiresAuth: true },
    children: [
      {
        path: "/dashboard",
        component: () => import("@/views/user/HomePage.vue"),
      },
      {
        path: "/service",
        component: () => import("@/views/user/ServicePage.vue"),
      },
      {
        path: "/notification",
        component: () => import("@/views/user/NotificationPage.vue"),
      },
      {
        path: "/profile",
        component: () => import("@/views/user/ProfilePage.vue"),
      },
    ],
  },

  // Checkin Flow
  {
    path: "/checkin",
    component: () => import("@/views/checkin/CheckinListPage.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/checkin/geolocation",
    component: () => import("@/views/checkin/CheckinGeolocation.vue"),
    meta: { requiresAuth: true }
  },

  // Leaves Flow 
  // OPTIMIZATION 3: Grouped logical features
  {
    name: "leaves-list",
    path: "/leaves",
    component: () => import("@/views/leaves/LeavesListPage.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/leaves/add",
    component: () => import("@/views/leaves/LeaveCreatePage.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/leaves/:id",
    component: () => import("@/views/leaves/LeaveDetailsPage.vue"),
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

// OPTIMIZATION 4: Global Navigation Guard
// This replaces the repetitive `beforeEnter` on every single route.
// It checks if the route has the `requiresAuth` meta field.
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // If the route requires auth, run the authenticator
    return isAuthenticated(to, from, next);
  } else {
    // If it doesn't require auth (like login), simply proceed
    // OR keep your specific `isLoggedInForbidden` logic for auth pages here if needed
    next();
  }
});

export default router;