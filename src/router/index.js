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
    path: "/user",
    component: () => import("@/views/user/HomePage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

export default router;
