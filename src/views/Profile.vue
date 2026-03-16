<template>
  <div>
    <Navbar />
    <div class="profile-page">

      <!-- LEFT: Profile Card -->
      <aside class="profile-sidebar">
        <div class="profile-card">
          <!-- Profile Photo -->
          <div class="profile-photo-wrap">
            <div class="profile-avatar-img" v-if="profile.avatar_url">
              <img :src="profile.avatar_url" alt="Profile photo" />
            </div>
            <div class="profile-avatar" v-else>{{ initials }}</div>
            <label v-if="isOwn" class="photo-upload-btn" title="Change photo">
              📷
              <input type="file" accept="image/*" style="display:none" @change="uploadPhoto" />
            </label>
          </div>
          <div class="profile-name">{{ profile.full_name || '—' }}</div>
          <div class="profile-title">{{ profile.title || 'Add your job title' }}</div>
          <div v-if="profile.worker_category" class="worker-category-badge">
            {{ categoryIcon(profile.worker_category) }} {{ profile.worker_category }}
          </div>
          <div class="profile-location" v-if="profile.location">📍 {{ profile.location }}</div>

          <!-- Verified badge -->
          <div class="verified-badge" v-if="profile.verified">
            ✅ Verified Worker
          </div>

          <!-- Open to Work badge -->
          <div class="otw-badge" v-if="profile.open_to_work">
            <span class="otw-dot"></span> Open to Work
          </div>

          <div class="profile-meta">
            <div v-if="profile.phone">📞 {{ profile.phone }}</div>
            <div v-if="profile.website">
              🔗 <a :href="profile.website" target="_blank">{{ profile.website }}</a>
            </div>
          </div>

          <!-- Own profile actions -->
          <template v-if="isOwn">
            <button class="btn btn-ghost btn-full" style="margin-top:16px" @click="editMode=true">
              Edit Profile
            </button>
            <label class="check-item" style="margin-top:12px;justify-content:center">
              <input type="checkbox" :checked="profile.open_to_work" @change="toggleOTW" />
              <span style="font-size:12px">Open to Work</span>
            </label>
          </template>

          <!-- Employer: message + WhatsApp buttons -->
          <template v-else-if="auth.isEmployer">
            <button class="btn btn-primary btn-full" style="margin-top:16px" @click="showMsg=true">
              ✉️ Send Message
            </button>
            <a v-if="profile.phone"
              :href="`https://wa.me/${formatWhatsApp(profile.phone)}?text=${encodeURIComponent('Hello ' + profile.full_name + ', I found your profile on TalentHub and I\'d like to discuss a job opportunity with you.')}`"
              target="_blank"
              class="btn btn-whatsapp btn-full" style="margin-top:8px">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </template>
        </div>

        <!-- Skills -->
        <div class="profile-card" style="margin-top:12px" v-if="profile.skills?.length || isOwn">
          <div class="pc-title">Skills</div>
          <div class="skills-wrap">
            <span v-for="s in profile.skills||[]" :key="s" class="skill-chip">{{ s }}</span>
            <span v-if="!profile.skills?.length" style="font-size:12px;color:var(--text-ghost)">No skills added yet.</span>
          </div>
        </div>
      </aside>

      <!-- RIGHT: Main Content -->
      <main class="profile-main">

        <!-- Edit Mode -->
        <div v-if="editMode" class="profile-card">
          <div class="pc-title">Edit Profile</div>
          <div class="edit-grid">
            <div class="form-group">
              <label class="label">Full Name</label>
              <input class="input" v-model="editForm.full_name" />
            </div>
            <div class="form-group">
              <label class="label">Job Title</label>
              <input class="input" v-model="editForm.title" placeholder="e.g. Frontend Developer" />
            </div>
            <div class="form-group">
              <label class="label">Location</label>
              <input class="input" v-model="editForm.location" placeholder="e.g. Kigali, Rwanda" />
            </div>
            <div class="form-group">
              <label class="label">Phone</label>
              <input class="input" v-model="editForm.phone" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="label">Website / LinkedIn / GitHub</label>
              <input class="input" v-model="editForm.website" placeholder="https://..." />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="label">Bio</label>
              <div class="form-group">
                <label class="label">Worker Category</label>
                <select class="input" v-model="editForm.worker_category">
                  <option value="">Select category…</option>
                  <option v-for="cat in workerCategories" :key="cat.name" :value="cat.name">{{ cat.icon }} {{ cat.name }}</option>
                </select>
              </div>
              <textarea class="input" v-model="editForm.bio" rows="4"
                placeholder="Tell employers about yourself…"></textarea>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="label">Skills <span style="color:var(--text-ghost)">(press Enter to add)</span></label>
              <div class="tags-input">
                <span v-for="s in editForm.skills" :key="s" class="tag-chip">
                  {{ s }}<button @click="removeSkill(s)">×</button>
                </span>
                <input class="tag-text-input" v-model="skillInput"
                  placeholder="e.g. Vue.js, Figma, Python…"
                  @keydown.enter.prevent="addSkill"
                  @keydown.comma.prevent="addSkill" />
              </div>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-primary" @click="saveProfile" :disabled="saving">
              <span v-if="saving" class="spinner"></span>
              <span>{{ saving ? 'Saving…' : 'Save Changes' }}</span>
            </button>
            <button class="btn btn-ghost" @click="editMode=false">Cancel</button>
          </div>
        </div>

        <!-- Bio -->
        <div class="profile-card" v-if="profile.bio || isOwn">
          <div class="pc-title">About</div>
          <p v-if="profile.bio" class="bio-text">{{ profile.bio }}</p>
          <p v-else class="empty-field" @click="editMode=true">+ Add a bio</p>
        </div>

        <!-- Portfolio -->
        <div class="profile-card">
          <div class="pc-title-row">
            <div class="pc-title">Portfolio</div>
            <button v-if="isOwn" class="btn btn-ghost btn-sm" @click="showAddPortfolio=true">+ Add</button>
          </div>
          <div v-if="!portfolio.length" class="empty">
            <div class="empty-icon">🖼️</div>
            <p>{{ isOwn ? 'Add your projects, work samples, or links.' : 'No portfolio items yet.' }}</p>
          </div>
          <div v-else class="portfolio-grid">
            <div v-for="item in portfolio" :key="item.id" class="portfolio-item">
              <div class="pi-title">{{ item.title }}</div>
              <div class="pi-desc">{{ item.description }}</div>
              <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
                <a v-if="item.url" :href="item.url" target="_blank" class="btn btn-ghost btn-sm">View →</a>
                <button v-if="isOwn" class="btn btn-danger btn-sm" @click="deletePortfolio(item.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Experience -->
        <div class="profile-card">
          <div class="pc-title-row">
            <div class="pc-title">Experience</div>
            <button v-if="isOwn" class="btn btn-ghost btn-sm" @click="showAddExp=true">+ Add</button>
          </div>
          <div v-if="!experience.length" class="empty">
            <div class="empty-icon">💼</div>
            <p>{{ isOwn ? 'Add your work history.' : 'No experience listed yet.' }}</p>
          </div>
          <div v-else class="exp-list">
            <div v-for="exp in experience" :key="exp.id" class="exp-item">
              <div class="exp-left">
                <div class="exp-role">{{ exp.role }}</div>
                <div class="exp-company">{{ exp.company }}</div>
                <div class="exp-period">{{ exp.start_year }} — {{ exp.end_year || 'Present' }}</div>
                <p class="exp-desc" v-if="exp.description">{{ exp.description }}</p>
              </div>
              <button v-if="isOwn" class="btn btn-danger btn-sm" @click="deleteExp(exp.id)">Delete</button>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- Add Portfolio Modal -->
    <Teleport to="body">
      <div v-if="showAddPortfolio" class="modal-backdrop" @click.self="showAddPortfolio=false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Add Portfolio Item</div>
            <button class="modal-close" @click="showAddPortfolio=false">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="form-group"><label class="label">Title *</label><input class="input" v-model="newPortfolio.title" placeholder="Project name" /></div>
            <div class="form-group"><label class="label">Description</label><textarea class="input" v-model="newPortfolio.description" rows="3" placeholder="What did you build?" /></div>
            <div class="form-group"><label class="label">URL</label><input class="input" v-model="newPortfolio.url" placeholder="https://..." /></div>
          </div>
          <button class="btn btn-primary btn-full" style="margin-top:16px" @click="addPortfolio">Add Item</button>
        </div>
      </div>
    </Teleport>

    <!-- Add Experience Modal -->
    <Teleport to="body">
      <div v-if="showAddExp" class="modal-backdrop" @click.self="showAddExp=false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Add Experience</div>
            <button class="modal-close" @click="showAddExp=false">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="form-group"><label class="label">Job Title *</label><input class="input" v-model="newExp.role" placeholder="e.g. Frontend Developer" /></div>
            <div class="form-group"><label class="label">Company *</label><input class="input" v-model="newExp.company" placeholder="Company name" /></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><label class="label">Start Year</label><input class="input" v-model="newExp.start_year" placeholder="2022" /></div>
              <div class="form-group"><label class="label">End Year</label><input class="input" v-model="newExp.end_year" placeholder="2024 or leave blank" /></div>
            </div>
            <div class="form-group"><label class="label">Description</label><textarea class="input" v-model="newExp.description" rows="3" placeholder="What did you do?" /></div>
          </div>
          <button class="btn btn-primary btn-full" style="margin-top:16px" @click="addExp">Add Experience</button>
        </div>
      </div>
    </Teleport>

    <!-- Message Modal -->
    <Teleport to="body">
      <div v-if="showMsg" class="modal-backdrop" @click.self="showMsg=false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Message {{ profile.full_name }}</div>
            <button class="modal-close" @click="showMsg=false">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="form-group"><label class="label">Subject</label><input class="input" v-model="msgForm.subject" placeholder="Job opportunity at…" /></div>
            <div class="form-group"><label class="label">Message</label><textarea class="input" v-model="msgForm.body" rows="5" placeholder="Hi, I'd like to invite you to apply for…" /></div>
          </div>
          <button class="btn btn-primary btn-full" style="margin-top:16px" @click="sendMessage" :disabled="msgSending">
            <span v-if="msgSending" class="spinner"></span>
            <span>{{ msgSending ? 'Sending…' : 'Send Message' }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { sendEmail } from '@/utils/email'
import { sanitizeProfileForm } from '@/utils/validate'

const route = useRoute()
const profileId = computed(() => route.params.id || auth.user?.id)
const isOwn     = computed(() => auth.user?.id === profileId.value)

const profile   = reactive({})
const portfolio = ref([])
const experience= ref([])
const editMode  = ref(false)
const saving    = ref(false)
const skillInput= ref('')
const showAddPortfolio = ref(false)
const showAddExp       = ref(false)
const showMsg          = ref(false)
const msgSending       = ref(false)

const editForm = reactive({
  worker_category: '', full_name:'', title:'', location:'', phone:'', website:'', bio:'', skills:[] })
const newPortfolio = reactive({ title:'', description:'', url:'' })
const newExp       = reactive({ role:'', company:'', start_year:'', end_year:'', description:'' })
const msgForm      = reactive({ subject:'', body:'' })

const initials = computed(() => {
  const name = profile.full_name || 'U'
  return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
})

onMounted(async () => {
  await loadProfile()
  await loadPortfolio()
  await loadExperience()
})

async function loadProfile() {
  const { data } = await supabase.from('profiles').select('*').eq('id', profileId.value).maybeSingle()
  if (data) Object.assign(profile, data)
  Object.assign(editForm, {
    full_name: profile.full_name || '',
    title:     profile.title || '',
    location:  profile.location || '',
    phone:     profile.phone || '',
    website:   profile.website || '',
    bio:       profile.bio || '',
    skills:    profile.skills || []
  })
}

async function loadPortfolio() {
  const { data } = await supabase.from('portfolio').select('*').eq('user_id', profileId.value).order('created_at', { ascending: false })
  portfolio.value = data || []
}

async function loadExperience() {
  const { data } = await supabase.from('experience').select('*').eq('user_id', profileId.value).order('start_year', { ascending: false })
  experience.value = data || []
}

async function uploadPhoto(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) { toast.error('Photo must be under 3MB'); return }
  const ext  = file.name.split('.').pop()
  const path = `avatars/${auth.user.id}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) { toast.error('Upload failed'); return }
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', auth.user.id)
  profile.avatar_url = publicUrl
  toast.success('Photo updated!')
}

async function saveProfile() {
  saving.value = true
  const { cleaned, errors } = sanitizeProfileForm(editForm)
  if (errors.length) { toast.error(errors[0]); return }

  const { error } = await supabase.from('profiles').update({
    full_name: cleaned.full_name,
    title:     cleaned.title,
    location:  cleaned.location,
    phone:     cleaned.phone,
    website:   cleaned.website,
    bio:       cleaned.bio,
    skills:    cleaned.skills
  }).eq('id', auth.user.id)
  saving.value = false
  if (error) { toast.error('Failed to save.'); return }
  Object.assign(profile, editForm)
  await auth.fetchProfile()
  editMode.value = false
  toast.success('Profile updated!')
}

async function toggleOTW() {
  const val = !profile.open_to_work
  await supabase.from('profiles').update({ open_to_work: val }).eq('id', auth.user.id)
  profile.open_to_work = val
  toast.success(val ? 'You are now open to work!' : 'Open to work turned off.')
}

function addSkill() {
  const v = skillInput.value.trim().replace(',', '')
  if (v && !editForm.skills.includes(v)) editForm.skills.push(v)
  skillInput.value = ''
}
function removeSkill(s) { editForm.skills = editForm.skills.filter(x => x !== s) }

async function addPortfolio() {
  if (!newPortfolio.title) { toast.error('Title is required.'); return }
  const { error } = await supabase.from('portfolio').insert({
    user_id: auth.user.id, ...newPortfolio
  })
  if (error) { toast.error(error.message); return }
  showAddPortfolio.value = false
  Object.assign(newPortfolio, { title:'', description:'', url:'' })
  await loadPortfolio()
  toast.success('Portfolio item added!')
}

async function deletePortfolio(id) {
  await supabase.from('portfolio').delete().eq('id', id)
  await loadPortfolio()
  toast.info('Item removed.')
}

async function addExp() {
  if (!newExp.role || !newExp.company) { toast.error('Role and company are required.'); return }
  const { error } = await supabase.from('experience').insert({
    user_id: auth.user.id, ...newExp
  })
  if (error) { toast.error(error.message); return }
  showAddExp.value = false
  Object.assign(newExp, { role:'', company:'', start_year:'', end_year:'', description:'' })
  await loadExperience()
  toast.success('Experience added!')
}

async function deleteExp(id) {
  await supabase.from('experience').delete().eq('id', id)
  await loadExperience()
  toast.info('Experience removed.')
}

async function sendMessage() {
  if (!msgForm.subject || !msgForm.body) { toast.error('Please fill in all fields.'); return }
  msgSending.value = true
  // Save message to DB
  await supabase.from('messages').insert({
    sender_id:   auth.user.id,
    sender_name: auth.profile?.full_name,
    receiver_id: profileId.value,
    subject:     msgForm.subject,
    content:     msgForm.body
  })
  // Send email notification
  await sendEmail({
    to:      profile.email,
    subject: msgForm.subject,
    html: `<p>Hi ${profile.full_name},</p><p>You have a new message from <strong>${auth.profile?.full_name}</strong> on TalentHub:</p><p>${msgForm.body.replace(/\n/g,'<br>')}</p><p>Log in to TalentHub to reply.</p>`
  })
  msgSending.value = false
  showMsg.value = false
  Object.assign(msgForm, { subject:'', body:'' })
  toast.success('Message sent!')
}
</script>


