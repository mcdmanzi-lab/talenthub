<template>
  <div>
    <Navbar />
    <div class="company-page">

      <!-- Header -->
      <div class="company-hero">
        <div class="company-logo">{{ initials }}</div>
        <div class="company-info">
          <h1 class="company-name">{{ company.name || '—' }}</h1>
          <div class="company-meta">
            <span v-if="company.industry">{{ company.industry }}</span>
            <span v-if="company.size">· {{ company.size }} employees</span>
            <span v-if="company.location">· 📍 {{ company.location }}</span>
            <span v-if="company.website">· <a :href="company.website" target="_blank">{{ company.website }}</a></span>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <span class="badge badge-ghost">{{ activeJobs.length }} Active Jobs</span>
            <span class="badge badge-ghost">⭐ {{ avgRating }} / 5</span>
            <span class="badge badge-ghost">{{ reviews.length }} Reviews</span>
          </div>
        </div>
        <button v-if="isOwn" class="btn btn-ghost btn-sm" @click="editMode=true">Edit</button>
      </div>

      <div class="company-body">

        <!-- LEFT -->
        <main class="company-main">

          <!-- Edit form -->
          <div v-if="editMode" class="c-card">
            <div class="pc-title">Edit Company Profile</div>
            <div class="edit-grid">
              <div class="form-group"><label class="label">Company Name</label><input class="input" v-model="editForm.name" /></div>
              <div class="form-group"><label class="label">Industry</label><input class="input" v-model="editForm.industry" placeholder="e.g. Technology" /></div>
              <div class="form-group"><label class="label">Company Size</label>
                <select class="input" v-model="editForm.size">
                  <option value="">Select…</option>
                  <option>1–10</option><option>11–50</option>
                  <option>51–200</option><option>200+</option>
                </select>
              </div>
              <div class="form-group"><label class="label">Location</label><input class="input" v-model="editForm.location" /></div>
              <div class="form-group" style="grid-column:1/-1"><label class="label">Website</label><input class="input" v-model="editForm.website" placeholder="https://…" /></div>
              <div class="form-group" style="grid-column:1/-1"><label class="label">About</label><textarea class="input" v-model="editForm.about" rows="5" placeholder="Tell candidates about your company…" /></div>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px">
              <button class="btn btn-primary" @click="save" :disabled="saving">
                <span v-if="saving" class="spinner"></span>
                <span>{{ saving ? 'Saving…' : 'Save' }}</span>
              </button>
              <button class="btn btn-ghost" @click="editMode=false">Cancel</button>
            </div>
          </div>

          <!-- About -->
          <div class="c-card">
            <div class="pc-title">About</div>
            <p v-if="company.about" class="about-text">{{ company.about }}</p>
            <div v-else class="empty"><div class="empty-icon">🏢</div><p>No company description yet.</p></div>
          </div>

          <!-- Active jobs -->
          <div class="c-card">
            <div class="pc-title">Open Positions ({{ activeJobs.length }})</div>
            <div v-if="!activeJobs.length" class="empty"><div class="empty-icon">📋</div><p>No open positions right now.</p></div>
            <div v-else class="jobs-list">
              <div v-for="j in activeJobs" :key="j.id" class="mini-job" @click="router.push('/jobs')">
                <div>
                  <div class="mj-title">{{ j.title }}</div>
                  <div class="mj-meta">{{ j.location }} · {{ j.type }}</div>
                </div>
                <span class="badge badge-ghost">{{ j.salary || 'Negotiable' }}</span>
              </div>
            </div>
          </div>

          <!-- Reviews -->
          <div class="c-card">
            <div class="pc-title-row">
              <div class="pc-title">Reviews ({{ reviews.length }})</div>
              <button v-if="auth.user && !isOwn" class="btn btn-ghost btn-sm" @click="showReview=true">+ Write Review</button>
            </div>
            <div v-if="!reviews.length" class="empty"><div class="empty-icon">⭐</div><p>No reviews yet. Be the first!</p></div>
            <div v-else class="reviews-list">
              <div v-for="r in reviews" :key="r.id" class="review-item">
                <div class="review-header">
                  <div class="review-author">{{ r.author_name }}</div>
                  <div class="review-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5-r.rating) }}</div>
                  <div class="review-date">{{ timeAgo(r.created_at) }}</div>
                </div>
                <p class="review-text">{{ r.content }}</p>
              </div>
            </div>
          </div>
        </main>

        <!-- RIGHT sidebar -->
        <aside class="company-sidebar">
          <div class="c-card">
            <div class="pc-title">Company Info</div>
            <div class="info-list">
              <div class="info-item"><span class="info-label">Industry</span><span>{{ company.industry || '—' }}</span></div>
              <div class="info-item"><span class="info-label">Size</span><span>{{ company.size || '—' }}</span></div>
              <div class="info-item"><span class="info-label">Location</span><span>{{ company.location || '—' }}</span></div>
              <div class="info-item"><span class="info-label">Rating</span><span>⭐ {{ avgRating }} / 5</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Review Modal -->
    <Teleport to="body">
      <div v-if="showReview" class="modal-backdrop" @click.self="showReview=false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Write a Review</div>
            <button class="modal-close" @click="showReview=false">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="form-group">
              <label class="label">Rating</label>
              <div class="star-picker">
                <span v-for="n in 5" :key="n" class="star" :class="{active: reviewForm.rating >= n}" @click="reviewForm.rating=n">★</span>
              </div>
            </div>
            <div class="form-group">
              <label class="label">Your Review</label>
              <textarea class="input" v-model="reviewForm.content" rows="4" placeholder="Share your experience working with this company…" />
            </div>
          </div>
          <button class="btn btn-primary btn-full" style="margin-top:16px" @click="submitReview">Submit Review</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'

const route  = useRoute()
const router = useRouter()
const employerId = computed(() => route.params.id)
const isOwn      = computed(() => auth.user?.id === employerId.value)

const company    = reactive({})
const activeJobs = ref([])
const reviews    = ref([])
const editMode   = ref(false)
const saving     = ref(false)
const showReview = ref(false)

const editForm   = reactive({ name:'', industry:'', size:'', location:'', website:'', about:'' })
const reviewForm = reactive({ rating: 5, content: '' })

const initials  = computed(() => (company.name||'C').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2))
const avgRating = computed(() => {
  if (!reviews.value.length) return '—'
  return (reviews.value.reduce((s,r) => s + r.rating, 0) / reviews.value.length).toFixed(1)
})

onMounted(async () => {
  await loadCompany()
  await loadJobs()
  await loadReviews()
})

async function loadCompany() {
  const { data } = await supabase.from('companies').select('*').eq('employer_id', employerId.value).maybeSingle()
  if (data) { Object.assign(company, data); Object.assign(editForm, data) }
  else {
    // Auto-create company profile for employer
    const profile = await supabase.from('profiles').select('full_name').eq('id', employerId.value).maybeSingle()
    Object.assign(company, { name: profile.data?.full_name || 'My Company' })
    Object.assign(editForm, company)
  }
}

async function loadJobs() {
  const { data } = await supabase.from('jobs').select('*').eq('employer_id', employerId.value).eq('status','approved')
  activeJobs.value = data || []
}

async function loadReviews() {
  const { data } = await supabase.from('company_reviews').select('*').eq('company_employer_id', employerId.value).order('created_at', { ascending: false })
  reviews.value = data || []
}

async function save() {
  saving.value = true
  const { error } = await supabase.from('companies').upsert({
    employer_id: auth.user.id, ...editForm
  })
  saving.value = false
  if (error) { toast.error(error.message); return }
  Object.assign(company, editForm)
  editMode.value = false
  toast.success('Company profile updated!')
}

async function submitReview() {
  if (!reviewForm.content) { toast.error('Please write a review.'); return }
  const { error } = await supabase.from('company_reviews').insert({
    company_employer_id: employerId.value,
    author_id:   auth.user.id,
    author_name: auth.profile?.full_name || 'Anonymous',
    rating:      reviewForm.rating,
    content:     reviewForm.content
  })
  if (error) { toast.error(error.message); return }
  showReview.value = false
  reviewForm.content = ''
  reviewForm.rating  = 5
  await loadReviews()
  toast.success('Review submitted!')
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d), day = Math.floor(diff/86400000)
  if (day < 1) return 'Today'; if (day < 30) return `${day}d ago`
  return new Date(d).toLocaleDateString()
}
</script>


