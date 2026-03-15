<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <div class="navbar-left">
        <RouterLink to="/" style="display:flex;align-items:center;gap:8px;text-decoration:none">
          <img src="/logo.svg" alt="TalentHub Rwanda" style="height:32px;width:auto" />
        </RouterLink>
        <div class="navbar-links" style="display:none" id="navbar-links-md">
          <RouterLink to="/jobs"    class="nav-link">Browse Jobs</RouterLink>
          <RouterLink to="/workers" class="nav-link">Find Workers</RouterLink>
        </div>
      </div>
      <div class="navbar-right">
        <template v-if="!auth.user">
          <RouterLink to="/login"    class="btn btn-ghost btn-sm">Sign In</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">Get Started</RouterLink>
        </template>
        <template v-else>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="btn btn-ghost btn-sm">Admin</RouterLink>
          <RouterLink to="/messages" class="btn btn-ghost btn-sm" style="display:none" id="nav-messages">Messages</RouterLink>
          <RouterLink to="/post"     class="btn btn-ghost btn-sm" style="display:none" id="nav-post">Post Job</RouterLink>
          <Notifications />
          <div style="display:flex;align-items:center;gap:8px;cursor:pointer" @click="router.push('/dashboard')">
            <div class="nav-avatar">{{ initials }}</div>
            <span style="font-size:14px;color:#d1d5db;display:none" id="nav-name">{{ auth.profile?.full_name?.split(' ')[0] }}</span>
          </div>
        </template>
      </div>
    </div>
  </nav>
  <div class="navbar-spacer"></div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Notifications from '@/components/Notifications.vue'
import { auth } from '@/stores/auth'

const router   = useRouter()
const initials = computed(() => {
  const name = auth.profile?.full_name || auth.user?.email || '?'
  return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
})
</script>

<style scoped>
@media (min-width: 768px) {
  #navbar-links-md { display: flex !important; }
  #nav-messages    { display: inline-flex !important; }
  #nav-post        { display: inline-flex !important; }
  #nav-name        { display: block !important; }
}
</style>
