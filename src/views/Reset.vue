<template>
  <div class="auth-page">
    <div class="auth-box">
      <div class="auth-logo">
        <RouterLink to="/"><img src="/logo.svg" /></RouterLink>
      </div>
      <div class="auth-card">
        <h1>New password</h1>
        <p>Choose a new password for your account.</p>
        <div v-if="success" class="alert alert-success">Password updated! <RouterLink to="/login" style="color:#60a5fa">Sign in →</RouterLink></div>
        <div v-if="error"   class="alert alert-error">{{ error }}</div>
        <template v-if="!success">
          <div class="form-group">
            <label class="label">New Password</label>
            <input class="input" type="password" v-model="password" placeholder="Min 8 characters" />
          </div>
          <button class="btn btn-primary btn-full" @click="submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'Updating…' : 'Update Password' }}</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '@/supabase'
const password = ref(''); const loading = ref(false); const success = ref(false); const error = ref('')
onMounted(() => {
  const hash = window.location.hash
  if (hash) {
    const params = new URLSearchParams(hash.slice(1))
    const access = params.get('access_token')
    if (access) supabase.auth.setSession({ access_token: access, refresh_token: params.get('refresh_token') || '' })
  }
})
async function submit() {
  if (password.value.length < 8) { error.value = 'Min 8 characters'; return }
  loading.value = true
  const { error: err } = await supabase.auth.updateUser({ password: password.value })
  loading.value = false
  if (err) { error.value = err.message; return }
  success.value = true
}
</script>
