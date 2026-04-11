<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal featured-modal">
        <div class="modal-header">
          <div class="modal-title">⚡ Feature Your Job</div>
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>

        <!-- Step 1: Pick plan + job -->
        <template v-if="step===1">
          <p style="font-size:13px;color:var(--text-dim);margin-bottom:16px">
            Featured jobs appear at the top of the job board with a special badge — getting up to 3× more applicants.
          </p>
          <div class="pricing-cards">
            <div v-for="plan in plans" :key="plan.id"
              class="pricing-card" :class="{selected: selectedPlan?.id===plan.id}"
              @click="selectedPlan=plan">
              <div class="plan-name">{{ plan.name }}</div>
              <div class="plan-price">{{ plan.price }}</div>
              <div class="plan-desc">{{ plan.desc }}</div>
              <div class="plan-features">
                <div v-for="f in plan.features" :key="f" class="plan-feature">✓ {{ f }}</div>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top:20px">
            <label class="label">Select Job to Feature</label>
            <select class="input" v-model="selectedJobId">
              <option value="">Choose a job…</option>
              <option v-for="j in jobs" :key="j.id" :value="j.id">{{ j.title }}</option>
            </select>
          </div>

          <button class="btn btn-primary btn-full" style="margin-top:16px"
            :disabled="!selectedPlan || !selectedJobId" @click="step=2">
            Continue →
          </button>
        </template>

        <!-- Step 2: Confirm & Pay -->
        <template v-else-if="step===2">
          <div class="order-summary">
            <div class="os-row"><span>Plan</span><strong>{{ selectedPlan.name }}</strong></div>
            <div class="os-row"><span>Duration</span><strong>{{ selectedPlan.days }} days featured</strong></div>
            <div class="os-row os-total"><span>Total</span><strong>{{ selectedPlan.price }}</strong></div>
          </div>

          <p style="font-size:12px;color:var(--text-dim);line-height:1.7;margin:14px 0">
            You'll be redirected to <strong>Pesapal</strong> to complete payment securely. 
            Supports MTN MoMo, Airtel Money, and Visa/Mastercard.
          </p>

          <div class="pm-icons">
            <span class="pm-icon">📱 MTN MoMo</span>
            <span class="pm-icon">📱 Airtel Money</span>
            <span class="pm-icon">💳 Visa/Mastercard</span>
          </div>

          <div v-if="errorMsg" class="alert alert-error" style="margin-top:12px">{{ errorMsg }}</div>

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-ghost" @click="step=1">← Back</button>
            <button class="btn btn-primary" style="flex:1" @click="pay" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              <span>{{ submitting ? 'Connecting to Pesapal…' : 'Pay Now →' }}</span>
            </button>
          </div>
        </template>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { initiatePesapalPayment } from '@/utils/pesapal'

const props = defineProps({ show: Boolean })
defineEmits(['close'])

const step          = ref(1)
const jobs          = ref([])
const selectedJobId = ref('')
const selectedPlan  = ref(null)
const submitting    = ref(false)
const errorMsg      = ref('')

const plans = [
  {
    id: 'basic', name: 'Basic Boost', price: '5,000 RWF', amount: 5000, days: 7,
    desc: '1 week featured placement',
    features: ['Top of job board', 'Featured badge', '7 days visibility']
  },
  {
    id: 'pro', name: 'Pro Boost', price: '15,000 RWF', amount: 15000, days: 30,
    desc: '1 month featured placement',
    features: ['Top of job board', 'Featured badge', '30 days visibility', 'Priority support']
  },
  {
    id: 'premium', name: 'Premium', price: '35,000 RWF', amount: 35000, days: 90,
    desc: '3 months + homepage spotlight',
    features: ['Top of job board', 'Featured badge', '90 days visibility', 'Homepage spotlight', 'Priority support']
  }
]

onMounted(async () => {
  const { data } = await supabase.from('jobs').select('id,title').eq('employer_id', auth.user.id).eq('status','approved')
  jobs.value = data || []
})

async function pay() {
  submitting.value = true
  errorMsg.value   = ''

  const orderId = 'TH-' + Date.now()

  // Save request to DB first
  await supabase.from('featured_requests').insert({
    employer_id:    auth.user.id,
    employer_name:  auth.profile?.full_name,
    employer_email: auth.user.email,
    job_id:         selectedJobId.value,
    plan:           selectedPlan.value.name,
    price:          selectedPlan.value.price,
    days:           selectedPlan.value.days,
    pay_method:     'pesapal',
    pay_ref:        orderId,
    status:         'pending'
  })

  // Initiate Pesapal payment
  const nameParts = (auth.profile?.full_name || 'TalentHub User').split(' ')
  const result = await initiatePesapalPayment({
    amount:      selectedPlan.value.amount,
    description: `TalentHub - ${selectedPlan.value.name} for job listing`,
    email:       auth.user.email,
    phone:       auth.profile?.phone || '',
    firstName:   nameParts[0] || 'User',
    lastName:    nameParts[1] || 'User',
    orderId
  })

  submitting.value = false

  if (result.success) {
    // Redirect to Pesapal payment page
    window.location.href = result.redirectUrl
  } else {
    errorMsg.value = 'Could not connect to payment gateway. Please try again.'
    toast.error('Payment failed. Please try again.')
  }
}
</script>

<style scoped>
.featured-modal { max-width: 520px; }

.pricing-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
.pricing-card {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 14px; cursor: pointer; transition: border-color .15s;
}
.pricing-card:hover    { border-color: var(--border2); }
.pricing-card.selected { border-color: var(--accent); background: var(--accent-dim); }
.plan-name    { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); margin-bottom: 6px; }
.plan-price   { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.plan-desc    { font-size: 11px; color: var(--text-ghost); margin-bottom: 10px; }
.plan-features{ display: flex; flex-direction: column; gap: 3px; }
.plan-feature { font-size: 11px; color: var(--text-dim); }

.order-summary {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px;
}
.os-row       { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: var(--text-dim); }
.os-total     { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 10px; color: var(--text); font-size: 14px; }

.pm-icons     { display: flex; gap: 8px; flex-wrap: wrap; }
.pm-icon      {
  font-size: 11px; padding: 6px 10px;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-dim);
}
</style>
