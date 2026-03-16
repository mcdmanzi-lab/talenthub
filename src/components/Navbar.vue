<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <div class="navbar-left">
        <RouterLink to="/" style="display:flex;align-items:center;gap:8px;text-decoration:none">
          <img src="/logo.png" alt="TalentHub" style="height:32px;width:auto" />
        </RouterLink>
        <div class="navbar-links nav-md-show">
          <RouterLink to="/jobs"    class="nav-link">{{ t(lang, 'browse_jobs') }}</RouterLink>
          <RouterLink to="/workers" class="nav-link">{{ t(lang, 'find_workers') }}</RouterLink>
        </div>
      </div>

      <div class="navbar-right">
        <!-- Language Switcher -->
        <div class="lang-switcher" ref="langRef">
          <button class="lang-btn" @click="langOpen = !langOpen" :title="currentLang.name">
            🌐 <span class="nav-md-show">{{ currentLang.name }}</span>
          </button>
          <div v-if="langOpen" class="lang-dropdown">
            <button v-for="l in languages" :key="l.code"
              class="lang-option" :class="{ active: lang === l.code }"
              @click="changeLang(l.code)">
              {{ l.flag }} {{ l.name }}
            </button>
          </div>
        </div>

        <template v-if="!auth.user">
          <RouterLink to="/login"    class="btn btn-ghost btn-sm">{{ t(lang, 'sign_in') }}</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">{{ t(lang, 'get_started') }}</RouterLink>
        </template>
        <template v-else>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="btn btn-ghost btn-sm">{{ t(lang, 'admin') }}</RouterLink>
          <RouterLink to="/messages" class="btn btn-ghost btn-sm nav-md-show">{{ t(lang, 'messages') }}</RouterLink>
          <RouterLink to="/post"     class="btn btn-ghost btn-sm nav-md-show">{{ t(lang, 'post_job') }}</RouterLink>
          <Notifications />
          <div style="display:flex;align-items:center;gap:8px;cursor:pointer" @click="router.push('/dashboard')">
            <div class="nav-avatar">{{ initials }}</div>
            <span style="font-size:14px;color:#d1d5db;" class="nav-md-show">{{ auth.profile?.full_name?.split(' ')[0] }}</span>
          </div>
        </template>
      </div>
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

const router   = useRouter()
const lang     = ref(getLang())
const langOpen = ref(false)
const langRef  = ref(null)
const languages = LANGUAGES

const currentLang = computed(() => languages.find(l => l.code === lang.value) || languages[0])

const initials = computed(() => {
  const name = auth.profile?.full_name || auth.user?.email || '?'
  return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
})

function changeLang(code) {
  setLang(code)
  lang.value = code
  langOpen.value = false
  window.dispatchEvent(new CustomEvent('lang-changed', { detail: code }))
}

function handleClickOutside(e) {
  if (langRef.value && !langRef.value.contains(e.target)) langOpen.value = false
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.nav-md-show { display: none; }
@media (min-width: 768px) { .nav-md-show { display: flex; } }

.lang-switcher { position: relative; }
.lang-btn {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; padding: 6px 10px; color: #a0a0b0;
  font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.lang-btn:hover { background: rgba(255,255,255,0.1); color: #f0f0f5; }
.lang-dropdown {
  position: absolute; right: 0; top: calc(100% + 8px);
  background: #111118; border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px; padding: 6px; min-width: 180px;
  z-index: 100; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.lang-option {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 10px; border-radius: 8px; font-size: 13px;
  color: #a0a0b0; background: none; border: none; cursor: pointer;
  transition: all 0.1s; text-align: left;
}
.lang-option:hover { background: rgba(255,255,255,0.05); color: #f0f0f5; }
.lang-option.active { background: rgba(37,99,235,0.1); color: #60a5fa; }
</style>
