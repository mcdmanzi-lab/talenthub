<template>
  <div class="notif-wrapper" ref="wrapRef">
    <button class="notif-btn" @click="toggle">
      🔔
      <span v-if="unread > 0" class="notif-dot">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <div v-if="open" class="notif-panel">
      <div class="notif-header">
        <span class="notif-title">Notifications</span>
        <button v-if="unread > 0" @click="markAll" style="font-size:12px;color:#3b82f6;background:none;border:none;cursor:pointer">Mark all read</button>
      </div>
      <div v-if="!notifications.length" style="padding:32px;text-align:center;color:var(--text-ghost)">
        <div style="font-size:2rem;margin-bottom:8px">🔔</div>
        <p style="font-size:13px">No notifications yet.</p>
      </div>
      <div v-else style="max-height:320px;overflow-y:auto">
        <div v-for="n in notifications" :key="n.id"
          class="notif-item" :class="{ unread: !n.read }"
          @click="openNotif(n)">
          <span style="font-size:18px;flex-shrink:0;margin-top:2px">{{ typeIcon(n.type) }}</span>
          <div style="flex:1;min-width:0">
            <div class="notif-item-title">{{ n.title }}</div>
            <div class="notif-item-msg">{{ n.message }}</div>
            <div class="notif-item-time">{{ timeAgo(n.created_at) }}</div>
          </div>
          <div v-if="!n.read" style="width:8px;height:8px;border-radius:50%;background:#3b82f6;flex-shrink:0;margin-top:6px"></div>
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

const router = useRouter()
const open   = ref(false)
const wrapRef = ref(null)
const notifications = ref([])
const unread = computed(() => notifications.value.filter(n => !n.read).length)

onMounted(() => { load(); document.addEventListener('click', clickOutside) })
onUnmounted(() => document.removeEventListener('click', clickOutside))

function clickOutside(e) { if (wrapRef.value && !wrapRef.value.contains(e.target)) open.value = false }
function toggle() { open.value = !open.value; if (open.value) load() }

async function load() {
  if (!auth.user) return
  const { data } = await supabase.from('notifications').select('*')
    .eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20)
  notifications.value = data || []
}

async function markAll() {
  await supabase.from('notifications').update({ read: true }).eq('user_id', auth.user.id).eq('read', false)
  notifications.value.forEach(n => n.read = true)
}

async function openNotif(n) {
  if (!n.read) { await supabase.from('notifications').update({ read: true }).eq('id', n.id); n.read = true }
  open.value = false
  if (n.link) router.push(n.link)
}

function typeIcon(t) {
  return { new_application:'📨', job_approved:'✅', job_rejected:'❌', new_message:'✉️', payment:'💰', job_alert:'🔔', job_expiring:'⏰', verified:'🏅' }[t] || '🔔'
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d), m = Math.floor(diff/60000), h = Math.floor(diff/3600000), day = Math.floor(diff/86400000)
  if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; return `${day}d ago`
}
</script>
