import { createRouter, createWebHistory } from "@ionic/vue-router";
import { authGuard } from "@/middleware/loggedIn";
import EnrollmentStartPage from "@/views/enrollment/EnrollmentStartPage.vue";
import { useUserStore } from "@/store/user";

// OPTIMIZATION 1: Removed static import of EnrollmentStartPage to reduce initial bundle size.

const routes = [
  {
    path: "/",
    component: () => import("@/views/SelectLanguage.vue"),
    meta: { isGuest: true },
  },
  {
    path: "/employee-id",
    component: () => import("@/views/authentication/EmployeeId.vue"),
    meta: { isGuest: true },
  },
  {
    path: "/login",
    component: () => import("@/views/authentication/LoginPage.vue"),
    meta: { isGuest: true },
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
    component: EnrollmentStartPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/enroll-success",
    component: () => import("@/views/enrollment/EnrollmentResult.vue"),
    props: { type: "success", action: "/home" },
    meta: { requiresAuth: true },
  },
  {
    path: "/enroll-failure",
    component: () => import("@/views/enrollment/EnrollmentResult.vue"),
    props: { type: "failure", action: "/enrollment" },
    meta: { requiresAuth: true },
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
    meta: { requiresAuth: true },
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
    meta: { requiresAuth: true },
  },
  {
    path: "/leaves/add",
    component: () => import("@/views/leaves/LeaveCreatePage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/leaves/:id",
    component: () => import("@/views/leaves/LeaveDetailsPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/resignation",
    component: () => import("@/views/resignation/ResignationListPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/resignation/add",
    component: () => import("@/views/resignation/ResignationCreatePage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/resignation/add/:id",
    component: () => import("@/views/resignation/ResignationCreatePage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/resignation/withdraw",
    component: () => import("@/views/resignation/WithdrawalCreatePage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/resignation/correct",
    component: () => import("@/views/resignation/ResignationCorrectionPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: '/resignation/extend',
    name: 'resignation_extension',
    component: () => import('@/views/resignation/ExtensionCreatePage.vue'),
    meta: { requiresAuth: true },
  },

  // Shift Request Flow
  {
    path: "/checkin/geolocation",
    component: () => import("@/views/checkin/CheckinGeolocation.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

router.beforeEach(authGuard);

export default router;
