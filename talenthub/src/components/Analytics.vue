<template>
  <div>
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Analytics</h1>
        <p class="dash-sub">Performance overview of your job listings.</p>
      </div>
      <select class="input" v-model="period" style="width:140px;font-size:12px" @change="load">
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="all">All time</option>
      </select>
    </div>

    <div v-if="loading" class="page-loader"><div class="spinner"></div> Loading analytics…</div>

    <template v-else>
      <!-- Top stats -->
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:28px">
        <div class="stat-card">
          <div class="stat-val">{{ totalJobs }}</div>
          <div class="stat-label">Jobs Posted</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ totalApps }}</div>
          <div class="stat-label">Total Applications</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ acceptedApps }}</div>
          <div class="stat-label">Accepted</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ convRate }}%</div>
          <div class="stat-label">Conversion Rate</div>
        </div>
      </div>

      <!-- Per-job breakdown -->
      <div class="analytics-card">
        <div class="ac-title">Applications per Job</div>
        <div v-if="!jobStats.length" class="empty"><div class="empty-icon">📊</div><p>No data yet.</p></div>
        <div v-else>
          <div v-for="j in jobStats" :key="j.id" class="job-stat-row">
            <div class="jsr-info">
              <div class="jsr-title">{{ j.title }}</div>
              <div class="jsr-meta">{{ j.location }} · {{ j.type }} · Posted {{ timeAgo(j.created_at) }}</div>
            </div>
            <div class="jsr-bar-wrap">
              <div class="jsr-bar">
                <div class="jsr-bar-fill" :style="{width: barWidth(j.appCount) + '%'}"></div>
              </div>
              <span class="jsr-count">{{ j.appCount }}</span>
            </div>
            <div class="jsr-badges">
              <span class="badge badge-green">{{ j.accepted }} accepted</span>
              <span class="badge badge-red">{{ j.rejected }} rejected</span>
              <span class="badge badge-yellow">{{ j.pending }} pending</span>
              <span class="badge" :class="j.status==='approved'?'badge-green':'badge-yellow'">{{ j.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Applications over time -->
      <div class="analytics-card" style="margin-top:14px">
        <div class="ac-title">Recent Activity</div>
        <div v-if="!recentApps.length" class="empty"><div class="empty-icon">📈</div><p>No recent applications.</p></div>
        <div v-else class="activity-list">
          <div v-for="a in recentApps" :key="a.id" class="activity-row">
            <div class="activity-dot" :class="a.status"></div>
            <div class="activity-info">
              <span class="activity-name">{{ a.applicant_name }}</span>
              <span class="activity-job"> applied for <strong>{{ a.jobs?.title }}</strong></span>
            </div>
            <div class="activity-time">{{ timeAgo(a.created_at) }}</div>
            <span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span>
          </div>
        </div>
      </div>

      <!-- Featured listings upsell -->
      <div class="upsell-card" style="margin-top:14px" v-if="!hasFeatured">
        <div class="upsell-icon">⚡</div>
        <div>
          <div class="upsell-title">Boost your job listings</div>
          <div class="upsell-sub">Featured jobs get 3× more applicants. Appear at the top of search results.</div>
        </div>
        <button class="btn btn-primary btn-sm" @click="$emit('upgrade')">Feature a Job →</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'

defineEmits(['upgrade'])

const loading  = ref(true)
const period   = ref('30')
const jobs     = ref([])
const allApps  = ref([])

const totalJobs   = computed(() => jobs.value.length)
const totalApps   = computed(() => allApps.value.length)
const acceptedApps= computed(() => allApps.value.filter(a=>a.status==='accepted').length)
const convRate    = computed(() => totalApps.value ? Math.round((acceptedApps.value/totalApps.value)*100) : 0)
const hasFeatured = computed(() => jobs.value.some(j=>j.featured))

const recentApps = computed(() => [...allApps.value].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,10))

const jobStats = computed(() => jobs.value.map(j => {
  const apps = allApps.value.filter(a => a.job_id === j.id)
  return {
    ...j,
    appCount: apps.length,
    accepted: apps.filter(a=>a.status==='accepted').length,
    rejected: apps.filter(a=>a.status==='rejected').length,
    pending:  apps.filter(a=>a.status==='pending').length,
  }
}).sort((a,b) => b.appCount - a.appCount))

const maxApps = computed(() => Math.max(...jobStats.value.map(j=>j.appCount), 1))
function barWidth(n) { return Math.round((n / maxApps.value) * 100) }

onMounted(load)

async function load() {
  loading.value = true
  const jobIds = []

  const { data: jobData } = await supabase
    .from('jobs').select('*').eq('employer_id', auth.user.id)
  jobs.value = jobData || []
  jobData?.forEach(j => jobIds.push(j.id))

  if (!jobIds.length) { loading.value = false; return }

  let query = supabase.from('applications').select('*, jobs(title)').in('job_id', jobIds)

  if (period.value !== 'all') {
    const from = new Date()
    from.setDate(from.getDate() - parseInt(period.value))
    query = query.gte('created_at', from.toISOString())
  }

  const { data: appData } = await query
  allApps.value = appData || []
  loading.value = false
}

function statusBadge(s) {
  return { accepted:'badge-green', rejected:'badge-red', pending:'badge-yellow' }[s] || 'badge-ghost'
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

<style scoped>
.analytics-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 20px;
}
.ac-title { font-size: 12px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px; }

.job-stat-row {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 0; border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.job-stat-row:last-child { border-bottom: none; }
.jsr-info { flex: 1; min-width: 160px; }
.jsr-title { font-size: 13px; font-weight: 600; }
.jsr-meta  { font-size: 11px; color: var(--text-ghost); margin-top: 2px; }
.jsr-bar-wrap { display: flex; align-items: center; gap: 8px; width: 180px; }
.jsr-bar { flex: 1; height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
.jsr-bar-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width .4s ease; }
.jsr-count { font-size: 12px; font-weight: 600; color: var(--text-dim); width: 20px; text-align: right; }
.jsr-badges { display: flex; gap: 5px; flex-wrap: wrap; }

.activity-list { display: flex; flex-direction: column; gap: 8px; }
.activity-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; background: var(--surface2);
  border-radius: var(--radius); font-size: 12px;
}
.activity-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.activity-dot.accepted { background: var(--green); }
.activity-dot.rejected { background: var(--red); }
.activity-dot.pending  { background: var(--yellow); }
.activity-info { flex: 1; color: var(--text-dim); }
.activity-name { font-weight: 600; color: var(--text); }
.activity-time { font-size: 11px; color: var(--text-ghost); flex-shrink: 0; }

.upsell-card {
  display: flex; align-items: center; gap: 16px;
  background: var(--accent-dim); border: 1px solid var(--accent-border);
  border-radius: var(--radius-lg); padding: 18px 20px;
}
.upsell-icon  { font-size: 24px; flex-shrink: 0; }
.upsell-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
.upsell-sub   { font-size: 12px; color: var(--text-dim); }
</style>
