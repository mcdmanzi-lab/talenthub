<template>
  <div class="job-card" :class="job.featured ? 'job-card-featured' : ''" @click="trackView">
    <div class="job-card-header">
      <div style="display:flex;align-items:flex-start;gap:12px;flex:1;min-width:0">
        <div class="job-logo">{{ job.company?.[0]?.toUpperCase() || '?' }}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px">
            <h3 class="job-card-title">{{ job.title }}</h3>
            <span v-if="job.featured" class="badge badge-yellow">⚡ Featured</span>
          </div>
          <div class="job-card-company">{{ job.company }}</div>
          <div class="job-card-meta">
            <span>📍 {{ job.location }}</span>
            <span>⏰ {{ job.type }}</span>
            <span v-if="job.remote" style="color:var(--green)">🌐 Remote</span>
            <span v-if="job.salary">💰 {{ job.salary }}</span>
            <span style="color:var(--text-ghost)">👁 {{ job.views || 0 }} views</span>
          </div>
          <div v-if="job.tags?.length" class="job-card-tags">
            <span v-for="tag in job.tags.slice(0,4)" :key="tag" class="skill-chip">{{ tag }}</span>
          </div>
          <!-- Translated description -->
          <div v-if="translatedDesc" class="job-translated">
            <div class="job-translated-label">🌐 Translated</div>
            <p class="job-translated-text">{{ translatedDesc }}</p>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">
        <span style="font-size:12px;color:var(--text-ghost)">{{ timeAgo(job.created_at) }}</span>
        <button @click.stop="toggleSave" style="background:none;border:none;cursor:pointer;font-size:18px" :title="isSaved ? 'Unsave' : 'Save'">
          {{ isSaved ? '🔖' : '🔖' }}
        </button>
      </div>
    </div>

    <div class="job-card-footer">
      <button class="btn btn-primary btn-sm" @click.stop="$emit('apply', job)">Apply Now</button>
      <button class="btn btn-ghost btn-sm" @click.stop="toggleTranslate" v-if="currentLang !== 'en'">
        {{ translating ? '...' : translatedDesc ? '✕ Original' : '🌐 Translate' }}
      </button>
      <a v-if="job.whatsapp_number"
        :href="`https://wa.me/${formatWA(job.whatsapp_number)}?text=${encodeURIComponent('Hello, I saw your job post for ' + job.title + ' at ' + job.company + ' on TalentHub and I am interested. Can we discuss?')}`"
        target="_blank"
        class="btn btn-whatsapp btn-sm"
        @click.stop>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </a>
      <RouterLink :to="'/company/'+job.employer_id" class="btn btn-ghost btn-sm" style="margin-left:auto;text-decoration:none" @click.stop>{{ job.company }} →</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '@/supabase'
import { translateText, getCurrentLang } from '@/utils/translate'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'

const props = defineProps({ job: Object })
defineEmits(['apply'])

const isSaved        = ref(false)
const translatedDesc = ref('')
const translating    = ref(false)
const currentLang    = ref(getCurrentLang())

window.addEventListener('lang-changed', (e) => { currentLang.value = e.detail; translatedDesc.value = '' })

onMounted(async () => {
  if (!auth.user) return
  try {
    const { data } = await supabase.from('saved_jobs').select('id').eq('user_id',auth.user.id).eq('job_id',props.job.id).maybeSingle()
    isSaved.value = !!data
  } catch { isSaved.value = false }
})

async function toggleTranslate() {
  if (translatedDesc.value) { translatedDesc.value = ''; return }
  if (!props.job?.description) return
  translating.value = true
  translatedDesc.value = await translateText(props.job.description.slice(0, 500), currentLang.value)
  translating.value = false
}

async function trackView() {
  // Increment view count — don't count employer's own job views
  if (!auth.user || auth.user.id === props.job.employer_id) return
  const key = `viewed_${props.job.id}`
  if (sessionStorage.getItem(key)) return // only count once per session
  sessionStorage.setItem(key, '1')
  await supabase.from('jobs').update({ views: (props.job.views || 0) + 1 }).eq('id', props.job.id)
}

async function toggleSave() {
  if (!auth.user) { toast.error('Sign in to save jobs'); return }
  if (isSaved.value) {
    await supabase.from('saved_jobs').delete().eq('user_id',auth.user.id).eq('job_id',props.job.id)
    isSaved.value = false; toast.info('Removed from saved')
  } else {
    await supabase.from('saved_jobs').insert({ user_id:auth.user.id, job_id:props.job.id })
    isSaved.value = true; toast.success('Job saved!')
  }
}

function formatWA(phone) {
  let p = (phone||'').replace(/[^0-9]/g,'')
  if (p.startsWith('07')) p = '250' + p.slice(1)
  if (p.startsWith('7'))  p = '250' + p
  return p
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d)
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), day = Math.floor(diff/86400000)
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${day}d ago`
}
</script>
