import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/stores/auth'

import Landing   from '@/views/Landing.vue'
import Jobs      from '@/views/Jobs.vue'
import Login     from '@/views/Login.vue'
import Register  from '@/views/Register.vue'
import Dashboard from '@/views/Dashboard.vue'
import PostJob   from '@/views/PostJob.vue'
import Admin     from '@/views/Admin.vue'
import Forgot    from '@/views/Forgot.vue'
import Reset     from '@/views/Reset.vue'
import Profile   from '@/views/Profile.vue'
import Company   from '@/views/Company.vue'
import Messages        from '@/views/Messages.vue'
import PaymentCallback from '@/views/PaymentCallback.vue'
import Workers        from '@/views/Workers.vue'

const routes = [
  { path: '/',              component: Landing },
  { path: '/jobs',          component: Jobs },
  { path: '/login',         component: Login },
  { path: '/register',      component: Register },
  { path: '/forgot',        component: Forgot },
  { path: '/reset',         component: Reset },
  { path: '/profile/:id',   component: Profile },
  { path: '/profile',       component: Profile },
  { path: '/company/:id',   component: Company },
  { path: '/messages',          component: Messages,        meta: { requiresAuth: true } },
  { path: '/payment-callback', component: PaymentCallback },
  { path: '/workers',          component: Workers },
  { path: '/post',          component: PostJob,   meta: { requiresAuth: true } },
  { path: '/dashboard',     component: Dashboard, meta: { requiresAuth: true } },
  { path: '/admin',         component: Admin,     meta: { requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/'
})

export default router
