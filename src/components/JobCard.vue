<template>
  <div class="bg-[#111118] border rounded-xl p-5 transition-all duration-150 hover:border-white/[0.12]"
    :class="job.featured ? 'border-yellow-800/50' : 'border-white/[0.06]'">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-3 flex-1 min-w-0">
        <!-- Logo -->
        <div class="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-blue-600/20">
          {{ job.company?.[0]?.toUpperCase() || '?' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 class="font-semibold text-sm text-gray-100">{{ job.title }}</h3>
            <span v-if="job.featured" class="badge badge-yellow">⚡ Featured</span>
          </div>
          <div class="text-xs text-gray-500">{{ job.company }}</div>
          <div class="flex items-center gap-3 mt-2 text-xs text-gray-600 flex-wrap">
            <span>📍 {{ job.location }}</span>
            <span>⏰ {{ job.type }}</span>
            <span v-if="job.remote" class="text-green-500">🌐 Remote</span>
            <span v-if="job.salary">💰 {{ job.salary }}</span>
          </div>
          <div v-if="job.tags?.length" class="flex flex-wrap gap-1 mt-2">
            <span v-for="tag in job.tags.slice(0,4)" :key="tag" class="skill-chip">{{ tag }}</span>
          </div>
        </div>
      </div>
      <!-- Right: time + bookmark -->
      <div class="flex flex-col items-end gap-2 flex-shrink-0">
        <span class="text-xs text-gray-600">{{ timeAgo(job.created_at) }}</span>
        <button @click.stop="toggleSave" class="text-gray-600 hover:text-yellow-400 transition-colors text-base">
          {{ isSaved ? '🔖' : '🔖' }}
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 mt-4 pt-4 border-t border-white/[0.06] flex-wrap">
      <button class="btn btn-primary btn-sm" @click="$emit('apply', job)">Apply Now</button>
      <a v-if="job.whatsapp_number"
        :href="`https://wa.me/${formatWA(job.whatsapp_number)}?text=${encodeURIComponent('Hello, I saw your job post for ' + job.title + ' at ' + job.company + ' on TalentHub and I am interested. Can we discuss?')}`"
        target="_blank"
        class="btn btn-whatsapp btn-sm no-underline">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </a>
      <RouterLink :to="'/company/'+job.employer_id" class="btn btn-ghost btn-sm no-underline ml-auto">{{ job.company }} →</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'

const props = defineProps({ job: Object })
defineEmits(['apply'])

const isSaved = ref(false)

onMounted(async () => {
  if (!auth.user) return
  try {
    const { data } = await supabase.from('saved_jobs').select('id').eq('user_id',auth.user.id).eq('job_id',props.job.id).maybeSingle()
    isSaved.value = !!data
  } catch { isSaved.value = false }
})

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
