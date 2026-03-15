<template>
  <div class="auth-page">
    <div class="auth-box">
      <div class="auth-logo">
        <RouterLink to="/"><img src="/logo.svg" alt="TalentHub" /></RouterLink>
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
import { ref, reactive, onMounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'

const router    = useRouter()
const route     = useRoute()
const loading   = ref(false)
const error     = ref('')
const confirmed = ref(false)
const form      = reactive({ email: '', password: '' })

onMounted(() => { if (route.query.confirmed) confirmed.value = true })

async function submit() {
  error.value = ''; loading.value = true
  const { error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
  loading.value = false
  if (err) { error.value = err.message; return }
  await auth.init()
  router.push('/dashboard')
}
</script>
