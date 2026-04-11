<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <div class="navbar-left">
        <RouterLink to="/" style="display:flex;align-items:center;gap:8px;text-decoration:none">
          <img src="/logo.png" alt="TalentHub" style="height:30px;width:auto" />
        </RouterLink>
        <div class="navbar-links nav-md-show">
          <RouterLink to="/jobs"    class="nav-link">{{ t(lang, 'browse_jobs') }}</RouterLink>
          <RouterLink to="/workers" class="nav-link">{{ t(lang, 'find_workers') }}</RouterLink>
        </div>
      </div>

      <div class="navbar-right">
        <LangSwitcher @language-changed="onLangChanged" />

        <!-- Desktop buttons -->
        <template v-if="!auth.user">
          <RouterLink to="/login"    class="btn btn-ghost btn-sm nav-md-show">{{ t(lang, 'sign_in') }}</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">{{ t(lang, 'get_started') }}</RouterLink>
        </template>
        <template v-else>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="btn btn-ghost btn-sm nav-md-show">{{ t(lang, 'admin') }}</RouterLink>
          <RouterLink to="/messages" class="btn btn-ghost btn-sm nav-md-show">{{ t(lang, 'messages') }}</RouterLink>
          <RouterLink to="/post"     class="btn btn-ghost btn-sm nav-md-show">{{ t(lang, 'post_job') }}</RouterLink>
          <Notifications />
          <div style="display:flex;align-items:center;gap:8px;cursor:pointer" @click="router.push('/dashboard')">
            <div class="nav-avatar">{{ initials }}</div>
          </div>
        </template>

        <!-- Mobile hamburger -->
        <button class="hamburger nav-mobile-show" @click="mobileOpen = !mobileOpen">
          {{ mobileOpen ? '✕' : '☰' }}
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileOpen" class="mobile-menu">
      <RouterLink to="/jobs"    class="mobile-link" @click="mobileOpen=false">🔍 Browse Jobs</RouterLink>
      <RouterLink to="/workers" class="mobile-link" @click="mobileOpen=false">👥 Find Workers</RouterLink>
      <template v-if="!auth.user">
        <RouterLink to="/login"    class="mobile-link" @click="mobileOpen=false">Sign In</RouterLink>
        <RouterLink to="/register" class="mobile-link mobile-link-accent" @click="mobileOpen=false">Get Started</RouterLink>
      </template>
      <template v-else>
        <RouterLink to="/dashboard" class="mobile-link" @click="mobileOpen=false">📊 Dashboard</RouterLink>
        <RouterLink to="/messages"  class="mobile-link" @click="mobileOpen=false">✉️ Messages</RouterLink>
        <RouterLink to="/post"      class="mobile-link" @click="mobileOpen=false">+ Post Job</RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/admin" class="mobile-link" @click="mobileOpen=false">⚙️ Admin</RouterLink>
      </template>
    </div>
  </nav>
  <div class="navbar-spacer"></div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Notifications from '@/components/Notifications.vue'
import { auth } from '@/stores/auth'
import { t, getLang, setLang, LANGUAGES } from '@/utils/i18n'
import LangSwitcher from '@/components/LangSwitcher.vue'

const router     = useRouter()
const lang       = ref(getLang())
const langOpen   = ref(false)
const mobileOpen = ref(false)
const langRef    = ref(null)
const languages  = LANGUAGES

const currentLang = computed(() => languages.find(l => l.code === lang.value) || languages[0])
const initials    = computed(() => {
  const name = auth.profile?.full_name || auth.user?.email || '?'
  return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
})

function onLangChanged(code) {
  lang.value = code
  window.dispatchEvent(new CustomEvent('lang-changed', { detail: code }))
}

function changeLang(code) {
  setLang(code); lang.value = code; langOpen.value = false
  window.dispatchEvent(new CustomEvent('lang-changed', { detail: code }))
}

function handleClickOutside(e) {
  if (langRef.value && !langRef.value.contains(e.target)) langOpen.value = false
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.nav-md-show     { display: none; }
.nav-mobile-show { display: flex; }
@media (min-width: 768px) {
  .nav-md-show     { display: flex; }
  .nav-mobile-show { display: none; }
}

.hamburger {
  background: none; border: none; color: var(--text-dim);
  font-size: 20px; cursor: pointer; padding: 4px 8px;
  line-height: 1;
}
.hamburger:hover { color: var(--text); }

.mobile-menu {
  display: flex; flex-direction: column;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 8px 0;
}
.mobile-link {
  padding: 12px 20px; font-size: 14px; color: var(--text-dim);
  text-decoration: none; transition: all 0.15s;
  border-bottom: 1px solid var(--border);
}
.mobile-link:hover { background: rgba(255,255,255,0.05); color: var(--text); }
.mobile-link:last-child { border-bottom: none; }
.mobile-link-accent { color: #60a5fa; font-weight: 600; }

.lang-switcher { position: relative; }
.lang-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; padding: 6px 10px; color: var(--text-dim);
  font-size: 14px; cursor: pointer; transition: all 0.15s;
}
.lang-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); }
.lang-dropdown {
  position: absolute; right: 0; top: calc(100% + 8px);
  background: var(--surface); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px; padding: 6px; min-width: 180px;
  z-index: 100; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.lang-option {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 10px; border-radius: 8px; font-size: 13px;
  color: var(--text-dim); background: none; border: none; cursor: pointer;
  transition: all 0.1s; text-align: left;
}
.lang-option:hover  { background: rgba(255,255,255,0.05); color: var(--text); }
.lang-option.active { background: var(--accent-bg); color: #60a5fa; }
</style>
