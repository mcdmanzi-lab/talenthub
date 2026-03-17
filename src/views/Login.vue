<template>
  <div class="auth-page">
    <div class="auth-box">
      <div class="auth-logo" style="position:relative">
        <RouterLink to="/"><img src="/logo.png" alt="TalentHub" /></RouterLink>
        <RouterLink to="/" style="position:absolute;right:0;top:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text-dim);font-size:16px;text-decoration:none;transition:all 0.15s" title="Go back">✕</RouterLink>
      </div>
      <div class="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to your TalentHub account</p>

        <div v-if="confirmed" class="alert alert-success">✅ Email confirmed! You can now sign in.</div>
        <div v-if="error"     class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label class="label">Email</label>
          <input class="input" type="email" v-model="form.email" placeholder="you@example.com" @keydown.enter="submit" />
        </div>
        <div class="form-group">
          <label class="label">Password</label>
          <input class="input" type="password" v-model="form.password" placeholder="••••••••" @keydown.enter="submit" />
        </div>

        <div class="forgot-link">
          <RouterLink to="/forgot">Forgot password?</RouterLink>
        </div>

        <!-- Simple captcha -->
        <div class="form-group">
          <label class="label">{{ captchaQ }} = ?</label>
          <input class="input" type="number" v-model="captchaAnswer" placeholder="Your answer" />
        </div>

        <button class="btn btn-primary btn-full" @click="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Signing in…' : 'Sign In' }}</span>
        </button>

        <p class="auth-footer">
          No account? <RouterLink to="/register">Create one free</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'

const router    = useRouter()
const route     = useRoute()
const loading   = ref(false)
const error     = ref('')
const confirmed = ref(false)
const form      = reactive({ email: '', password: '' })

// Simple math captcha — no external service needed
const captchaA      = ref(Math.floor(Math.random() * 10) + 1)
const captchaB      = ref(Math.floor(Math.random() * 10) + 1)
const captchaAnswer = ref('')
const captchaQ      = computed(() => `${captchaA.value} + ${captchaB.value}`)

onMounted(() => { if (route.query.confirmed) confirmed.value = true })

async function submit() {
  if (parseInt(captchaAnswer.value) !== captchaA.value + captchaB.value) {
    error.value = 'Captcha incorrect. Please solve the math question.'; return
  }
  error.value = ''; loading.value = true
  const { error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
  loading.value = false
  if (err) { error.value = err.message; return }
  await auth.init()
  // Check subscription status
  if (!auth.profile?.subscription_active) {
    router.push('/subscribe')
  } else {
    router.push('/dashboard')
  }
}
</script>
