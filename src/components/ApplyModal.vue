<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">Apply — {{ job?.title }}</div>
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>

        <!-- Step 1: Payment -->
        <template v-if="step==='payment'">
          <div class="apply-fee-banner">
            <div>
              <div class="fee-amount">10,000 RWF</div>
              <div class="fee-desc">Application fee · One-time · Non-refundable</div>
            </div>
            <div class="fee-why">This fee keeps applications serious and helps maintain platform quality.</div>
          </div>

          <div class="payment-methods" style="margin-top:16px">
            <div class="pm-title">Pay with</div>
            <div class="pm-options">
              <button v-for="m in payMethods" :key="m.id"
                class="pm-btn" :class="{selected: payMethod===m.id}"
                @click="payMethod=m.id">
                <span>{{ m.icon }}</span><span>{{ m.label }}</span>
              </button>
            </div>
          </div>

          <div class="form-group" style="margin-top:12px" v-if="payMethod!=='bank'">
            <label class="label">Mobile Number</label>
            <input class="input" v-model="payPhone" placeholder="07XXXXXXXX" />
          </div>

          <div v-if="payError" class="alert alert-error" style="margin-top:10px">{{ payError }}</div>

          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
            <button class="btn btn-primary" style="flex:1" @click="payAndApply" :disabled="paying">
              <span v-if="paying" class="spinner"></span>
              <span>{{ paying ? 'Processing…' : 'Pay 10,000 RWF & Apply →' }}</span>
            </button>
          </div>
        </template>

        <!-- Step 2: Application form -->
        <template v-else-if="step==='form'">
          <div class="paid-badge" style="margin-bottom:14px">✅ Payment confirmed</div>

          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="form-group">
              <label class="label">Cover Letter *</label>
              <textarea class="input" v-model="form.cover_letter" rows="5"
                placeholder="Tell the employer why you're a great fit for this role…" />
            </div>

            <div class="form-group">
              <label class="label">CV / Resume</label>
              <div class="cv-drop"
                :class="{dragging: isDragging}"
                @dragover.prevent="isDragging=true"
                @dragleave="isDragging=false"
                @drop.prevent="onDrop">
                <template v-if="!cvFile && !cvUploading">
                  <div style="font-size:20px;margin-bottom:6px">📄</div>
                  <div style="font-size:12px;color:var(--text-dim)">Drop your CV here or <label style="color:var(--accent);cursor:pointer">browse<input type="file" accept=".pdf,.doc,.docx" style="display:none" @change="onFileSelect" /></label></div>
                  <div style="font-size:11px;color:var(--text-ghost);margin-top:4px">PDF, DOC, DOCX — max 5MB</div>
                </template>
                <template v-else-if="cvUploading">
                  <div class="spinner" style="margin:0 auto"></div>
                  <div style="font-size:12px;color:var(--text-dim);margin-top:8px">Uploading…</div>
                </template>
                <template v-else>
                  <div style="font-size:20px;margin-bottom:6px">✅</div>
                  <div style="font-size:12px;color:var(--green)">{{ cvFile.name }}</div>
                  <button class="btn btn-ghost btn-sm" style="margin-top:8px" @click="cvFile=null;cvUrl=''">Remove</button>
                </template>
              </div>
            </div>
          </div>

          <div v-if="alert.msg" class="alert" :class="`alert-${alert.type}`" style="margin-top:12px">{{ alert.msg }}</div>

          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
            <button class="btn btn-primary" style="flex:1" @click="submit" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              <span>{{ submitting ? 'Submitting…' : 'Submit Application →' }}</span>
            </button>
          </div>
        </template>

        <!-- Step 3: Success -->
        <template v-else-if="step==='done'">
          <div style="text-align:center;padding:20px 0">
            <div style="font-size:3rem;margin-bottom:16px">🎉</div>
            <h2 style="font-size:16px;font-weight:700;margin-bottom:8px">Application Submitted!</h2>
            <p style="font-size:13px;color:var(--text-dim)">The employer will review your application and get back to you.</p>
            <button class="btn btn-primary btn-full" style="margin-top:20px" @click="$emit('close')">Done</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { sendEmail } from '@/utils/email'
import { initiatePesapalPayment } from '@/utils/pesapal'

const props = defineProps({ show: Boolean, job: Object })
defineEmits(['close'])

const step       = ref('payment')
const paying     = ref(false)
const submitting = ref(false)
const isDragging = ref(false)
const cvFile     = ref(null)
const cvUrl      = ref('')
const cvUploading= ref(false)
const payPhone   = ref('')
const payMethod  = ref('mtn')
const payError   = ref('')
const alert      = reactive({ msg: '', type: 'error' })
const form       = reactive({ cover_letter: '' })

const payMethods = [
  { id:'mtn',    icon:'📱', label:'MTN MoMo' },
  { id:'airtel', icon:'📱', label:'Airtel Money' },
  { id:'bank',   icon:'🏦', label:'Bank' },
]

async function payAndApply() {
  paying.value = true; payError.value = ''
  const orderId = 'APP-' + Date.now()

  await supabase.from('job_payments').insert({
    employer_id:   auth.user.id,
    employer_email: auth.user.email,
    amount:        10000,
    type:          'apply_job',
    job_id:        props.job?.id,
    pay_method:    payMethod.value,
    pay_ref:       orderId,
    status:        'pending'
  })

  if (payMethod.value === 'bank') {
    paying.value = false
    step.value = 'form'
    return
  }

  const nameParts = (auth.profile?.full_name || 'User').split(' ')
  const result = await initiatePesapalPayment({
    amount: 10000,
    description: `TalentHub — Apply for ${props.job?.title}`,
    email:    auth.user.email,
    phone:    payPhone.value || auth.profile?.phone || '',
    firstName: nameParts[0],
    lastName:  nameParts[1] || nameParts[0],
    orderId
  })

  paying.value = false
  if (result.success) { window.location.href = result.redirectUrl }
  else { payError.value = 'Payment failed. Try again or use bank transfer.' }
}

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) handleFile(file)
}
function onFileSelect(e) {
  const file = e.target.files[0]
  if (file) handleFile(file)
}
async function handleFile(file) {
  if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return }
  cvFile.value = file
  cvUploading.value = true
  const path = `${auth.user.id}/${props.job?.id}_${Date.now()}.${file.name.split('.').pop()}`
  const { data, error } = await supabase.storage.from('cvs').upload(path, file)
  cvUploading.value = false
  if (error) { toast.error('Upload failed.'); cvFile.value = null; return }
  const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(path)
  cvUrl.value = publicUrl
}

async function submit() {
  if (!form.cover_letter) { alert.msg = 'Please write a cover letter.'; alert.type = 'error'; return }
  submitting.value = true; alert.msg = ''

  // Check duplicate
  const { data: existing } = await supabase.from('applications').select('id')
    .eq('job_id', props.job?.id).eq('applicant_id', auth.user.id).maybeSingle()
  if (existing) { alert.msg = 'You already applied for this job.'; alert.type = 'error'; submitting.value = false; return }

  const { error } = await supabase.from('applications').insert({
    job_id:         props.job?.id,
    applicant_id:   auth.user.id,
    applicant_name: auth.profile?.full_name,
    applicant_email: auth.user.email,
    cover_letter:   form.cover_letter,
    cv_url:         cvUrl.value,
    status:         'pending'
  })

  if (error) { alert.msg = error.message; alert.type = 'error'; submitting.value = false; return }

  // Check max applicants and auto-close
  if (props.job?.max_applicants) {
    const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('job_id', props.job.id)
    if (count >= props.job.max_applicants) {
      await supabase.from('jobs').update({ status: 'closed' }).eq('id', props.job.id)
    }
  }

  // Add notification for employer
  await supabase.from('notifications').insert({
    user_id: props.job?.employer_id,
    type:    'new_application',
    title:   'New Application',
    message: `${auth.profile?.full_name} applied for ${props.job?.title}`,
    link:    '/dashboard'
  })

  // Email employer
  await sendEmail({
    to: props.job?.employer_email,
    subject: `New Application — ${props.job?.title}`,
    html: `<p><strong>${auth.profile?.full_name}</strong> just applied for <strong>${props.job?.title}</strong> on TalentHub.</p><a href="https://talenthub-alpha.vercel.app/dashboard">View Application →</a>`
  })

  submitting.value = false
  step.value = 'done'
  toast.success('Application submitted!')
}
</script>

<style scoped>
.apply-fee-banner {
  background: var(--accent-dim); border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg); padding: 16px 18px;
  display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;
}
.fee-amount { font-size: 24px; font-weight: 700; }
.fee-desc   { font-size: 12px; color: var(--text-dim); margin-top: 3px; }
.fee-why    { font-size: 11px; color: var(--text-ghost); max-width: 200px; line-height: 1.5; }

.paid-badge { display:inline-block; font-size:11px; background:var(--green-dim); color:var(--green); border:1px solid var(--green-border); padding:4px 10px; border-radius:50px; }

.payment-methods {}
.pm-title   { font-size:11px;font-weight:600;color:var(--text-ghost);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px; }
.pm-options { display:flex;gap:8px; }
.pm-btn {
  flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:10px;background:var(--surface2);border:1px solid var(--border);
  border-radius:var(--radius);cursor:pointer;font-size:11px;color:var(--text-dim);transition:border-color .15s;
}
.pm-btn:hover { border-color:var(--border2); }
.pm-btn.selected { border-color:var(--accent);background:var(--accent-dim);color:var(--text); }
.pm-btn span:first-child { font-size:20px; }

.cv-drop {
  border: 2px dashed var(--border2); border-radius: var(--radius-lg);
  padding: 28px; text-align: center; cursor: pointer; transition: border-color .15s;
}
.cv-drop.dragging { border-color: var(--accent); background: var(--accent-dim); }
</style>
