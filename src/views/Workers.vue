<template>
  <div>
    <Navbar />
    <div class="workers-page">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-title">Search</div>
          <input class="input" v-model="search" placeholder="Name, skill, location…" @input="applyFilter" />
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title">Category</div>
          <div class="filter-list">
            <button class="filter-item" :class="{ active: activeCat === '' }" @click="activeCat=''; applyFilter()">
              🧑‍💼 All Workers
            </button>
            <button v-for="cat in workerCats" :key="cat.name"
              class="filter-item" :class="{ active: activeCat === cat.name }"
              @click="activeCat = cat.name; applyFilter()">
              {{ cat.icon }} {{ cat.name }}
            </button>
          </div>
        </div>
        <div class="sidebar-section">
          <label class="check-item">
            <input type="checkbox" v-model="verifiedOnly" @change="applyFilter" />
            <span>✅ Verified only</span>
          </label>
          <label class="check-item" style="margin-top:8px">
            <input type="checkbox" v-model="openOnly" @change="applyFilter" />
            <span>🟢 Open to Work only</span>
          </label>
        </div>
      </aside>

      <!-- Main -->
      <main class="workers-main">
        <div class="workers-header">
          <div>
            <h1 class="workers-title">Find Workers</h1>
            <p class="workers-sub">{{ filtered.length }} workers found</p>
          </div>
        </div>

        <div v-if="loading" class="page-loader"><div class="spinner"></div> Loading workers…</div>

        <div v-else-if="!filtered.length" class="empty">
          <div class="empty-icon">🔍</div>
          <p>No workers match your filters.</p>
        </div>

        <div v-else class="workers-grid">
          <RouterLink
            v-for="w in filtered"
            :key="w.id"
            :to="'/profile/' + w.id"
            class="worker-card">

            <div class="wc-top">
              <div class="wc-avatar">{{ initials(w.full_name) }}</div>
              <div class="wc-badges">
                <span v-if="w.verified" class="badge-verified">✅ Verified</span>
                <span v-if="w.open_to_work" class="badge-otw">🟢 Open</span>
              </div>
            </div>

            <div class="wc-name">{{ w.full_name || 'Worker' }}</div>
            <div class="wc-title">{{ w.title || w.worker_category || 'Worker' }}</div>
            <div class="wc-location" v-if="w.location">📍 {{ w.location }}</div>

            <div v-if="w.worker_category" class="wc-category">
              {{ categoryIcon(w.worker_category) }} {{ w.worker_category }}
            </div>

            <div class="wc-skills" v-if="w.skills?.length">
              <span v-for="s in w.skills.slice(0,3)" :key="s" class="skill-chip">{{ s }}</span>
            </div>

            <div class="wc-footer">
              <span class="wc-view">View Profile →</span>
              <a v-if="w.phone"
                :href="`https://wa.me/${formatWA(w.phone)}?text=${encodeURIComponent('Hello ' + w.full_name + ', I found your profile on TalentHub and I\'d like to offer you a job.')}`"
                target="_blank"
                class="btn-wa"
                @click.prevent.stop>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </RouterLink>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { supabase } from '@/supabase'

const route       = useRoute()
const loading     = ref(true)
const search      = ref('')
const activeCat   = ref(route.query.cat || '')
const verifiedOnly= ref(false)
const openOnly    = ref(false)
const allWorkers  = ref([])
const filtered    = ref([])

const workerCats = [
  { name:'Construction', icon:'🏗️' },
  { name:'Plumbing',     icon:'🔧' },
  { name:'Electrical',   icon:'⚡' },
  { name:'Cleaning',     icon:'🧹' },
  { name:'Driving',      icon:'🚗' },
  { name:'Security',     icon:'🔒' },
  { name:'Mechanics',    icon:'🔩' },
  { name:'Cooking',      icon:'🍳' },
  { name:'Tailoring',    icon:'🧵' },
  { name:'Gardening',    icon:'🌱' },
  { name:'Tech/IT',      icon:'💻' },
  { name:'Other',        icon:'💼' },
]

function categoryIcon(cat) {
  return workerCats.find(c => c.name === cat)?.icon || '💼'
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
}

function formatWA(phone) {
  let p = (phone || '').replace(/[^0-9]/g, '')
  if (p.startsWith('07')) p = '250' + p.slice(1)
  if (p.startsWith('7'))  p = '250' + p
  return p
}

onMounted(async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'worker')
    .order('created_at', { ascending: false })
  allWorkers.value = data || []
  applyFilter()
  loading.value = false
})

function applyFilter() {
  let list = [...allWorkers.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(w =>
      w.full_name?.toLowerCase().includes(q) ||
      w.title?.toLowerCase().includes(q) ||
      w.location?.toLowerCase().includes(q) ||
      w.worker_category?.toLowerCase().includes(q) ||
      (w.skills || []).some(s => s.toLowerCase().includes(q))
    )
  }
  if (activeCat.value)   list = list.filter(w => w.worker_category === activeCat.value)
  if (verifiedOnly.value) list = list.filter(w => w.verified)
  if (openOnly.value)     list = list.filter(w => w.open_to_work)
  filtered.value = list
}
</script>


