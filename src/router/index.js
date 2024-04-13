import { createRouter, createWebHistory } from "@ionic/vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/views/SelectLanguage.vue"),
  },
  {
    path: "/login",
    component: () => import("@/views/authentication/LoginPage.vue"),
  },
  {
    path: "/forgot-password",
    component: () => import("@/views/authentication/ForgotPassword.vue"),
  },
  {
    path: "/enrollment-start",
    component: () => import("@/views/enrollment/EnrollmentStartPage.vue"),
  },
  {
    path: "/enrollment",
    component: () => import("@/views/enrollment/EnrollmentPage.vue"),
  },
  {
    path: "/enroll-success",
    component: () => import("@/views/enrollment/EnrollmentResult.vue"),
    props: { type: "success", action: "/home" }
  },
  {
    path: "/enroll-failure",
    component: () => import("@/views/enrollment/EnrollmentResult.vue"),
    props: { type: "failure", action: "/enrollment-start" }
  },
  {
    path: "/home",
    component: () => import("@/views/user/HomePage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

export default router;
