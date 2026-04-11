<template>
  <div>
    <Navbar />
    <div class="ai-match-page">

      <!-- Worker view: find matching jobs -->
      <template v-if="!auth.isEmployer">
        <div class="ai-match-header">
          <div class="ai-badge">🤖 AI Powered</div>
          <h1>Jobs Matched For You</h1>
          <p>Our AI analyzes your skills and profile to find the best job matches.</p>
          <button class="btn btn-primary" @click="matchJobs" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'Analyzing your profile…' : '🔍 Find My Best Matches' }}</span>
          </button>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div v-if="matches.length" class="ai-results">
          <div class="ai-results-title">Top {{ matches.length }} matches for you</div>
          <div v-for="match in matches" :key="match.id" class="ai-match-card">
            <div class="ai-match-score" :class="scoreClass(match.score)">
              {{ match.score }}%
            </div>
            <div class="ai-match-info">
              <div class="ai-match-job-title">{{ getJob(match.id)?.title }}</div>
              <div class="ai-match-company">{{ getJob(match.id)?.company }} · {{ getJob(match.id)?.location }}</div>
              <div class="ai-match-reason">💡 {{ match.reason }}</div>
            </div>
            <button class="btn btn-primary btn-sm" @click="applyJob(getJob(match.id))">Apply →</button>
          </div>
        </div>

        <div v-else-if="!loading && searched" class="empty">
          <div class="empty-icon">🤔</div>
          <p>No strong matches found. Try updating your profile with more skills.</p>
        </div>
      </template>

      <!-- Employer view: find matching workers for a job -->
      <template v-else>
        <div class="ai-match-header">
          <div class="ai-badge">🤖 AI Powered</div>
          <h1>Find Best Workers For Your Job</h1>
          <p>Our AI finds the most qualified workers for your job posting.</p>
        </div>

        <div class="form-group" style="max-width:400px">
          <label class="label">Select your job</label>
          <select class="input" v-model="selectedJobId">
            <option value="">Choose a job…</option>
            <option v-for="j in myJobs" :key="j.id" :value="j.id">{{ j.title }}</option>
          </select>
        </div>

        <button class="btn btn-primary" style="margin-bottom:24px" @click="matchWorkers" :disabled="loading || !selectedJobId">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Analyzing workers…' : '🔍 Find Best Workers' }}</span>
        </button>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div v-if="matches.length" class="ai-results">
          <div class="ai-results-title">Top {{ matches.length }} workers for this job</div>
          <div v-for="match in matches" :key="match.id" class="ai-match-card">
            <div class="ai-match-score" :class="scoreClass(match.score)">{{ match.score }}%</div>
            <div class="ai-match-info">
              <div class="ai-match-job-title">{{ getWorker(match.id)?.full_name }}</div>
              <div class="ai-match-company">{{ getWorker(match.id)?.title || getWorker(match.id)?.worker_category }}</div>
              <div class="ai-match-reason">💡 {{ match.reason }}</div>
            </div>
            <RouterLink :to="'/profile/' + match.id" class="btn btn-ghost btn-sm">View Profile →</RouterLink>
          </div>
        </div>
      </template>

    </div>

    <ApplyModal :show="!!applyTarget" :job="applyTarget" @close="applyTarget=null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import ApplyModal from '@/components/ApplyModal.vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'

const loading       = ref(false)
const error         = ref('')
const matches       = ref([])
const searched      = ref(false)
const allJobs       = ref([])
const allWorkers    = ref([])
const myJobs        = ref([])
const selectedJobId = ref('')
const applyTarget   = ref(null)

onMounted(async () => {
  if (!auth.isEmployer) {
    const { data } = await supabase.from('jobs').select('*').eq('status','approved')
    allJobs.value = data || []
  } else {
    const [jobsRes, workersRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('employer_id', auth.user.id).eq('status','approved'),
      supabase.from('profiles').select('*').eq('role','worker')
    ])
    myJobs.value     = jobsRes.data || []
    allWorkers.value = workersRes.data || []
  }
})

async function matchJobs() {
  if (!auth.profile) return
  loading.value = true; error.value = ''; matches.value = []
  try {
    const res = await fetch('/api/ai-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'match_jobs', profile: auth.profile, jobs: allJobs.value })
    })
    const data = await res.json()
    matches.value = data.matches || []
    searched.value = true
  } catch (e) {
    error.value = 'AI matching failed. Please try again.'
  }
  loading.value = false
}

async function matchWorkers() {
  if (!selectedJobId.value) return
  loading.value = true; error.value = ''; matches.value = []
  const job = myJobs.value.find(j => j.id === selectedJobId.value)
  try {
    const res = await fetch('/api/ai-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'match_workers', job, workers: allWorkers.value })
    })
    const data = await res.json()
    matches.value = data.matches || []
  } catch (e) {
    error.value = 'AI matching failed. Please try again.'
  }
  loading.value = false
}

function getJob(id)    { return allJobs.value.find(j => j.id === id) }
function getWorker(id) { return allWorkers.value.find(w => w.id === id) }
function applyJob(job) { applyTarget.value = job }
function scoreClass(score) {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-mid'
  return 'score-low'
}
</script>

<style scoped>
.ai-match-page { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
.ai-match-header { text-align: center; margin-bottom: 32px; }
.ai-match-header h1 { font-size: 24px; font-weight: 700; margin: 12px 0 8px; }
.ai-match-header p  { font-size: 14px; color: var(--text-dim); margin-bottom: 20px; }
.ai-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--accent-bg); color: #60a5fa;
  border: 1px solid var(--accent-border);
  padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600;
  margin-bottom: 12px;
}
.ai-results { display: flex; flex-direction: column; gap: 12px; }
.ai-results-title { font-size: 13px; font-weight: 600; color: var(--text-dim); margin-bottom: 4px; }
.ai-match-card {
  display: flex; align-items: center; gap: 16px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px;
}
.ai-match-score {
  width: 56px; height: 56px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.score-high { background: var(--green-dim); color: var(--green); border: 2px solid var(--green-border); }
.score-mid  { background: var(--yellow-dim); color: var(--yellow); border: 2px solid var(--yellow-border); }
.score-low  { background: var(--red-dim); color: var(--red); border: 2px solid var(--red-border); }
.ai-match-info    { flex: 1; min-width: 0; }
.ai-match-job-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.ai-match-company   { font-size: 12px; color: var(--text-dim); margin-bottom: 4px; }
.ai-match-reason    { font-size: 12px; color: var(--text-dim); font-style: italic; }
</style>
