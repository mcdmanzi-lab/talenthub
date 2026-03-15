<template>
  <div class="callback-page">
    <div class="callback-card">
      <RouterLink to="/" style="display:flex;justify-content:center;margin-bottom:24px">
        <img src="/logo.svg" style="height:32px" />
      </RouterLink>
      <div v-if="status==='loading'">
        <div class="spinner" style="width:32px;height:32px;border-width:3px;margin:0 auto 16px"></div>
        <p>Verifying your payment…</p>
      </div>
      <div v-else-if="status==='success'">
        <div class="callback-icon">🎉</div>
        <h1>Payment Successful!</h1>
        <p>Your listing is now active and visible on the job board.</p>
        <RouterLink to="/dashboard" class="btn btn-primary btn-full">Go to Dashboard →</RouterLink>
      </div>
      <div v-else-if="status==='failed'">
        <div class="callback-icon">❌</div>
        <h1>Payment Failed</h1>
        <p>Something went wrong. Please try again.</p>
        <RouterLink to="/dashboard" class="btn btn-primary btn-full">Try Again →</RouterLink>
      </div>
      <div v-else>
        <div class="callback-icon">⏳</div>
        <h1>Payment Pending</h1>
        <p>Your payment is being processed. We'll activate your listing shortly.</p>
        <RouterLink to="/dashboard" class="btn btn-primary btn-full">Go to Dashboard →</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { supabase } from '@/supabase'
import { checkPaymentStatus } from '@/utils/pesapal'

const route  = useRoute()
const status = ref('loading')

onMounted(async () => {
  const orderTrackingId = route.query.OrderTrackingId
  const orderId         = route.query.OrderMerchantReference

  if (!orderTrackingId) { status.value = 'failed'; return }

  try {
    const paymentStatus = await checkPaymentStatus(orderTrackingId)

    if (paymentStatus === 'Completed') {
      const { data: req } = await supabase.from('featured_requests').select('*').eq('pay_ref', orderId).maybeSingle()
      if (req) {
        const until = new Date()
        until.setDate(until.getDate() + req.days)
        await supabase.from('jobs').update({ featured: true, featured_until: until.toISOString() }).eq('id', req.job_id)
        await supabase.from('featured_requests').update({ status: 'completed' }).eq('pay_ref', orderId)
      }
      status.value = 'success'
    } else if (paymentStatus === 'Failed') {
      status.value = 'failed'
    } else {
      status.value = 'pending'
    }
  } catch {
    status.value = 'pending'
  }
})
</script>
