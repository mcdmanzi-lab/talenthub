<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <img src="/logo.svg" alt="TalentHub" style="height:26px" />
        <div style="font-size:10px;color:var(--red);font-weight:700;letter-spacing:0.08em;margin-top:2px">ADMIN PANEL</div>
      </div>
      <nav class="admin-nav">
        <button v-for="t in navItems" :key="t.id"
          class="admin-nav-item" :class="{active:tab===t.id}" @click="tab=t.id">
          <span>{{ t.icon }}</span>
          <span>{{ t.label }}</span>
          <span v-if="t.count" class="admin-badge">{{ t.count }}</span>
        </button>
      </nav>
      <div style="margin-top:auto">
        <RouterLink to="/" class="admin-nav-item">← Back to site</RouterLink>
      </div>
    </aside>

    <main class="admin-main">
      <div v-if="loading" class="page-loader"><div class="spinner"></div> Loading…</div>
      <template v-else>

        <!-- OVERVIEW -->
        <template v-if="tab==='overview'">
          <div class="admin-topbar">
            <h1 class="admin-title">Overview</h1>
            <button class="btn btn-ghost btn-sm" @click="load">↻ Refresh</button>
          </div>
          <div class="admin-stats">
            <div class="a-stat"><div class="a-stat-val">{{ users.length }}</div><div class="a-stat-label">Total Users</div></div>
            <div class="a-stat"><div class="a-stat-val" style="color:var(--yellow)">{{ pending.length }}</div><div class="a-stat-label">Pending Jobs</div></div>
            <div class="a-stat"><div class="a-stat-val" style="color:var(--green)">{{ approved.length }}</div><div class="a-stat-label">Approved Jobs</div></div>
            <div class="a-stat"><div class="a-stat-val">{{ apps.length }}</div><div class="a-stat-label">Applications</div></div>
            <div class="a-stat"><div class="a-stat-val" style="color:var(--accent)">{{ featuredRequests.filter(r=>r.status==='pending').length }}</div><div class="a-stat-label">Featured Requests</div></div>
            <div class="a-stat"><div class="a-stat-val" style="color:var(--green)">{{ payments.filter(p=>p.status==='completed').length }}</div><div class="a-stat-label">Paid Transactions</div></div>
          </div>

          <!-- Revenue summary -->
          <div class="a-card" style="margin-bottom:16px">
            <div class="a-card-header"><h2 class="a-card-title">💰 Revenue Summary</h2></div>
            <div class="revenue-grid">
              <div class="rev-item">
                <div class="rev-val">{{ totalRevenue.toLocaleString() }} RWF</div>
                <div class="rev-label">Total Revenue</div>
              </div>
              <div class="rev-item">
                <div class="rev-val">{{ postRevenue.toLocaleString() }} RWF</div>
                <div class="rev-label">Job Posting Fees</div>
              </div>
              <div class="rev-item">
                <div class="rev-val">{{ applyRevenue.toLocaleString() }} RWF</div>
                <div class="rev-label">Application Fees</div>
              </div>
              <div class="rev-item">
                <div class="rev-val">{{ featuredRevenue.toLocaleString() }} RWF</div>
                <div class="rev-label">Featured Listings</div>
              </div>
            </div>
          </div>

          <div class="a-card">
            <div class="a-card-header"><h2 class="a-card-title">Pending Jobs ({{ pending.length }})</h2></div>
            <div v-if="!pending.length" class="empty"><div class="empty-icon">✅</div><p>All clear!</p></div>
            <table v-else class="a-table">
              <thead><tr><th>Job</th><th>Company</th><th>Posted By</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="j in pending.slice(0,8)" :key="j.id">
                  <td><strong>{{ j.title }}</strong></td>
                  <td>{{ j.company }}</td>
                  <td style="color:var(--text-ghost)">{{ j.employer_name }}</td>
                  <td style="color:var(--text-ghost)">{{ timeAgo(j.created_at) }}</td>
                  <td><div style="display:flex;gap:6px">
                    <button class="btn btn-sm btn-green" @click="approveJob(j.id)">Approve</button>
                    <button class="btn btn-danger btn-sm" @click="rejectJob(j.id)">Reject</button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- ALL JOBS -->
        <template v-else-if="tab==='jobs'">
          <div class="admin-topbar">
            <h1 class="admin-title">All Jobs ({{ jobs.length }})</h1>
            <input class="input" v-model="jobSearch" placeholder="Search jobs…" style="width:220px" />
          </div>
          <div class="a-card">
            <table class="a-table">
              <thead><tr><th>Title</th><th>Company</th><th>Status</th><th>Featured</th><th>Expires</th><th>Applicants</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="j in filteredJobs" :key="j.id">
                  <td><strong>{{ j.title }}</strong><div style="font-size:11px;color:var(--text-ghost)">{{ j.employer_name }}</div></td>
                  <td>{{ j.company }}</td>
                  <td><span class="badge" :class="statusBadge(j.status)">{{ j.status||'pending' }}</span></td>
                  <td><span v-if="j.featured" class="badge badge-yellow">⚡ Yes</span><span v-else style="color:var(--text-ghost);font-size:11px">—</span></td>
                  <td style="font-size:11px;color:var(--text-ghost)">{{ j.expires_at ? new Date(j.expires_at).toLocaleDateString() : '—' }}</td>
                  <td style="font-size:12px">{{ j.max_applicants ? `${j.applicant_count||0}/${j.max_applicants}` : j.applicant_count||0 }}</td>
                  <td><div style="display:flex;gap:5px;flex-wrap:wrap">
                    <button v-if="j.status!=='approved'" class="btn btn-sm btn-green" @click="approveJob(j.id)">Approve</button>
                    <button v-if="j.status==='approved'" class="btn btn-sm btn-yellow" @click="closeJob(j.id)">Close</button>
                    <button v-if="j.status==='closed'||j.status==='rejected'" class="btn btn-sm btn-green" @click="approveJob(j.id)">Reopen</button>
                    <button v-if="!j.featured" class="btn btn-sm" style="background:var(--yellow-dim);color:var(--yellow);border:1px solid var(--yellow-border)" @click="featureJob(j.id)">Feature</button>
                    <button v-if="j.featured" class="btn btn-sm btn-ghost" @click="unfeatureJob(j.id)">Unfeature</button>
                    <button class="btn btn-danger btn-sm" @click="deleteJob(j.id)">Delete</button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- USERS -->
        <template v-else-if="tab==='users'">
          <div class="admin-topbar">
            <h1 class="admin-title">All Users ({{ users.length }})</h1>
            <input class="input" v-model="userSearch" placeholder="Search users…" style="width:220px" />
          </div>
          <div class="a-card">
            <table class="a-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="u in filteredUsers" :key="u.id">
                  <td><strong>{{ u.full_name||'—' }}</strong></td>
                  <td style="color:var(--text-ghost)">{{ u.email }}</td>
                  <td><span class="badge badge-ghost">{{ u.role||'worker' }}</span></td>
                  <td style="color:var(--text-ghost);font-size:11px">{{ timeAgo(u.created_at) }}</td>
                  <td><div style="display:flex;gap:6px">
                    <RouterLink :to="'/profile/'+u.id" class="btn btn-ghost btn-sm">View Profile</RouterLink>
                    <button v-if="!u.verified" class="btn btn-sm btn-green" @click="verifyUser(u.id)">✅ Verify</button>
                    <button v-if="u.verified"  class="btn btn-sm btn-yellow" @click="unverifyUser(u.id)">Unverify</button>
                    <button class="btn btn-danger btn-sm" @click="banUser(u.id)">Ban</button>
                    <button class="btn btn-sm" style="background:var(--accent-dim);color:#93c5fd;border:1px solid rgba(37,99,235,.3)" @click="sendUserNotif(u)">Notify</button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- APPLICATIONS -->
        <template v-else-if="tab==='apps'">
          <div class="admin-topbar"><h1 class="admin-title">All Applications ({{ apps.length }})</h1></div>
          <div class="a-card">
            <table class="a-table">
              <thead><tr><th>Applicant</th><th>Job</th><th>Status</th><th>CV</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="a in apps" :key="a.id">
                  <td><strong>{{ a.applicant_name }}</strong><div style="font-size:11px;color:var(--text-ghost)">{{ a.applicant_email }}</div></td>
                  <td>{{ a.jobs?.title }}</td>
                  <td><span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span></td>
                  <td><a v-if="a.cv_url" :href="a.cv_url" target="_blank" class="btn btn-ghost btn-sm">CV ↗</a></td>
                  <td style="font-size:11px;color:var(--text-ghost)">{{ timeAgo(a.created_at) }}</td>
                  <td><div style="display:flex;gap:5px">
                    <button class="btn btn-sm btn-green" @click="setAppStatus(a.id,'accepted')">Accept</button>
                    <button class="btn btn-danger btn-sm" @click="setAppStatus(a.id,'rejected')">Reject</button>
                    <button class="btn btn-danger btn-sm" @click="deleteApp(a.id)">Delete</button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- FEATURED REQUESTS -->
        <template v-else-if="tab==='featured'">
          <div class="admin-topbar"><h1 class="admin-title">Featured Requests ({{ featuredRequests.length }})</h1></div>
          <div class="a-card">
            <div v-if="!featuredRequests.length" class="empty"><div class="empty-icon">⚡</div><p>No featured requests yet.</p></div>
            <table v-else class="a-table">
              <thead><tr><th>Employer</th><th>Job</th><th>Plan</th><th>Price</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="r in featuredRequests" :key="r.id">
                  <td><strong>{{ r.employer_name }}</strong><div style="font-size:11px;color:var(--text-ghost)">{{ r.employer_email }}</div></td>
                  <td style="font-size:12px">{{ r.job_id }}</td>
                  <td><span class="badge badge-ghost">{{ r.plan }}</span></td>
                  <td style="font-size:12px;font-weight:600">{{ r.price }}</td>
                  <td style="font-size:11px;color:var(--text-ghost)">{{ r.pay_method }} · {{ r.pay_phone||r.pay_ref }}</td>
                  <td><span class="badge" :class="r.status==='completed'?'badge-green':r.status==='rejected'?'badge-red':'badge-yellow'">{{ r.status }}</span></td>
                  <td><div style="display:flex;gap:5px">
                    <button v-if="r.status==='pending'" class="btn btn-sm btn-green" @click="approveFeatured(r)">Approve</button>
                    <button v-if="r.status==='pending'" class="btn btn-danger btn-sm" @click="rejectFeatured(r.id)">Reject</button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- PAYMENTS -->
        <template v-else-if="tab==='payments'">
          <div class="admin-topbar"><h1 class="admin-title">All Payments ({{ payments.length }})</h1></div>
          <div class="a-card">
            <div v-if="!payments.length" class="empty"><div class="empty-icon">💰</div><p>No payments yet.</p></div>
            <table v-else class="a-table">
              <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Method</th><th>Ref</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="p in payments" :key="p.id">
                  <td style="font-size:11px;color:var(--text-ghost)">{{ p.employer_email }}</td>
                  <td><span class="badge badge-ghost">{{ p.type==='post_job'?'Post Job':'Apply' }}</span></td>
                  <td style="font-weight:600">{{ p.amount?.toLocaleString() }} RWF</td>
                  <td style="font-size:11px">{{ p.pay_method }}</td>
                  <td style="font-size:10px;color:var(--text-ghost)">{{ p.pay_ref }}</td>
                  <td><span class="badge" :class="p.status==='completed'?'badge-green':p.status==='rejected'?'badge-red':'badge-yellow'">{{ p.status }}</span></td>
                  <td style="font-size:11px;color:var(--text-ghost)">{{ timeAgo(p.created_at) }}</td>
                  <td><div style="display:flex;gap:5px">
                    <button v-if="p.status==='pending'" class="btn btn-sm btn-green" @click="approvePayment(p.id)">Confirm</button>
                    <button v-if="p.status==='pending'" class="btn btn-danger btn-sm" @click="rejectPayment(p.id)">Reject</button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- MESSAGES -->
        <template v-else-if="tab==='messages'">
          <div class="admin-topbar"><h1 class="admin-title">All Messages ({{ messages.length }})</h1></div>
          <div class="a-card">
            <div v-if="!messages.length" class="empty"><div class="empty-icon">✉️</div><p>No messages yet.</p></div>
            <table v-else class="a-table">
              <thead><tr><th>From</th><th>To</th><th>Subject</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="m in messages" :key="m.id">
                  <td style="font-size:12px">{{ m.sender_name }}</td>
                  <td style="font-size:12px">{{ m.receiver_name }}</td>
                  <td>{{ m.subject }}</td>
                  <td style="font-size:11px;color:var(--text-ghost)">{{ timeAgo(m.created_at) }}</td>
                  <td><button class="btn btn-danger btn-sm" @click="deleteMessage(m.id)">Delete</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- BROADCAST -->
        <template v-else-if="tab==='broadcast'">
          <div class="admin-topbar"><h1 class="admin-title">Broadcast Message</h1></div>
          <div class="a-card" style="max-width:600px">
            <p style="font-size:13px;color:var(--text-dim);margin-bottom:20px">Send a notification or email to all users on the platform.</p>
            <div style="display:flex;flex-direction:column;gap:14px">
              <div class="form-group">
                <label class="label">Title</label>
                <input class="input" v-model="broadcast.title" placeholder="e.g. New features available!" />
              </div>
              <div class="form-group">
                <label class="label">Message</label>
                <textarea class="input" v-model="broadcast.message" rows="4" placeholder="Write your message to all users…" />
              </div>
              <div class="form-group">
                <label class="label">Send via</label>
                <div style="display:flex;gap:10px">
                  <label class="check-item"><input type="checkbox" v-model="broadcast.inApp" /> In-app notification</label>
                  <label class="check-item"><input type="checkbox" v-model="broadcast.email" /> Email</label>
                </div>
              </div>
            </div>
            <button class="btn btn-primary" style="margin-top:20px" @click="sendBroadcast" :disabled="broadcasting">
              <span v-if="broadcasting" class="spinner"></span>
              <span>{{ broadcasting ? 'Sending…' : '📢 Send to All Users' }}</span>
            </button>
          </div>
        </template>

        <!-- RECOVERY -->
        <template v-else-if="tab==='recovery'">
          <div class="admin-topbar"><h1 class="admin-title">Recovery Requests ({{ recovery.length }})</h1></div>
          <div class="a-card">
            <div v-if="!recovery.length" class="empty"><div class="empty-icon">🔒</div><p>No recovery requests.</p></div>
            <table v-else class="a-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Message</th><th>Date</th></tr></thead>
              <tbody>
                <tr v-for="r in recovery" :key="r.id">
                  <td>{{ r.full_name }}</td>
                  <td>{{ r.phone }}</td>
                  <td style="font-size:12px;color:var(--text-dim)">{{ r.message }}</td>
                  <td style="font-size:11px;color:var(--text-ghost)">{{ timeAgo(r.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

      </template>
    </main>

    <!-- Notify user modal -->
    <Teleport to="body">
      <div v-if="notifModal.show" class="modal-backdrop" @click.self="notifModal.show=false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Send Notification to {{ notifModal.user?.full_name }}</div>
            <button class="modal-close" @click="notifModal.show=false">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="form-group"><label class="label">Title</label><input class="input" v-model="notifModal.title" /></div>
            <div class="form-group"><label class="label">Message</label><textarea class="input" v-model="notifModal.message" rows="3" /></div>
          </div>
          <button class="btn btn-primary btn-full" style="margin-top:16px" @click="submitUserNotif">Send</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '@/supabase'
import { toast } from '@/stores/toast'
import { sendEmail } from '@/utils/email'

const loading    = ref(true)
const tab        = ref('overview')
const jobs       = ref([])
const users      = ref([])
const apps       = ref([])
const recovery   = ref([])
const featuredRequests = ref([])
const payments   = ref([])
const messages   = ref([])
const jobSearch  = ref('')
const userSearch = ref('')
const broadcasting = ref(false)
const broadcast  = reactive({ title:'', message:'', inApp: true, email: false })
const notifModal = reactive({ show: false, user: null, title: '', message: '' })

const pending  = computed(() => jobs.value.filter(j => j.status === 'pending'))
const approved = computed(() => jobs.value.filter(j => j.status === 'approved'))

const totalRevenue   = computed(() => payments.value.filter(p=>p.status==='completed').reduce((s,p)=>s+(p.amount||0),0))
const postRevenue    = computed(() => payments.value.filter(p=>p.status==='completed'&&p.type==='post_job').reduce((s,p)=>s+(p.amount||0),0))
const applyRevenue   = computed(() => payments.value.filter(p=>p.status==='completed'&&p.type==='apply_job').reduce((s,p)=>s+(p.amount||0),0))
const featuredRevenue= computed(() => featuredRequests.value.filter(r=>r.status==='completed').reduce((s,r)=>{
  const amt = parseInt((r.price||'0').replace(/[^0-9]/g,'')) || 0
  return s + amt
}, 0))

const filteredJobs  = computed(() => jobs.value.filter(j =>
  !jobSearch.value || j.title?.toLowerCase().includes(jobSearch.value.toLowerCase()) ||
  j.company?.toLowerCase().includes(jobSearch.value.toLowerCase())
))
const filteredUsers = computed(() => users.value.filter(u =>
  !userSearch.value || u.full_name?.toLowerCase().includes(userSearch.value.toLowerCase()) ||
  u.email?.toLowerCase().includes(userSearch.value.toLowerCase())
))

const navItems = computed(() => [
  { id:'overview',  icon:'🏠', label:'Overview' },
  { id:'jobs',      icon:'📋', label:'Jobs',        count: pending.value.length||null },
  { id:'users',     icon:'👥', label:'Users' },
  { id:'apps',      icon:'📨', label:'Applications' },
  { id:'featured',  icon:'⚡', label:'Featured',    count: featuredRequests.value.filter(r=>r.status==='pending').length||null },
  { id:'payments',  icon:'💰', label:'Payments',    count: payments.value.filter(p=>p.status==='pending').length||null },
  { id:'messages',  icon:'✉️',  label:'Messages' },
  { id:'broadcast', icon:'📢', label:'Broadcast' },
  { id:'recovery',  icon:'🔒', label:'Recovery' },
])

onMounted(load)

async function load() {
  loading.value = true
  const [jobsR, usersR, appsR, recR, featR, payR, msgR] = await Promise.all([
    supabase.from('jobs').select('*').order('created_at',{ascending:false}),
    supabase.from('profiles').select('*').order('created_at',{ascending:false}),
    supabase.from('applications').select('*, jobs(title)').order('created_at',{ascending:false}),
    supabase.from('recovery_requests').select('*').order('created_at',{ascending:false}),
    supabase.from('featured_requests').select('*').order('created_at',{ascending:false}),
    supabase.from('job_payments').select('*').order('created_at',{ascending:false}),
    supabase.from('messages').select('*').order('created_at',{ascending:false}),
  ])
  jobs.value     = jobsR.data || []
  users.value    = usersR.data || []
  apps.value     = appsR.data || []
  recovery.value = recR.data || []
  featuredRequests.value = featR.data || []
  payments.value = payR.data || []
  messages.value = msgR.data || []
  loading.value  = false
}

async function approveJob(id) {
  await supabase.from('jobs').update({ status:'approved' }).eq('id', id)
  const job = jobs.value.find(j=>j.id===id)
  if (job) {
    job.status = 'approved'
    await supabase.from('notifications').insert({ user_id: job.employer_id, type:'job_approved', title:'Job Approved!', message:`Your job "${job.title}" has been approved and is now live.`, link:'/dashboard' })
  }
  toast.success('Job approved!')
}
async function rejectJob(id) {
  await supabase.from('jobs').update({ status:'rejected' }).eq('id', id)
  const job = jobs.value.find(j=>j.id===id)
  if (job) {
    job.status = 'rejected'
    await supabase.from('notifications').insert({ user_id: job.employer_id, type:'job_rejected', title:'Job Rejected', message:`Your job "${job.title}" was not approved. Please review and resubmit.`, link:'/dashboard' })
  }
  toast.info('Job rejected.')
}
async function closeJob(id) {
  await supabase.from('jobs').update({ status:'closed' }).eq('id', id)
  jobs.value.find(j=>j.id===id && (j.status='closed'))
  toast.info('Job closed.')
}
async function featureJob(id) {
  const until = new Date(); until.setDate(until.getDate()+30)
  await supabase.from('jobs').update({ featured:true, featured_until:until.toISOString() }).eq('id', id)
  jobs.value.find(j=>j.id===id && (j.featured=true))
  toast.success('Job featured!')
}
async function unfeatureJob(id) {
  await supabase.from('jobs').update({ featured:false, featured_until:null }).eq('id', id)
  jobs.value.find(j=>j.id===id && (j.featured=false))
  toast.info('Job unfeatured.')
}
async function deleteJob(id) {
  if (!confirm('Delete this job?')) return
  await supabase.from('applications').delete().eq('job_id', id)
  await supabase.from('jobs').delete().eq('id', id)
  jobs.value = jobs.value.filter(j=>j.id!==id)
  toast.info('Job deleted.')
}
async function verifyUser(id) {
  await supabase.from('profiles').update({ verified: true }).eq('id', id)
  const u = users.value.find(u => u.id === id)
  if (u) {
    u.verified = true
    await supabase.from('notifications').insert({
      user_id: id, type: 'job_approved',
      title: '✅ You are now Verified!',
      message: 'Your profile has been verified by TalentHub. Employers can now see your verified badge.',
      link: '/profile/' + id
    })
  }
  toast.success('Worker verified!')
}

async function unverifyUser(id) {
  await supabase.from('profiles').update({ verified: false }).eq('id', id)
  users.value.find(u => u.id === id && (u.verified = false))
  toast.info('Verification removed.')
}

async function banUser(id) {
  if (!confirm('Ban this user? This will delete their profile.')) return
  await supabase.from('profiles').delete().eq('id', id)
  users.value = users.value.filter(u=>u.id!==id)
  toast.info('User banned.')
}
async function setAppStatus(id, status) {
  await supabase.from('applications').update({ status }).eq('id', id)
  apps.value.find(a=>a.id===id && (a.status=status))
  toast.success(status==='accepted'?'Accepted!':'Rejected.')
}
async function deleteApp(id) {
  await supabase.from('applications').delete().eq('id', id)
  apps.value = apps.value.filter(a=>a.id!==id)
  toast.info('Application deleted.')
}
async function deleteMessage(id) {
  await supabase.from('messages').delete().eq('id', id)
  messages.value = messages.value.filter(m=>m.id!==id)
  toast.info('Message deleted.')
}
async function approveFeatured(r) {
  const until = new Date(); until.setDate(until.getDate()+(r.days||30))
  await supabase.from('jobs').update({ featured:true, featured_until:until.toISOString() }).eq('id', r.job_id)
  await supabase.from('featured_requests').update({ status:'completed' }).eq('id', r.id)
  await supabase.from('notifications').insert({ user_id: r.employer_id, type:'payment', title:'Featured Listing Approved!', message:`Your job has been featured for ${r.days} days.`, link:'/dashboard' })
  r.status = 'completed'
  toast.success('Featured listing approved!')
}
async function rejectFeatured(id) {
  await supabase.from('featured_requests').update({ status:'rejected' }).eq('id', id)
  featuredRequests.value.find(r=>r.id===id && (r.status='rejected'))
  toast.info('Featured request rejected.')
}
async function approvePayment(id) {
  await supabase.from('job_payments').update({ status:'completed' }).eq('id', id)
  payments.value.find(p=>p.id===id && (p.status='completed'))
  toast.success('Payment confirmed!')
}
async function rejectPayment(id) {
  await supabase.from('job_payments').update({ status:'rejected' }).eq('id', id)
  payments.value.find(p=>p.id===id && (p.status='rejected'))
  toast.info('Payment rejected.')
}

function sendUserNotif(user) {
  notifModal.show = true
  notifModal.user = user
  notifModal.title = ''
  notifModal.message = ''
}
async function submitUserNotif() {
  await supabase.from('notifications').insert({
    user_id: notifModal.user.id,
    type: 'job_alert',
    title: notifModal.title,
    message: notifModal.message,
    link: '/dashboard'
  })
  notifModal.show = false
  toast.success('Notification sent!')
}

async function sendBroadcast() {
  if (!broadcast.title || !broadcast.message) { toast.error('Fill in title and message.'); return }
  broadcasting.value = true
  if (broadcast.inApp) {
    const notifs = users.value.map(u => ({
      user_id: u.id, type: 'job_alert',
      title: broadcast.title, message: broadcast.message, link: '/'
    }))
    await supabase.from('notifications').insert(notifs)
  }
  if (broadcast.email) {
    for (const u of users.value) {
      if (!u.email) continue
      await sendEmail({
        to: u.email, subject: broadcast.title,
        html: `<p>${broadcast.message}</p><p><a href="https://talenthub-alpha.vercel.app">Visit TalentHub</a></p>`
      })
    }
  }
  broadcasting.value = false
  broadcast.title = ''; broadcast.message = ''
  toast.success('Broadcast sent to all users!')
}

function statusBadge(s) {
  return { accepted:'badge-green', approved:'badge-green', rejected:'badge-red', pending:'badge-yellow', closed:'badge-ghost' }[s] || 'badge-ghost'
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d)
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), day = Math.floor(diff/86400000)
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${day}d ago`
}
</script>


