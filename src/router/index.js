import { createRouter, createWebHistory } from "@ionic/vue-router";
import EnrollmentStartPage from "@/views/enrollment/EnrollmentStartPage.vue";

const routes = [
  {
    path: "/",
    component: () => import("@/views/SelectLanguage.vue"),
  },
  {
    path: "/employee-id",
    component: () => import("@/views/authentication/EmployeeId.vue"),
  },
  {
    path: "/login",
    component: () => import("@/views/authentication/LoginPage.vue"),
  },
  {
    path: "/register",
    redirect: "/register/method",
  },
  {
    path: "/register/method",
    component: () =>
      import("@/views/authentication/VerificationMethodPage.vue"),
  },
  {
    path: "/register/verify-code",
    component: () => import("@/views/authentication/VerifyOtpCodePage.vue"),
  },
  {
    path: "/register/set-password",
    component: () => import("@/views/authentication/SetPasswordPage.vue"),
  },
  {
    path: "/enrollment",
    component: EnrollmentStartPage,
  },
  {
    path: "/enroll-success",
    component: () => import("@/views/enrollment/EnrollmentResult.vue"),
    props: { type: "success", action: "/home" },
  },
  {
    path: "/enroll-failure",
    component: () => import("@/views/enrollment/EnrollmentResult.vue"),
    props: { type: "failure", action: "/enrollment" },
  },
  {
    path: "/home",
    component: () => import("@/views/user/Tabs.vue"),
    children: [
      {
        path: "/home",
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
  {
    path: "/checkin",
    component: () => import("@/views/checkin/CheckinListPage.vue"),
  },
  {
    name: "leaves-list",
    path: "/leaves",
    component: () => import("@/views/leaves/LeavesListPage.vue"),
  },
  {
    path: "/leaves/add",
    component: () => import("@/views/leaves/LeaveCreatePage.vue"),
  },
  {
    path: "/leaves/:id",
    component: () => import("@/views/leaves/LeaveDetailsPage.vue"),
  },
  {
    path: "/checkin/geolocation",
    component: () => import("@/views/checkin/CheckinGeolocation.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

export default router;
