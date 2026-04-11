import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/stores/auth'

import Landing        from '@/views/Landing.vue'
import Jobs           from '@/views/Jobs.vue'
import Login          from '@/views/Login.vue'
import Register       from '@/views/Register.vue'
import Welcome        from '@/views/Welcome.vue'
import Dashboard      from '@/views/Dashboard.vue'
import PostJob        from '@/views/PostJob.vue'
import Admin          from '@/views/Admin.vue'
import Forgot         from '@/views/Forgot.vue'
import Reset          from '@/views/Reset.vue'
import Profile        from '@/views/Profile.vue'
import Company        from '@/views/Company.vue'
import Messages       from '@/views/Messages.vue'
import PaymentCallback from '@/views/PaymentCallback.vue'
import Workers        from '@/views/Workers.vue'
import Subscribe      from '@/views/Subscribe.vue'
import CVBuilder      from '@/views/CVBuilder.vue'
import AIMatch        from '@/views/AIMatch.vue'
import Blog           from '@/views/Blog.vue'
import Referral       from '@/views/Referral.vue'
import BlogPost       from '@/views/BlogPost.vue'

const routes = [
  { path: '/',                 component: Landing },
  { path: '/jobs',             component: Jobs,    meta: { requiresAuth: true } },
  { path: '/login',            component: Login },
  { path: '/register',         component: Register },
  { path: '/welcome',          component: Welcome },
  { path: '/subscribe',        component: Subscribe, meta: { requiresAuth: true } },
  { path: '/cv-builder',        component: CVBuilder, meta: { requiresAuth: true } },
  { path: '/ai-match',          component: AIMatch,   meta: { requiresAuth: true } },
  { path: '/blog',              component: Blog },
  { path: '/blog/:slug',        component: BlogPost },
  { path: '/referral',          component: Referral, meta: { requiresAuth: true } },
  { path: '/forgot',           component: Forgot },
  { path: '/reset',            component: Reset },
  { path: '/profile/:id',      component: Profile },
  { path: '/profile',          component: Profile },
  { path: '/company/:id',      component: Company },
  { path: '/messages',         component: Messages,        meta: { requiresAuth: true } },
  { path: '/payment-callback', component: PaymentCallback },
  { path: '/workers',          component: Workers, meta: { requiresAuth: true } },
  { path: '/post',             component: PostJob,   meta: { requiresAuth: true } },
  { path: '/dashboard',        component: Dashboard, meta: { requiresAuth: true } },
  { path: '/admin',            component: Admin,     meta: { requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) return '/register'
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/'

  // If logged in but not subscribed or subscription expired, block protected pages
  const freeRoutes = ['/subscribe', '/welcome', '/login', '/register', '/forgot', '/reset', '/']
  if (auth.user && !freeRoutes.includes(to.path)) {
    const isActive  = auth.profile?.subscription_active === true
    const expiresAt = auth.profile?.subscription_expires_at
    const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false

    if (!isActive || isExpired) {
      // Auto-deactivate if expired
      if (isExpired && isActive) {
        auth.profile.subscription_active = false
      }
      return '/subscribe'
    }
  }
})

export default router
