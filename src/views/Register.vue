<template>
  <div class="auth-page">
    <div class="auth-box">
      <div class="auth-logo" style="position:relative">
        <RouterLink to="/"><img src="/logo.png" alt="TalentHub" /></RouterLink>
        <RouterLink to="/" style="position:absolute;right:0;top:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text-dim);font-size:16px;text-decoration:none;transition:all 0.15s" title="Go back">✕</RouterLink>
      </div>
      <div class="auth-card">
        <h1>Create your account</h1>
        <p>Join thousands of professionals on TalentHub</p>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label class="label">Full Name</label>
          <input class="input" v-model="form.fullName" placeholder="Your full name" />
        </div>
        <div class="form-group">
          <label class="label">Email</label>
          <input class="input" type="email" v-model="form.email" placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label class="label">Password</label>
          <input class="input" type="password" v-model="form.password" placeholder="Min 8 characters" />
        </div>

        <div class="form-group">
          <label class="label">Country</label>
          <select class="input" v-model="form.country">
            <option value="">Select your country…</option>
            <option v-for="c in countries" :key="c.code" :value="c.code">
              {{ c.flag }} {{ c.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="label">I am a…</label>
          <div class="role-grid">
            <button v-for="r in roles" :key="r.id" type="button"
              class="role-btn" :class="{ active: form.role === r.id }"
              @click="form.role = r.id">
              <span class="icon">{{ r.icon }}</span>
              <span>{{ r.label }}</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="label">{{ captchaQ }} = ?</label>
          <input class="input" type="number" v-model="captchaAnswer" placeholder="Your answer" />
        </div>

        <button class="btn btn-primary btn-full" style="margin-top:8px" @click="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Creating account…' : 'Create Account →' }}</span>
        </button>
        <p class="auth-footer">
          Already have an account? <RouterLink to="/login">Sign in</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { COUNTRIES } from '@/utils/countries'

const router   = useRouter()
const loading  = ref(false)
const error    = ref('')
const countries = COUNTRIES
const form     = reactive({ fullName: '', email: '', password: '', role: 'worker', country: '' })
const captchaA      = ref(Math.floor(Math.random() * 10) + 1)
const captchaB      = ref(Math.floor(Math.random() * 10) + 1)
const captchaAnswer = ref('')
const captchaQ      = computed(() => `${captchaA.value} + ${captchaB.value}`)

const roles    = [
  { id:'worker',   icon:'👤', label:'Job Seeker' },
  { id:'employer', icon:'🏢', label:'Employer' },
]

async function submit() {
  if (!form.fullName || !form.email || !form.password) { error.value = 'Please fill all fields.'; return }
  if (parseInt(captchaAnswer.value) !== captchaA.value + captchaB.value) { error.value = 'Captcha incorrect. Please solve the math question.'; return }
  if (!form.country) { error.value = 'Please select your country.'; return }
  if (form.password.length < 8) { error.value = 'Password must be at least 8 characters.'; return }
  loading.value = true; error.value = ''

  const { data, error: err } = await supabase.auth.signUp({
    email: form.email, password: form.password,
    options: { emailRedirectTo: `${import.meta.env.VITE_APP_URL}/login?confirmed=true` }
  })
  if (err) { error.value = err.message; loading.value = false; return }

  if (data.user) {
    await supabase.from('profiles').insert({
      id:        data.user.id,
      full_name: form.fullName,
      email:     form.email,
      role:      form.role,
      country:   form.country,
    })
    await supabase.from('job_alerts').insert({ user_id: data.user.id, email: form.email, active: true })
  }

  loading.value = false
  router.push('/welcome')
}
</script>
