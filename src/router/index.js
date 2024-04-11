import { createRouter, createWebHistory } from "@ionic/vue-router";

const routes = [
  {
    path: "/",
    redirect: "/welcome",
  },
  {
    path: "/",
    component: () => import("@/layouts/AppLayoutDefault.vue"),
    children: [
      {
        path: "welcome",
        component: () => import("@/views/Welcome.vue"),
      },
      {
        path: "home",
        component: () => import("@/views/HomePage.vue"),
      },
    ],
  },
  {
    path: "/",
    component: () => import("@/layouts/AppLoginLayout.vue"),
    children: [
      {
        path: "login",
        component: () => import("@/views/authentication/LoginPage.vue"),
      },
    ],
  },
  {
    path: "/",
    component: () => import("@/layouts/AppLoginLayout.vue"),
    children: [
      {
        path: "forgot-password",
        component: () => import("@/views/authentication/ForgotPassword.vue"),
      },
    ],
  },
  {
    path: "/",
    component: () => import("@/layouts/AppLayoutDefault.vue"),
    children: [
      {
        path: "user",
        component: () => import("@/views/user/HomePage.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

export default router;
