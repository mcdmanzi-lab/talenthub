<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">⭐ Feature Your Profile</div>
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>

        <p style="font-size:13px;color:var(--text-dim);margin-bottom:20px">
          Get featured at the top of the workers page and get noticed by more employers.
        </p>

        <!-- Plans -->
        <div class="fw-plans">
          <div v-for="plan in plans" :key="plan.days"
            class="fw-plan" :class="{ active: selectedPlan === plan.days }"
            @click="selectedPlan = plan.days">
            <div class="fw-plan-days">{{ plan.days }} days</div>
            <div class="fw-plan-price">{{ formatAmount(plan.amount, userCountry) }}</div>
            <div class="fw-plan-desc">{{ plan.desc }}</div>
          </div>
        </div>

        <!-- Payment method -->
        <div class="form-group" style="margin-top:16px">
          <label class="label">Pay with</label>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
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
            <label class="label">{{ payMethod === 'mtn' ? 'MTN' : 'Airtel' }} Number</label>
            <input class="input" v-model="payPhone" placeholder="07XXXXXXXX" />
          </div>
        </template>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <button class="btn btn-primary btn-full" style="margin-top:16px" @click="pay" :disabled="paying">
          <span v-if="paying" class="spinner"></span>
          <span>{{ paying ? 'Processing…' : `Pay ${formatAmount(selectedAmount, userCountry)} & Feature Me` }}</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { getCountry, formatAmount } from '@/utils/countries'
import { initiatePesapalPayment } from '@/utils/pesapal'

const props = defineProps({ show: Boolean })
const emit  = defineEmits(['close', 'featured'])

const paying      = ref(false)
const error       = ref('')
const payPhone    = ref('')
const payMethod   = ref('mtn')
const selectedPlan = ref(7)

const userCountry = computed(() => auth.profile?.country || 'RW')
const baseFee     = computed(() => getCountry(userCountry.value).workerFee)

const plans = computed(() => [
  { days: 7,  amount: Math.round(baseFee.value * 0.5),  desc: 'Good visibility' },
  { days: 14, amount: Math.round(baseFee.value * 0.8),  desc: 'Better visibility' },
  { days: 30, amount: Math.round(baseFee.value * 1.2),  desc: 'Maximum visibility' },
])

const selectedAmount = computed(() => plans.value.find(p => p.days === selectedPlan.value)?.amount || 0)

const payMethods = [
  { id:'mtn',     icon:'📱', label:'MTN MoMo' },
  { id:'airtel',  icon:'📱', label:'Airtel Money' },
  { id:'pesapal', icon:'💳', label:'Card' },
]

async function pay() {
  paying.value = true; error.value = ''
  try {
    const until = new Date()
    until.setDate(until.getDate() + selectedPlan.value)

    if (payMethod.value === 'mtn' || payMethod.value === 'airtel') {
      await supabase.from('profiles').update({
        featured_worker: true,
        featured_worker_until: until.toISOString()
      }).eq('id', auth.user.id)
      if (auth.profile) {
        auth.profile.featured_worker = true
        auth.profile.featured_worker_until = until.toISOString()
      }
      toast.success(`Profile featured for ${selectedPlan.value} days!`)
      emit('featured')
      emit('close')
      paying.value = false
      return
    }

    const nameParts = (auth.profile?.full_name || 'User').split(' ')
    const result = await initiatePesapalPayment({
      amount:      selectedAmount.value,
      description: `TalentHub featured worker - ${selectedPlan.value} days`,
      email:       auth.user.email,
      phone:       payPhone.value || '',
      firstName:   nameParts[0] || 'User',
      lastName:    nameParts[1] || '',
    })

    paying.value = false
    if (result.success) {
      window.location.href = result.redirectUrl
    } else {
      error.value = result.error || 'Payment failed.'
    }
  } catch (err) {
    error.value = 'Something went wrong.'
    paying.value = false
  }
}
</script>

<style scoped>
.fw-plans { display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px; }
.fw-plan  { padding:14px;border-radius:var(--radius);border:2px solid var(--border);cursor:pointer;transition:all 0.15s;text-align:center; }
.fw-plan:hover { border-color:var(--border2); }
.fw-plan.active { border-color:var(--yellow);background:var(--yellow-dim); }
.fw-plan-days  { font-size:16px;font-weight:700;margin-bottom:4px; }
.fw-plan-price { font-size:13px;color:var(--green);font-weight:600;margin-bottom:2px; }
.fw-plan-desc  { font-size:11px;color:var(--text-ghost); }
.pay-btn {
  padding:10px 8px;border-radius:var(--radius);border:1px solid var(--border);
  background:var(--surface2);color:var(--text-dim);font-size:12px;cursor:pointer;
  transition:all 0.15s;display:flex;flex-direction:column;align-items:center;gap:4px;
}
.pay-btn.selected { border-color:var(--accent);background:var(--accent-bg);color:var(--text); }
</style>
