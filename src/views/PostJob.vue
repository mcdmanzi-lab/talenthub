<template>
  <div>
    <Navbar />
    <div class="post-page">

      <!-- Payment Gate -->
      <div v-if="step==='payment'" class="post-card">
        <div class="post-header">
          <h1 class="post-title">Post a Job</h1>
          <p class="post-sub">Reach thousands of qualified candidates in your country.</p>
        </div>

        <div class="pricing-banner">
          <div class="pb-left">
            <div class="pb-price">30,000 RWF</div>
            <div class="pb-desc">Monthly subscription fee · 30 days visibility · Admin reviewed</div>
          </div>
          <div class="pb-features">
            <span>✓ Listed for 30 days</span>
            <span>✓ Featured in search</span>
            <span>✓ Set applicant limit</span>
            <span>✓ Email notifications to all users</span>
          </div>
        </div>

        <div class="payment-methods" style="margin-top:20px">
          <div class="pm-title">Pay with</div>
          <div class="pm-options">
            <button v-for="m in payMethods" :key="m.id"
              class="pm-btn" :class="{selected: payMethod===m.id}"
              @click="payMethod=m.id">
              <span>{{ m.icon }}</span>
              <span>{{ m.label }}</span>
            </button>
          </div>
        </div>

        <template v-if="payMethod==='mtn'||payMethod==='airtel'">
          <div class="form-group" style="margin-top:16px">
            <label class="label">{{ payMethod==='mtn'?'MTN':'Airtel' }} Mobile Number</label>
            <input class="input" v-model="payPhone" placeholder="07XXXXXXXX" />
          </div>
        </template>

        <div v-if="payError" class="alert alert-error" style="margin-top:12px">{{ payError }}</div>

        <div class="post-actions">
          <RouterLink to="/dashboard" class="btn btn-ghost">Cancel</RouterLink>
          <button class="btn btn-primary" @click="payAndContinue" :disabled="paying">
            <span v-if="paying" class="spinner"></span>
            <span>{{ paying ? 'Processing…' : 'Pay 30,000 RWF & Continue →' }}</span>
          </button>
        </div>
      </div>

      <!-- Job Form -->
      <div v-else-if="step==='form'" class="post-card">
        <div class="post-header">
          <div class="paid-badge">✅ Payment confirmed — fill in your job details</div>
          <h1 class="post-title">{{ isEdit ? 'Edit Job' : 'Post a New Job' }}</h1>
          <p class="post-sub">Your listing goes live after admin review — usually within the hour.</p>
        </div>

        <div v-if="alert.msg" class="alert" :class="`alert-${alert.type}`" style="margin-bottom:20px">{{ alert.msg }}</div>

        <div class="form-grid">
          <div class="form-group">
            <label class="label">Job Title *</label>
            <input class="input" v-model="form.title" placeholder="e.g. Frontend Developer" />
          </div>
          <div class="form-group">
            <label class="label">Company Name *</label>
            <input class="input" v-model="form.company" placeholder="Your company name" />
          </div>
          <div class="form-group">
            <label class="label">Location *</label>
            <input class="input" v-model="form.location" placeholder="e.g. Kigali, Rwanda" />
          </div>
          <div class="form-group">
            <label class="label">Salary Range</label>
            <input class="input" v-model="form.salary" placeholder="e.g. 300,000 – 600,000 RWF" />
          </div>
          <div class="form-group">
            <label class="label">Job Type *</label>
            <select class="input" v-model="form.type">
              <option value="">Select type…</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Freelance</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Category *</label>
            <select class="input" v-model="form.category">
              <option value="">Select category…</option>
              <option value="tech">Web & Tech</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="writing">Writing</option>
              <option value="management">Management</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Max Applicants <span style="color:var(--text-ghost)">(optional — job auto-closes when reached)</span></label>
            <input class="input" v-model.number="form.max_applicants" type="number" min="1" placeholder="e.g. 50" />
          </div>
        </div>

        <div class="form-group" style="margin-top:14px">
          <label class="label">Job Description *</label>
          <textarea class="input" v-model="form.description" rows="7"
            placeholder="Describe the role, responsibilities, and what you're looking for…"></textarea>
        </div>

        <div class="form-group" style="margin-top:14px">
          <label class="label">Required Skills</label>
          <div class="tags-input">
            <span v-for="tag in tags" :key="tag" class="tag-chip">
              {{ tag }}<button @click="removeTag(tag)">×</button>
            </span>
            <input class="tag-text-input" v-model="tagInput"
              placeholder="Type a skill and press Enter…"
              @keydown.enter.prevent="addTag"
              @keydown.comma.prevent="addTag" />
          </div>
        </div>

        <div class="form-group" style="margin-top:14px">
          <label class="label">WhatsApp Number <span style="color:var(--text-ghost)">(optional — lets workers apply via WhatsApp)</span></label>
          <input class="input" v-model="form.whatsapp_number" placeholder="e.g. 0781234567" />
        </div>

        <div class="form-check" style="margin-top:14px">
          <label class="check-item">
            <input type="checkbox" v-model="form.remote" />
            <span>Remote work allowed</span>
          </label>
        </div>

        <div class="post-actions">
          <RouterLink to="/dashboard" class="btn btn-ghost">Cancel</RouterLink>
          <button class="btn btn-primary" @click="submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'Publishing…' : isEdit ? 'Save Changes →' : 'Publish Job →' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { supabase } from '@/supabase'
import { sanitizeJobForm } from '@/utils/validate'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { initiatePesapalPayment } from '@/utils/pesapal'
import { getCountry, formatAmount } from '@/utils/countries'
import { sendEmail } from '@/utils/email'

const router  = useRouter()
const route   = useRoute()
const loading = ref(false)
const paying  = ref(false)
const payPhone= ref('')
const payMethod=ref('mtn')
const payError= ref('')
const tags    = ref([])
const tagInput= ref('')
const alert   = reactive({ msg: '', type: 'error' })
const isEdit  = computed(() => !!route.query.edit)
const step    = ref(isEdit.value ? 'form' : 'payment')

const payMethods = [
  { id:'mtn',    icon:'📱', label:'MTN MoMo' },
  { id:'airtel', icon:'📱', label:'Airtel Money' },
  { id:'bank',   icon:'🏦', label:'Bank Transfer' },
]

const form = reactive({
  title:'', company:'', location:'', salary:'',
  type:'', category:'', description:'', remote: false,
  max_applicants: null
})

onMounted(async () => {
  if (isEdit.value) {
    const { data } = await supabase.from('jobs').select('*').eq('id', route.query.edit).single()
    if (data) {
      Object.assign(form, {
        title: data.title, company: data.company, location: data.location,
        salary: data.salary, type: data.type, category: data.category,
        description: data.description, remote: data.remote,
        max_applicants: data.max_applicants,
        whatsapp_number: data.whatsapp_number
      })
      tags.value = data.tags || []
    }
  }
})

async function payAndContinue() {
  paying.value = true; payError.value = ''
  const orderId = 'POST-' + Date.now()

  // Save payment record
  await supabase.from('job_payments').insert({
    employer_id:   auth.user.id,
    employer_email: auth.user.email,
    amount:        30000,
    type:          'post_job',
    pay_method:    payMethod.value,
    pay_ref:       orderId,
    status:        'pending'
  })

  if (payMethod.value === 'bank') {
    paying.value = false
    step.value = 'form'
    toast.success('Bank transfer noted. Post your job and pay before going live.')
    return
  }

  const nameParts = (auth.profile?.full_name || 'User').split(' ')
  const result = await initiatePesapalPayment({
    amount:      30000,
    description: 'TalentHub — Post a Job (30 days)',
    email:       auth.user.email,
    phone:       payPhone.value || auth.profile?.phone || '',
    firstName:   nameParts[0],
    lastName:    nameParts[1] || nameParts[0],
    orderId
  })

  paying.value = false

  if (result.success) {
    window.location.href = result.redirectUrl
  } else {
    payError.value = 'Payment failed. Please try again or use bank transfer.'
  }
}

function addTag() {
  const v = tagInput.value.trim().replace(',','')
  if (v && !tags.value.includes(v)) tags.value.push(v)
  tagInput.value = ''
}
function removeTag(tag) { tags.value = tags.value.filter(t => t !== tag) }

async function submit() {
  // ✅ Sanitize + validate all fields before touching the DB
  const { cleaned, errors } = sanitizeJobForm({ ...form })
  if (errors.length) { alert.msg = errors[0]; alert.type = 'error'; return }

  loading.value = true; alert.msg = ''

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  if (isEdit.value) {
    const { error } = await supabase.from('jobs').update({
      ...cleaned, tags: tags.value.map(t => t.slice(0, 40))
    }).eq('id', route.query.edit).eq('employer_id', auth.user.id)
    loading.value = false
    if (error) { alert.msg = error.message; return }
    toast.success('Job updated!')
    router.push('/dashboard')
    return
  }

  const { data: job, error } = await supabase.from('jobs').insert({
    employer_id:    auth.user.id,
    employer_name:  auth.profile?.full_name || '',
    employer_email: auth.user.email,
    ...cleaned,
    tags: tags.value.map(t => t.slice(0, 40)),
    status: 'pending',
    expires_at: expiresAt.toISOString()
  }).select().single()

  loading.value = false
  if (error) { alert.msg = error.message; alert.type = 'error'; return }

  // Notify all users with job alerts
  notifyAllUsers(job)

  toast.success('Job submitted for review!')
  router.push('/dashboard')
}

async function notifyAllUsers(job) {
  try {
    const { data: alerts } = await supabase.from('job_alerts').select('email').eq('active', true)
    if (!alerts?.length) return
    for (const a of alerts) {
      await sendEmail({
        to: a.email,
        subject: `New Job: ${job.title} at ${job.company} — TalentHub`,
        html: `
          <p>Hi there!</p>
          <p>A new job matching your alerts was just posted on TalentHub:</p>
          <h2>${job.title}</h2>
          <p><strong>${job.company}</strong> · ${job.location} · ${job.type}</p>
          <p>${job.description?.slice(0, 200)}…</p>
          <a href="https://talenthub-alpha.vercel.app/jobs" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">View Job →</a>
          <p style="color:#999;font-size:12px;margin-top:20px">You're receiving this because you enabled job alerts on TalentHub.</p>
        `
      })
    }
  } catch (e) { console.warn('Notify error:', e) }
}
</script>


