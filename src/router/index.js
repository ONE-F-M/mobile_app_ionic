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
    path: "/enroll",
    component: () => import("@/views/authentication/EnrollPage.vue"),
  },
  {
    path: "/enroll-success",
    component: () => import("@/views/authentication/EnrollResult.vue"),
    props: { type: "success", action: "/user" }
  },
  {
    path: "/enroll-failure",
    component: () => import("@/views/authentication/EnrollResult.vue"),
    props: { type: "failure", action: "/enroll" }
  },
  {
    path: "/user",
    component: () => import("@/views/user/HomePage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

export default router;
