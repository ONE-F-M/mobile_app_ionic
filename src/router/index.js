import { createRouter, createWebHistory } from "@ionic/vue-router";
import EnrollmentStartPage from "@/views/enrollment/EnrollmentStartPage.vue"

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
    path: "/enrollment",
    component: EnrollmentStartPage,
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
    component: () => import("@/views/user/Tabs.vue"),
    children: [
      {
        path: '/home',
        component: () => import("@/views/user/HomePage.vue"),
      },
      {
        path: '/service',
        component: () => import('@/views/user/ServicePage.vue'),
      },
      {
        path: '/notification',
        component: () => import('@/views/user/NotificationPage.vue'),
      },
      {
        path: '/profile',
        component: () => import('@/views/user/ProfilePage.vue'),
      },
    ]
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
});

export default router;
