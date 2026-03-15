<template>
  <div class="relative" ref="wrapRef">
    <button class="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-base" @click="toggle">
      🔔
      <span v-if="unread > 0" class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>

    <div v-if="open" class="absolute right-0 top-[calc(100%+8px)] w-80 bg-[#111118] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span class="text-sm font-semibold">Notifications</span>
        <button v-if="unread>0" @click="markAll" class="text-xs text-blue-500 bg-transparent border-0 cursor-pointer">Mark all read</button>
      </div>
      <div v-if="!notifications.length" class="py-8 text-center text-xs text-gray-600">
        <div class="text-3xl mb-2">🔔</div>No notifications yet.
      </div>
      <div v-else class="max-h-80 overflow-y-auto">
        <div v-for="n in notifications" :key="n.id"
          class="flex gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 border-b border-white/[0.04] last:border-0 transition-colors"
          :class="{ 'bg-blue-600/5': !n.read }"
          @click="openNotif(n)">
          <span class="text-lg flex-shrink-0 mt-0.5">{{ typeIcon(n.type) }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-semibold text-gray-200 mb-0.5">{{ n.title }}</div>
            <div class="text-xs text-gray-500 leading-relaxed">{{ n.message }}</div>
            <div class="text-[10px] text-gray-700 mt-1">{{ timeAgo(n.created_at) }}</div>
          </div>
          <div v-if="!n.read" class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
const router = useRouter(); const open = ref(false); const wrapRef = ref(null); const notifications = ref([])
const unread = computed(() => notifications.value.filter(n=>!n.read).length)
onMounted(() => { load(); document.addEventListener('click', clickOutside) })
onUnmounted(() => document.removeEventListener('click', clickOutside))
function clickOutside(e) { if (wrapRef.value && !wrapRef.value.contains(e.target)) open.value = false }
function toggle() { open.value = !open.value; if (open.value) load() }
async function load() {
  if (!auth.user) return
  const { data } = await supabase.from('notifications').select('*').eq('user_id',auth.user.id).order('created_at',{ascending:false}).limit(20)
  notifications.value = data || []
}
async function markAll() {
  await supabase.from('notifications').update({read:true}).eq('user_id',auth.user.id).eq('read',false)
  notifications.value.forEach(n=>n.read=true)
}
async function openNotif(n) {
  if (!n.read) { await supabase.from('notifications').update({read:true}).eq('id',n.id); n.read=true }
  open.value = false
  if (n.link) router.push(n.link)
}
function typeIcon(t) { return {new_application:'📨',job_approved:'✅',job_rejected:'❌',new_message:'✉️',payment:'💰',job_alert:'🔔',job_expiring:'⏰'}[t]||'🔔' }
function timeAgo(d) { const diff=Date.now()-new Date(d),m=Math.floor(diff/60000),h=Math.floor(diff/3600000),day=Math.floor(diff/86400000); if(m<60)return`${m}m ago`; if(h<24)return`${h}h ago`; return`${day}d ago` }
</script>
