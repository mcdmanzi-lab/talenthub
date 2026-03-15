<template>
  <div>
    <Navbar />
    <div class="jobs-layout">
      <!-- Sidebar -->
      <aside class="jobs-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-title">Search</div>
          <input class="input" v-model="search" placeholder="Job title, skill, company…" @input="filter" />
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Category</div>
          <div class="filter-list">
            <button v-for="cat in categories" :key="cat.slug"
              class="filter-item" :class="{ active: activeCat === cat.slug }"
              @click="setCat(cat.slug)">
              {{ cat.icon }} {{ cat.name }}
            </button>
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Job Type</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label v-for="type in jobTypes" :key="type" class="check-item">
              <input type="checkbox" v-model="selectedTypes" :value="type" @change="filter" />
              <span>{{ type }}</span>
            </label>
          </div>
        </div>
        <label class="check-item" style="margin-bottom:20px">
          <input type="checkbox" v-model="remoteOnly" @change="filter" />
          <span>Remote only</span>
        </label>
        <div class="sidebar-section">
          <div class="sidebar-title">Worker Skills</div>
          <div class="filter-list">
            <RouterLink v-for="cat in workerCats" :key="cat.name"
              :to="'/workers?cat=' + cat.name"
              class="filter-item" style="text-decoration:none;display:block">
              {{ cat.icon }} {{ cat.name }}
            </RouterLink>
          </div>
        </div>
      </aside>

      <!-- Main -->
      <main>
        <div class="jobs-main-header">
          <div>
            <h1>Jobs in Africa</h1>
            <p>{{ filtered.length }} opportunities found</p>
          </div>
          <div class="jobs-toolbar">
            <select class="input" v-model="sort" @change="filter" style="width:150px">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <RouterLink to="/post" class="btn btn-primary btn-sm">+ Post Job</RouterLink>
          </div>
        </div>

        <div v-if="loading" class="page-loader"><div class="spinner"></div> Loading jobs…</div>
        <div v-else-if="!filtered.length" class="empty">
          <div class="empty-icon">🔍</div>
          <p>No jobs match your filters.</p>
        </div>
        <div v-else class="jobs-list">
          <JobCard v-for="job in paginated" :key="job.id" :job="job" @apply="openApply" />
          <button v-if="paginated.length < filtered.length"
            class="btn btn-ghost btn-full" style="margin-top:8px" @click="loadMore">
            Load more ({{ filtered.length - paginated.length }} remaining)
          </button>
        </div>
      </main>
    </div>
    <ApplyModal :show="!!applyJob" :job="applyJob" @close="applyJob=null" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import JobCard from '@/components/JobCard.vue'
import ApplyModal from '@/components/ApplyModal.vue'
import { supabase } from '@/supabase'

const loading       = ref(true)
const search        = ref('')
const activeCat     = ref('all')
const selectedTypes = ref([])
const remoteOnly    = ref(false)
const sort          = ref('newest')
const page          = ref(1)
const allJobs       = ref([])
const filtered      = ref([])
const applyJob      = ref(null)
const PER_PAGE      = 10

const paginated = computed(() => filtered.value.slice(0, page.value * PER_PAGE))

const categories = [
  { slug:'all', icon:'🌐', name:'All Jobs' },
  { slug:'tech', icon:'💻', name:'Web & Tech' },
  { slug:'design', icon:'🎨', name:'Design' },
  { slug:'marketing', icon:'📣', name:'Marketing' },
  { slug:'writing', icon:'✍️', name:'Writing' },
  { slug:'management', icon:'📋', name:'Management' },
  { slug:'other', icon:'💼', name:'Other' },
]
const jobTypes = ['Full-time','Part-time','Contract','Freelance']
const workerCats = [
  { name:'Construction', icon:'🏗️' }, { name:'Plumbing', icon:'🔧' },
  { name:'Electrical',   icon:'⚡' }, { name:'Cleaning',  icon:'🧹' },
  { name:'Driving',      icon:'🚗' }, { name:'Security',  icon:'🔒' },
  { name:'Mechanics',    icon:'🔩' }, { name:'Cooking',   icon:'🍳' },
]

onMounted(async () => {
  const { data } = await supabase.from('jobs').select('*').eq('status','approved').order('created_at',{ascending:false})
  allJobs.value = data || []
  filter()
  loading.value = false
})

function setCat(slug) { activeCat.value = slug; filter() }
function filter() {
  page.value = 1
  let jobs = [...allJobs.value].filter(j => !j.expires_at || new Date(j.expires_at) > new Date())
  if (search.value) {
    const q = search.value.toLowerCase()
    jobs = jobs.filter(j => j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q) || (j.tags||[]).some(t=>t.toLowerCase().includes(q)))
  }
  if (activeCat.value !== 'all') jobs = jobs.filter(j => j.category === activeCat.value)
  if (selectedTypes.value.length)  jobs = jobs.filter(j => selectedTypes.value.includes(j.type))
  if (remoteOnly.value)             jobs = jobs.filter(j => j.remote)
  if (sort.value === 'oldest')      jobs.sort((a,b) => new Date(a.created_at)-new Date(b.created_at))
  jobs.sort((a,b) => (b.featured?1:0) - (a.featured?1:0))
  filtered.value = jobs
}
function loadMore() { page.value++ }
function openApply(job) { applyJob.value = job }
</script>
