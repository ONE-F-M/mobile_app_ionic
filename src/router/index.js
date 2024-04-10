import { createRouter, createWebHistory } from '@ionic/vue-router';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayoutDefault.vue'),
    children: [
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue')
      },

    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLoginLayout.vue'),
    children: [
      {
        path: 'login',
        component: () => import('@/views/authentication/LoginPage.vue')
      }
    ]
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes
})

export default router
