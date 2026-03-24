<template>
  <div>
    <Navbar />
    <div class="cv-page">

      <!-- Left: Form -->
      <aside class="cv-form">
        <h1 class="cv-form-title">📄 CV Builder</h1>
        <p style="font-size:13px;color:var(--text-dim);margin-bottom:24px">Fill in your details and download a professional CV.</p>

        <!-- Personal Info -->
        <div class="cv-section-title">Personal Info</div>
        <div class="form-group">
          <label class="label">Full Name</label>
          <input class="input" v-model="cv.name" placeholder="Your full name" />
        </div>
        <div class="form-group">
          <label class="label">Job Title</label>
          <input class="input" v-model="cv.title" placeholder="e.g. Frontend Developer" />
        </div>
        <div class="form-group">
          <label class="label">Email</label>
          <input class="input" v-model="cv.email" placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label class="label">Phone</label>
          <input class="input" v-model="cv.phone" placeholder="+250 7XX XXX XXX" />
        </div>
        <div class="form-group">
          <label class="label">Location</label>
          <input class="input" v-model="cv.location" placeholder="Kigali, Rwanda" />
        </div>
        <div class="form-group">
          <label class="label">Website / LinkedIn</label>
          <input class="input" v-model="cv.website" placeholder="https://..." />
        </div>

        <!-- Summary -->
        <div class="cv-section-title" style="margin-top:20px">Professional Summary</div>
        <div class="form-group">
          <textarea class="input" v-model="cv.summary" rows="4" placeholder="A short paragraph about yourself, your skills and what you're looking for…"></textarea>
        </div>

        <!-- Skills -->
        <div class="cv-section-title" style="margin-top:20px">Skills</div>
        <div class="tags-input" style="margin-bottom:16px">
          <span v-for="s in cv.skills" :key="s" class="tag-chip">
            {{ s }}<button type="button" @click="removeSkill(s)">×</button>
          </span>
          <input class="tag-text-input" v-model="skillInput"
            placeholder="Add a skill and press Enter…"
            @keydown.enter.prevent="addSkill"
            @keydown.comma.prevent="addSkill" />
        </div>

        <!-- Experience -->
        <div class="cv-section-title" style="margin-top:20px">
          Experience
          <button class="btn btn-ghost btn-sm" style="margin-left:8px" @click="addExp">+ Add</button>
        </div>
        <div v-for="(exp, i) in cv.experience" :key="i" class="cv-entry">
          <div class="cv-entry-header">
            <span style="font-size:12px;font-weight:600">Experience {{ i + 1 }}</span>
            <button class="btn btn-danger btn-sm" @click="cv.experience.splice(i,1)">Remove</button>
          </div>
          <div class="form-group">
            <label class="label">Job Title</label>
            <input class="input" v-model="exp.role" placeholder="e.g. Developer" />
          </div>
          <div class="form-group">
            <label class="label">Company</label>
            <input class="input" v-model="exp.company" placeholder="Company name" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="form-group">
              <label class="label">Start Year</label>
              <input class="input" v-model="exp.start_year" placeholder="2022" />
            </div>
            <div class="form-group">
              <label class="label">End Year</label>
              <input class="input" v-model="exp.end_year" placeholder="2024 or Present" />
            </div>
          </div>
          <div class="form-group">
            <label class="label">Description</label>
            <textarea class="input" v-model="exp.description" rows="2" placeholder="What did you do?"></textarea>
          </div>
        </div>

        <!-- Education -->
        <div class="cv-section-title" style="margin-top:20px">
          Education
          <button class="btn btn-ghost btn-sm" style="margin-left:8px" @click="addEdu">+ Add</button>
        </div>
        <div v-for="(edu, i) in cv.education" :key="i" class="cv-entry">
          <div class="cv-entry-header">
            <span style="font-size:12px;font-weight:600">Education {{ i + 1 }}</span>
            <button class="btn btn-danger btn-sm" @click="cv.education.splice(i,1)">Remove</button>
          </div>
          <div class="form-group">
            <label class="label">Degree / Certificate</label>
            <input class="input" v-model="edu.degree" placeholder="e.g. Bachelor of Computer Science" />
          </div>
          <div class="form-group">
            <label class="label">School / Institution</label>
            <input class="input" v-model="edu.school" placeholder="University name" />
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="form-group">
              <label class="label">Start Year</label>
              <input class="input" v-model="edu.start_year" placeholder="2020" />
            </div>
            <div class="form-group">
              <label class="label">End Year</label>
              <input class="input" v-model="edu.end_year" placeholder="2024" />
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-full btn-lg" style="margin-top:24px" @click="downloadCV">
          ⬇️ Download CV as PDF
        </button>
      </aside>

      <!-- Right: Preview -->
      <main class="cv-preview-wrap">
        <div class="cv-preview" id="cv-preview">
          <!-- Header -->
          <div class="cvp-header">
            <div class="cvp-name">{{ cv.name || 'Your Name' }}</div>
            <div class="cvp-title">{{ cv.title || 'Your Job Title' }}</div>
            <div class="cvp-contact">
              <span v-if="cv.email">✉ {{ cv.email }}</span>
              <span v-if="cv.phone">📞 {{ cv.phone }}</span>
              <span v-if="cv.location">📍 {{ cv.location }}</span>
              <span v-if="cv.website">🔗 {{ cv.website }}</span>
            </div>
          </div>

          <!-- Summary -->
          <div v-if="cv.summary" class="cvp-section">
            <div class="cvp-section-title">PROFESSIONAL SUMMARY</div>
            <p class="cvp-text">{{ cv.summary }}</p>
          </div>

          <!-- Skills -->
          <div v-if="cv.skills.length" class="cvp-section">
            <div class="cvp-section-title">SKILLS</div>
            <div class="cvp-skills">
              <span v-for="s in cv.skills" :key="s" class="cvp-skill">{{ s }}</span>
            </div>
          </div>

          <!-- Experience -->
          <div v-if="cv.experience.length" class="cvp-section">
            <div class="cvp-section-title">EXPERIENCE</div>
            <div v-for="(exp, i) in cv.experience" :key="i" class="cvp-entry">
              <div class="cvp-entry-header">
                <div>
                  <div class="cvp-entry-role">{{ exp.role }}</div>
                  <div class="cvp-entry-company">{{ exp.company }}</div>
                </div>
                <div class="cvp-entry-period">{{ exp.start_year }} — {{ exp.end_year || 'Present' }}</div>
              </div>
              <p v-if="exp.description" class="cvp-text">{{ exp.description }}</p>
            </div>
          </div>

          <!-- Education -->
          <div v-if="cv.education.length" class="cvp-section">
            <div class="cvp-section-title">EDUCATION</div>
            <div v-for="(edu, i) in cv.education" :key="i" class="cvp-entry">
              <div class="cvp-entry-header">
                <div>
                  <div class="cvp-entry-role">{{ edu.degree }}</div>
                  <div class="cvp-entry-company">{{ edu.school }}</div>
                </div>
                <div class="cvp-entry-period">{{ edu.start_year }} — {{ edu.end_year }}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="cvp-footer">Generated by TalentHub — talenthub-cd.vercel.app</div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { auth } from '@/stores/auth'
import { supabase } from '@/supabase'

const skillInput = ref('')

const cv = reactive({
  name:       '',
  title:      '',
  email:      '',
  phone:      '',
  location:   '',
  website:    '',
  summary:    '',
  skills:     [],
  experience: [],
  education:  [],
})

onMounted(async () => {
  // Pre-fill from profile
  if (auth.profile) {
    cv.name     = auth.profile.full_name || ''
    cv.title    = auth.profile.title || ''
    cv.email    = auth.user?.email || ''
    cv.phone    = auth.profile.phone || ''
    cv.location = auth.profile.location || ''
    cv.website  = auth.profile.website || ''
    cv.summary  = auth.profile.bio || ''
    cv.skills   = [...(auth.profile.skills || [])]
  }

  // Load experience from DB
  const { data: expData } = await supabase.from('experience')
    .select('*').eq('user_id', auth.user.id).order('start_year', { ascending: false })
  if (expData?.length) {
    cv.experience = expData.map(e => ({
      role: e.role, company: e.company,
      start_year: e.start_year, end_year: e.end_year || 'Present',
      description: e.description || ''
    }))
  }
})

function addSkill() {
  const v = skillInput.value.trim().replace(',','')
  if (v && !cv.skills.includes(v)) cv.skills.push(v)
  skillInput.value = ''
}
function removeSkill(s) { cv.skills = cv.skills.filter(x => x !== s) }
function addExp() { cv.experience.push({ role:'', company:'', start_year:'', end_year:'', description:'' }) }
function addEdu() { cv.education.push({ degree:'', school:'', start_year:'', end_year:'' }) }

async function downloadCV() {
  const el = document.getElementById('cv-preview')
  // Use browser print to PDF
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${cv.name} — CV</title>
      <style>
        * { box-sizing:border-box;margin:0;padding:0; }
        body { font-family:'Arial',sans-serif;font-size:13px;color:#1a1a2e;line-height:1.6;padding:40px; }
        .cvp-header { border-bottom:3px solid #2563eb;padding-bottom:16px;margin-bottom:20px; }
        .cvp-name   { font-size:28px;font-weight:700;color:#1a1a2e;margin-bottom:4px; }
        .cvp-title  { font-size:16px;color:#2563eb;font-weight:600;margin-bottom:8px; }
        .cvp-contact{ display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:#555; }
        .cvp-section{ margin-bottom:20px; }
        .cvp-section-title{ font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;border-bottom:1px solid #e5e7eb;padding-bottom:4px; }
        .cvp-text   { font-size:13px;color:#374151;line-height:1.7; }
        .cvp-skills { display:flex;flex-wrap:wrap;gap:8px; }
        .cvp-skill  { background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:3px 10px;border-radius:50px;font-size:12px;font-weight:500; }
        .cvp-entry  { margin-bottom:14px; }
        .cvp-entry-header{ display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px; }
        .cvp-entry-role   { font-size:14px;font-weight:700;color:#1a1a2e; }
        .cvp-entry-company{ font-size:13px;color:#6b7280; }
        .cvp-entry-period { font-size:12px;color:#9ca3af;white-space:nowrap; }
        .cvp-footer { margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center; }
        @media print { body { padding:20px; } }
      </style>
    </head>
    <body>${el.innerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
}
</script>

<style scoped>
.cv-page {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 0;
  min-height: calc(100vh - 56px);
}
@media (max-width: 900px) {
  .cv-page { grid-template-columns: 1fr; }
}
.cv-form {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 28px;
  overflow-y: auto;
  max-height: calc(100vh - 56px);
}
.cv-form-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.cv-section-title {
  font-size: 11px; font-weight: 700; color: var(--accent);
  text-transform: uppercase; letter-spacing: 0.1em;
  margin-bottom: 12px; display: flex; align-items: center;
}
.cv-entry {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px; margin-bottom: 12px;
}
.cv-entry-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}

/* Preview */
.cv-preview-wrap {
  background: #e5e7eb;
  display: flex; justify-content: center;
  padding: 32px; overflow-y: auto;
  max-height: calc(100vh - 56px);
}
.cv-preview {
  background: white; color: #1a1a2e;
  width: 100%; max-width: 720px;
  padding: 48px; border-radius: 4px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6;
}
.cvp-header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
.cvp-name   { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
.cvp-title  { font-size: 16px; color: #2563eb; font-weight: 600; margin-bottom: 8px; }
.cvp-contact{ display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #555; }
.cvp-section{ margin-bottom: 20px; }
.cvp-section-title {
  font-size: 11px; font-weight: 700; color: #2563eb;
  text-transform: uppercase; letter-spacing: 0.1em;
  margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;
}
.cvp-text   { font-size: 13px; color: #374151; line-height: 1.7; }
.cvp-skills { display: flex; flex-wrap: wrap; gap: 8px; }
.cvp-skill  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 3px 10px; border-radius: 50px; font-size: 12px; font-weight: 500; }
.cvp-entry  { margin-bottom: 14px; }
.cvp-entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.cvp-entry-role    { font-size: 14px; font-weight: 700; }
.cvp-entry-company { font-size: 13px; color: #6b7280; }
.cvp-entry-period  { font-size: 12px; color: #9ca3af; white-space: nowrap; }
.cvp-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
</style>
