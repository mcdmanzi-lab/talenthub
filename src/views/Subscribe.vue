<template>
  <div class="subscribe-page">
    <div class="subscribe-card">

      <!-- Logo -->
      <div style="text-align:center;margin-bottom:24px">
        <img src="/logo.png" alt="TalentHub" style="height:36px" />
      </div>

      <div class="sub-badge">Monthly Subscription Required</div>

      <h1 class="sub-title">Activate Your Account</h1>
      <p class="sub-desc">
        To access TalentHub, a monthly subscription is required.
        This keeps the platform spam-free and ensures only serious
        {{ role === 'employer' ? 'employers' : 'job seekers' }} are listed.
      </p>

      <!-- Plan -->
      <div class="sub-plan">
        <div class="sub-plan-left">
          <div class="sub-plan-icon">{{ role === 'employer' ? '🏢' : '👤' }}</div>
          <div>
            <div class="sub-plan-name">{{ role === 'employer' ? 'Employer Plan' : 'Job Seeker Plan' }}</div>
            <div class="sub-plan-desc">{{ role === 'employer' ? 'Post jobs, find workers, manage applicants' : 'Apply to jobs, build profile, get hired' }}</div>
          </div>
        </div>
        <div class="sub-plan-price">
          {{ formatAmount(planAmount, userCountry) }}
          <span>/mo</span>
        </div>
      </div>

      <!-- Features -->
      <div class="sub-features">
        <template v-if="role === 'employer'">
          <div class="sub-feat">✓ Post unlimited jobs</div>
          <div class="sub-feat">✓ Browse all worker profiles</div>
          <div class="sub-feat">✓ Receive applications with CVs</div>
          <div class="sub-feat">✓ Message workers directly</div>
          <div class="sub-feat">✓ Featured job listings available</div>
        </template>
        <template v-else>
          <div class="sub-feat">✓ Browse all job listings</div>
          <div class="sub-feat">✓ Apply with your CV</div>
          <div class="sub-feat">✓ Public profile for employers to find you</div>
          <div class="sub-feat">✓ Job alert notifications</div>
          <div class="sub-feat">✓ Direct messaging with employers</div>
        </template>
      </div>

      <!-- Payment method -->
      <div class="form-group" style="margin-top:20px">
        <label class="label">Pay with</label>
        <div class="pay-methods">
          <button v-for="m in payMethods" :key="m.id"
            class="pay-btn" :class="{ selected: payMethod === m.id }"
            @click="payMethod = m.id">
            <span>{{ m.icon }}</span>
            <span>{{ m.label }}</span>
          </button>
        </div>
      </div>

      <template v-if="payMethod === 'mtn' || payMethod === 'airtel'">
        <div class="form-group">
          <label class="label">{{ payMethod === 'mtn' ? 'MTN' : 'Airtel' }} Mobile Number</label>
          <input class="input" v-model="payPhone" placeholder="07XXXXXXXX" />
        </div>
      </template>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <button class="btn btn-primary btn-full btn-lg" style="margin-top:16px" @click="pay" :disabled="paying">
        <span v-if="paying" class="spinner"></span>
        <span>{{ paying ? 'Processing…' : `Pay ${formatAmount(planAmount, userCountry)} & Activate` }}</span>
      </button>

      <div style="text-align:center;margin-top:16px">
        <button @click="logout" style="background:none;border:none;color:var(--text-ghost);font-size:13px;cursor:pointer">
          Sign out and use a different account
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { initiatePesapalPayment } from '@/utils/pesapal'
import { getCountry, formatAmount, COUNTRIES } from '@/utils/countries'

const router  = useRouter()
const paying  = ref(false)
const error   = ref('')
const payPhone = ref('')
const payMethod = ref('mtn')

const role       = computed(() => auth.profile?.role || 'worker')
const userCountry = computed(() => auth.profile?.country || 'RW')
const planAmount  = computed(() => role.value === 'employer' ? getCountry(userCountry.value).monthlyFee : getCountry(userCountry.value).workerFee)
const isExpired   = computed(() => {
  const exp = auth.profile?.subscription_expires_at
  return exp ? new Date(exp) < new Date() : false
})

const payMethods = [
  { id:'mtn',    icon:'📱', label:'MTN MoMo' },
  { id:'airtel', icon:'📱', label:'Airtel Money' },
  { id:'pesapal',icon:'💳', label:'Card / PesaPal' },
]

onMounted(() => {
  // If already subscribed, redirect to dashboard
  if (auth.profile?.subscription_active) router.push('/dashboard')
})

async function pay() {
  paying.value = true; error.value = ''

  try {
    const orderId = 'SUB-' + Date.now()

    // Save payment record — ignore errors so they don't block payment
    await supabase.from('job_payments').insert({
      employer_id:    auth.user.id,
      employer_email: auth.user.email,
      amount:         planAmount.value,
      pay_method:     payMethod.value,
      pay_phone:      payPhone.value || null,
      pay_ref:        orderId,
      status:         'pending',
    }).then(() => {}).catch(() => {})

    if (payMethod.value === 'mtn' || payMethod.value === 'airtel') {
      // Mobile money — admin confirms manually, give provisional access
      // If renewing, extend from today; if first time, start from now
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await supabase.from('profiles').update({
        subscription_active: true,
        subscription_expires_at: newExpiry
      }).eq('id', auth.user.id)
      if (auth.profile) {
        auth.profile.subscription_active = true
        auth.profile.subscription_expires_at = newExpiry
      }
      paying.value = false
      router.push('/dashboard')
      return
    }

    // PesaPal card payment
    const nameParts = (auth.profile?.full_name || 'User').split(' ')
    const result = await initiatePesapalPayment({
      amount:      planAmount.value,
      description: `TalentHub ${role.value} subscription`,
      email:       auth.user.email,
      phone:       payPhone.value || '',
      firstName:   nameParts[0] || 'User',
      lastName:    nameParts[1] || '',
    })

    paying.value = false
    if (result.success && result.redirectUrl) {
      window.location.href = result.redirectUrl
    } else {
      error.value = result.error || 'Card payment failed. Please try MTN or Airtel instead.'
    }

  } catch (err) {
    paying.value = false
    error.value = 'Something went wrong. Please try again.'
    console.error('Pay error:', err)
  }
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.subscribe-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
}
.subscribe-card {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 36px 32px;
}
.sub-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: rgba(234,179,8,0.1);
  color: var(--yellow);
  border: 1px solid rgba(234,179,8,0.3);
  border-radius: 50px;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 16px;
}
.sub-title { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.sub-desc  { font-size: 14px; color: var(--text-dim); margin-bottom: 20px; line-height: 1.6; }
.sub-plan  {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px; margin-bottom: 16px;
}
.sub-plan-left { display: flex; align-items: center; gap: 12px; }
.sub-plan-icon { font-size: 24px; }
.sub-plan-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.sub-plan-desc { font-size: 12px; color: var(--text-dim); }
.sub-plan-price { font-size: 22px; font-weight: 700; color: var(--green); white-space: nowrap; }
.sub-plan-price span { font-size: 13px; color: var(--text-dim); font-weight: 400; }
.sub-features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
.sub-feat { font-size: 13px; color: var(--text-dim); }
.pay-methods { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 6px; }
.pay-btn {
  padding: 10px 8px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--surface2); color: var(--text-dim);
  font-size: 12px; cursor: pointer; transition: all 0.15s;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.pay-btn:hover { border-color: var(--border2); }
.pay-btn.selected { border-color: var(--accent); background: var(--accent-bg); color: var(--text); }
</style>
