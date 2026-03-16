<template>
  <div class="auth-page">
    <div class="auth-box">
      <div class="auth-logo">
        <RouterLink to="/"><img src="/logo.png" /></RouterLink>
      </div>
      <div class="auth-card">
        <h1>Reset password</h1>
        <p>Enter your email to receive a reset link.</p>
        <div v-if="msg"   class="alert alert-success">{{ msg }}</div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <template v-if="!msg">
          <div class="form-group">
            <label class="label">Email</label>
            <input class="input" type="email" v-model="email" placeholder="you@example.com" />
          </div>
          <button class="btn btn-primary btn-full" @click="submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'Sending…' : 'Send Reset Link' }}</span>
          </button>
        </template>
        <p class="auth-footer"><RouterLink to="/login">← Back to login</RouterLink></p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '@/supabase'
const email = ref(''); const loading = ref(false); const msg = ref(''); const error = ref('')
async function submit() {
  loading.value = true; error.value = ''
  const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, { redirectTo: `${import.meta.env.VITE_APP_URL}/reset` })
  loading.value = false
  if (err) { error.value = err.message; return }
  msg.value = '✅ Reset link sent! Check your email.'
}
</script>
