<template>
  <div class="dash-layout">
    <!-- Sidebar -->
    <aside class="dash-sidebar">
      <div class="dash-brand">
        <img src="/logo.svg" alt="TalentHub" style="height:28px;width:auto" />
      </div>

      <div class="dash-user">
        <div class="dash-avatar">{{ initials }}</div>
        <div>
          <div class="dash-uname">{{ auth.profile?.full_name }}</div>
          <div class="dash-urole">{{ auth.profile?.role || 'worker' }}</div>
        </div>
      </div>

      <nav class="dash-nav">
        <button v-for="tab in tabs" :key="tab.id"
          class="dash-nav-item" :class="{active: activeTab===tab.id}"
          @click="activeTab=tab.id">
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <div style="margin-top:auto">
        <RouterLink :to="'/profile/'+auth.user?.id" class="dash-nav-item">
          <span>👤</span><span>My Profile</span>
        </RouterLink>
        <RouterLink v-if="auth.isEmployer" :to="'/company/'+auth.user?.id" class="dash-nav-item">
          <span>🏢</span><span>Company Page</span>
        </RouterLink>
        <RouterLink to="/messages" class="dash-nav-item">
          <span>✉️</span><span>Messages</span>
        </RouterLink>
        <RouterLink to="/jobs" class="dash-nav-item">
          <span>🔍</span><span>Browse Jobs</span>
        </RouterLink>
        <button class="dash-nav-item danger" @click="logout">
          <span>→</span><span>Sign Out</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="dash-main">
      <div v-if="loading" class="page-loader"><div class="spinner"></div> Loading…</div>

      <!-- OVERVIEW -->
      <template v-else-if="activeTab==='overview'">
        <div class="dash-header">
          <h1 class="dash-title">Good {{ timeOfDay }}, {{ firstName }} 👋</h1>
          <p class="dash-sub">{{ auth.isEmployer ? 'Manage your job listings and applicants.' : 'Track your applications and find new opportunities.' }}</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card" v-for="s in stats" :key="s.label">
            <div class="stat-val">{{ s.val }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>

        <!-- Employer: recent applicants -->
        <template v-if="auth.isEmployer">
          <div class="dash-section">
            <div class="section-hd">
              <h2>Recent Applicants</h2>
              <button class="btn btn-primary btn-sm" @click="showFeatured=true">⚡ Feature a Job</button>
            </div>
            <div v-if="!receivedApps.length" class="empty"><div class="empty-icon">📨</div><p>No applications received yet.</p></div>
            <div v-else class="app-list">
              <div v-for="a in receivedApps.slice(0,5)" :key="a.id" class="app-row">
                <div class="app-info">
                  <div class="app-name">{{ a.applicant_name }}</div>
                  <div class="app-meta">{{ a.jobs?.title }} · {{ timeAgo(a.created_at) }}</div>
                </div>
                <div style="display:flex;gap:6px;align-items:center">
                  <a v-if="a.cv_url" :href="a.cv_url" target="_blank" class="btn btn-ghost btn-sm">CV ↗</a>
                  <span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span>
                  <button class="btn btn-ghost btn-sm" @click="setAppStatus(a.id,'accepted')">Accept</button>
                  <button class="btn btn-danger btn-sm" @click="setAppStatus(a.id,'rejected')">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Worker: recent applications + saved jobs -->
        <template v-else>
          <div class="dash-section">
            <div class="section-hd">
              <h2>Recent Applications</h2>
              <RouterLink to="/jobs" class="btn btn-ghost btn-sm">Find More →</RouterLink>
            </div>
            <div v-if="!myApps.length" class="empty"><div class="empty-icon">📨</div><p>No applications yet.</p></div>
            <div v-else class="app-list">
              <div v-for="a in myApps.slice(0,5)" :key="a.id" class="app-row">
                <div class="app-info">
                  <div class="app-name">{{ a.jobs?.title }}</div>
                  <div class="app-meta">{{ a.jobs?.company }} · {{ timeAgo(a.created_at) }}</div>
                </div>
                <span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span>
              </div>
            </div>
          </div>

          <!-- Job alerts signup -->
          <div class="alert-card" v-if="!alertsEnabled">
            <div>
              <div style="font-size:13px;font-weight:600;margin-bottom:3px">🔔 Get Job Alerts</div>
              <div style="font-size:12px;color:var(--text-dim)">Get emailed when new jobs matching your skills are posted.</div>
            </div>
            <button class="btn btn-primary btn-sm" @click="enableAlerts">Enable Alerts</button>
          </div>
          <div class="alert-card alert-card-on" v-else>
            <div>
              <div style="font-size:13px;font-weight:600;margin-bottom:3px">🔔 Job Alerts Active</div>
              <div style="font-size:12px;color:var(--text-dim)">You'll be emailed when new matching jobs are posted.</div>
            </div>
            <button class="btn btn-ghost btn-sm" @click="disableAlerts">Turn Off</button>
          </div>
        </template>
      </template>

      <!-- MY JOBS (employer) -->
      <template v-else-if="activeTab==='myjobs'">
        <div class="dash-header">
          <h1 class="dash-title">My Posted Jobs</h1>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" @click="showFeatured=true">⚡ Feature a Job</button>
            <RouterLink to="/post" class="btn btn-primary btn-sm">+ Post New Job</RouterLink>
          </div>
        </div>
        <div v-if="!myJobs.length" class="empty"><div class="empty-icon">📋</div><p>No jobs posted yet.</p></div>
        <div v-else class="job-list">
          <div v-for="j in myJobs" :key="j.id" class="job-row">
            <div class="job-row-info">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <div class="job-row-title">{{ j.title }}</div>
                <span v-if="j.featured" class="badge badge-yellow">⚡ Featured</span>
                <span v-if="isExpired(j)" class="badge badge-red">⏰ Expired</span>
              </div>
              <div class="job-row-meta">
                {{ j.company }} · {{ j.location }} · {{ timeAgo(j.created_at) }}
                <span v-if="j.max_applicants"> · 👥 {{ j.applicant_count||0 }}/{{ j.max_applicants }} applicants</span>
                <span v-if="j.expires_at"> · Expires {{ new Date(j.expires_at).toLocaleDateString() }}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="badge" :class="statusBadge(j.status)">{{ j.status || 'pending' }}</span>
              <!-- Edit -->
              <RouterLink :to="'/post?edit='+j.id" class="btn btn-ghost btn-sm">✏️ Edit</RouterLink>
              <!-- Reopen closed job -->
              <button v-if="j.status==='closed' && !isExpired(j)" class="btn btn-sm" style="background:var(--green-dim);color:var(--green);border:1px solid var(--green-border)" @click="reopenJob(j.id)">↺ Reopen</button>
              <!-- Close open job -->
              <button v-if="j.status==='approved'" class="btn btn-ghost btn-sm" @click="closeJob(j.id)">⏸ Close</button>
              <!-- Renew expired job -->
              <button v-if="isExpired(j)" class="btn btn-primary btn-sm" @click="renewJob(j)">🔄 Renew (20k)</button>
              <!-- Delete -->
              <button class="btn btn-danger btn-sm" @click="deleteJob(j.id)">Delete</button>
            </div>
          </div>
        </div>
      </template>

      <!-- ANALYTICS (employer) -->
      <template v-else-if="activeTab==='analytics'">
        <Analytics @upgrade="showFeatured=true" />
      </template>

      <!-- MY APPLICATIONS (worker) -->
      <template v-else-if="activeTab==='myapps'">
        <div class="dash-header">
          <h1 class="dash-title">My Applications</h1>
          <RouterLink to="/jobs" class="btn btn-ghost btn-sm">Browse Jobs →</RouterLink>
        </div>
        <div v-if="!myApps.length" class="empty"><div class="empty-icon">📨</div><p>No applications sent yet.</p></div>
        <div v-else class="app-list">
          <div v-for="a in myApps" :key="a.id" class="app-row">
            <div class="app-info">
              <div class="app-name">{{ a.jobs?.title }}</div>
              <div class="app-meta">{{ a.jobs?.company }} · {{ timeAgo(a.created_at) }}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <a v-if="a.cv_url" :href="a.cv_url" target="_blank" class="btn btn-ghost btn-sm">CV ↗</a>
              <span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- SAVED JOBS (worker) -->
      <template v-else-if="activeTab==='saved'">
        <div class="dash-header">
          <h1 class="dash-title">Saved Jobs</h1>
          <RouterLink to="/jobs" class="btn btn-ghost btn-sm">Browse More →</RouterLink>
        </div>
        <div v-if="!savedJobs.length" class="empty"><div class="empty-icon">🔖</div><p>No saved jobs yet. Bookmark jobs while browsing!</p></div>
        <div v-else class="job-list">
          <div v-for="s in savedJobs" :key="s.id" class="job-row">
            <div class="job-row-info">
              <div class="job-row-title">{{ s.jobs?.title }}</div>
              <div class="job-row-meta">{{ s.jobs?.company }} · {{ s.jobs?.location }} · {{ s.jobs?.type }}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <span class="badge badge-ghost">{{ s.jobs?.salary || 'Negotiable' }}</span>
              <button class="btn btn-danger btn-sm" @click="unsaveJob(s.id)">Remove</button>
            </div>
          </div>
        </div>
      </template>

      <!-- APPLICANTS (employer) -->
      <template v-else-if="activeTab==='applicants'">
        <div class="dash-header">
          <h1 class="dash-title">Applications Received</h1>
        </div>
        <div v-if="!receivedApps.length" class="empty"><div class="empty-icon">📨</div><p>No applications yet.</p></div>
        <div v-else class="app-list">
          <div v-for="a in receivedApps" :key="a.id" class="app-row app-row-full">
            <div class="app-info">
              <div class="app-name">{{ a.applicant_name }}</div>
              <div class="app-meta">{{ a.applicant_email }} · Applied for: <strong style="color:var(--text-dim)">{{ a.jobs?.title }}</strong> · {{ timeAgo(a.created_at) }}</div>
              <div class="app-cover">{{ a.cover_letter }}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0">
              <span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span>
              <a v-if="a.cv_url" :href="a.cv_url" target="_blank" class="btn btn-ghost btn-sm">Download CV ↗</a>
              <RouterLink :to="'/profile/'+a.applicant_id" class="btn btn-ghost btn-sm">View Profile →</RouterLink>
              <button class="btn btn-primary btn-sm" @click="setAppStatus(a.id,'accepted')">Accept</button>
              <button class="btn btn-danger btn-sm" @click="setAppStatus(a.id,'rejected')">Reject</button>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Featured Modal -->
    <FeaturedModal :show="showFeatured" @close="showFeatured=false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import Analytics from '@/components/Analytics.vue'
import FeaturedModal from '@/components/FeaturedModal.vue'

const router   = useRouter()
const loading  = ref(true)
const myJobs   = ref([])
const myApps   = ref([])
const receivedApps = ref([])
const savedJobs    = ref([])
const alertsEnabled= ref(false)
const showFeatured = ref(false)
const activeTab    = ref('overview')

const tabs = computed(() => auth.isEmployer
  ? [
      { id:'overview',   icon:'🏠', label:'Overview' },
      { id:'myjobs',     icon:'📋', label:'My Jobs' },
      { id:'applicants', icon:'📨', label:'Applicants' },
      { id:'analytics',  icon:'📊', label:'Analytics' },
    ]
  : [
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'myapps',   icon:'📨', label:'My Applications' },
      { id:'saved',    icon:'🔖', label:'Saved Jobs' },
    ]
)

const initials  = computed(() => { const n = auth.profile?.full_name||'U'; return n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2) })
const firstName = computed(() => auth.profile?.full_name?.split(' ')[0] || '')
const timeOfDay = computed(() => { const h = new Date().getHours(); return h<12?'morning':h<17?'afternoon':'evening' })

const stats = computed(() => auth.isEmployer
  ? [
      { val: myJobs.value.length, label: 'Jobs Posted' },
      { val: receivedApps.value.length, label: 'Applications Received' },
      { val: receivedApps.value.filter(a=>a.status==='accepted').length, label: 'Accepted' },
      { val: myJobs.value.filter(j=>j.featured).length, label: 'Featured Jobs' },
    ]
  : [
      { val: myApps.value.length, label: 'Applications Sent' },
      { val: myApps.value.filter(a=>a.status==='accepted').length, label: 'Accepted' },
      { val: myApps.value.filter(a=>a.status==='pending').length, label: 'Pending' },
      { val: savedJobs.value.length, label: 'Saved Jobs' },
    ]
)

onMounted(async () => {
  if (!auth.user) { router.push('/login'); return }
  await load()
  loading.value = false
})

async function load() {
  const jobIds = []
  const [jobsRes, appsRes, savedRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('employer_id', auth.user.id).order('created_at',{ascending:false}),
    supabase.from('applications').select('*, jobs(title,company)').eq('applicant_id', auth.user.id).order('created_at',{ascending:false}),
    supabase.from('saved_jobs').select('*, jobs(title,company,location,type,salary)').eq('user_id', auth.user.id).order('created_at',{ascending:false})
  ])
  myJobs.value    = jobsRes.data || []
  myApps.value    = appsRes.data || []
  savedJobs.value = savedRes.data || []
  myJobs.value.forEach(j => jobIds.push(j.id))

  if (jobIds.length) {
    const { data } = await supabase.from('applications')
      .select('*, jobs(title,company,employer_id)')
      .in('job_id', jobIds)
      .order('created_at',{ascending:false})
    receivedApps.value = data || []
  }

  // Check job alerts
  const { data: alertData } = await supabase.from('job_alerts').select('id').eq('user_id', auth.user.id).maybeSingle().then(r => r).catch(()=>({data:null}))
  alertsEnabled.value = !!alertData
}

async function deleteJob(id) {
  if (!confirm('Delete this job and all its applications?')) return
  await supabase.from('applications').delete().eq('job_id', id)
  await supabase.from('jobs').delete().eq('id', id)
  toast.info('Job deleted.')
  await load()
}

async function setAppStatus(id, status) {
  await supabase.from('applications').update({ status }).eq('id', id)
  toast.success(status === 'accepted' ? 'Applicant accepted!' : 'Application rejected.')
  await load()
}

async function unsaveJob(id) {
  await supabase.from('saved_jobs').delete().eq('id', id)
  toast.info('Job removed from saved.')
  await load()
}

async function enableAlerts() {
  await supabase.from('job_alerts').upsert({
    user_id: auth.user.id,
    email:   auth.user.email,
    skills:  auth.profile?.skills || [],
    active:  true
  })
  alertsEnabled.value = true
  toast.success('Job alerts enabled! You\'ll be emailed when matching jobs are posted.')
}

async function disableAlerts() {
  await supabase.from('job_alerts').delete().eq('user_id', auth.user.id)
  alertsEnabled.value = false
  toast.info('Job alerts turned off.')
}

async function logout() {
  await auth.logout()
  router.push('/')
}

function isExpired(j) {
  if (!j.expires_at) return false
  return new Date(j.expires_at) < new Date()
}

async function reopenJob(id) {
  await supabase.from('jobs').update({ status: 'approved' }).eq('id', id)
  myJobs.value.find(j => j.id === id && (j.status = 'approved'))
  toast.success('Job reopened!')
}

async function closeJob(id) {
  await supabase.from('jobs').update({ status: 'closed' }).eq('id', id)
  myJobs.value.find(j => j.id === id && (j.status = 'closed'))
  toast.info('Job closed.')
}

async function renewJob(job) {
  // Record renewal payment and redirect to Pesapal
  const { initiatePesapalPayment } = await import('@/utils/pesapal')
  const orderId = 'RENEW-' + Date.now()
  await supabase.from('job_payments').insert({
    employer_id:    auth.user.id,
    employer_email: auth.user.email,
    amount:         20000,
    type:           'renew_job',
    job_id:         job.id,
    pay_method:     'pesapal',
    pay_ref:        orderId,
    status:         'pending'
  })
  const nameParts = (auth.profile?.full_name || 'User').split(' ')
  const result = await initiatePesapalPayment({
    amount: 20000,
    description: `TalentHub — Renew Job: ${job.title}`,
    email:     auth.user.email,
    phone:     auth.profile?.phone || '',
    firstName: nameParts[0],
    lastName:  nameParts[1] || nameParts[0],
    orderId
  })
  if (result.success) window.location.href = result.redirectUrl
  else toast.error('Payment failed. Try again.')
}

function statusBadge(s) {
  return { accepted:'badge-green', rejected:'badge-red', pending:'badge-yellow', approved:'badge-green' }[s] || 'badge-ghost'
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d)
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), day = Math.floor(diff/86400000)
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (day < 30) return `${day}d ago`
  return new Date(d).toLocaleDateString()
}
</script>


