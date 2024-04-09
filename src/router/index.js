import { createRouter, createWebHistory } from '@ionic/vue-router';
import HomePage from '../views/HomePage.vue'
import LoginPage from "../views/authentication/LoginPage.vue"

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes
})

export default router
