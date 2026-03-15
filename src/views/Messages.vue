<template>
  <div>
    <Navbar />
    <div class="messages-page">
      <div class="messages-layout">

        <!-- Thread list -->
        <aside class="threads-panel">
          <div class="threads-header">
            <h2 class="threads-title">Messages</h2>
            <span class="badge badge-blue" v-if="unread > 0">{{ unread }} new</span>
          </div>
          <div v-if="loading" class="page-loader"><div class="spinner"></div></div>
          <div v-else-if="!threads.length" class="empty" style="padding:32px 16px">
            <div class="empty-icon">✉️</div>
            <p>No messages yet.</p>
          </div>
          <div v-else>
            <div v-for="t in threads" :key="t.id"
              class="thread-item" :class="{active: activeThread?.id===t.id, unread: !t.read_by_receiver && t.receiver_id===auth.user?.id}"
              @click="openThread(t)">
              <div class="thread-avatar">{{ getInitials(t.sender_id === auth.user?.id ? t.receiver_name : t.sender_name) }}</div>
              <div class="thread-info">
                <div class="thread-name">{{ t.sender_id === auth.user?.id ? t.receiver_name : t.sender_name }}</div>
                <div class="thread-subject">{{ t.subject }}</div>
                <div class="thread-preview">{{ t.content?.slice(0,60) }}…</div>
              </div>
              <div class="thread-time">{{ timeAgo(t.created_at) }}</div>
            </div>
          </div>
        </aside>

        <!-- Message view -->
        <main class="message-view">
          <div v-if="!activeThread" class="empty" style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px">
            <div style="font-size:3rem;opacity:.3">✉️</div>
            <p style="color:var(--text-ghost)">Select a conversation</p>
          </div>
          <template v-else>
            <div class="mv-header">
              <div>
                <div class="mv-subject">{{ activeThread.subject }}</div>
                <div class="mv-meta">
                  From <strong>{{ activeThread.sender_name }}</strong> to <strong>{{ activeThread.receiver_name }}</strong>
                  · {{ timeAgo(activeThread.created_at) }}
                </div>
              </div>
            </div>
            <div class="mv-body">
              <p>{{ activeThread.content }}</p>
            </div>
            <div class="mv-reply">
              <textarea class="input" v-model="reply" rows="4" placeholder="Write a reply…" />
              <button class="btn btn-primary" style="margin-top:10px" @click="sendReply" :disabled="sending">
                <span v-if="sending" class="spinner"></span>
                <span>{{ sending ? 'Sending…' : 'Send Reply' }}</span>
              </button>
            </div>
          </template>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { sendEmail } from '@/utils/email'
import { sanitizeReply } from '@/utils/validate'

const loading      = ref(true)
const threads      = ref([])
const activeThread = ref(null)
const reply        = ref('')
const sending      = ref(false)

const unread = computed(() => threads.value.filter(t => !t.read_by_receiver && t.receiver_id === auth.user?.id).length)

onMounted(load)

async function load() {
  loading.value = true
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${auth.user.id},receiver_id.eq.${auth.user.id}`)
    .order('created_at', { ascending: false })
  threads.value = data || []
  loading.value = false
}

async function openThread(t) {
  activeThread.value = t
  // Mark as read
  if (!t.read_by_receiver && t.receiver_id === auth.user?.id) {
    await supabase.from('messages').update({ read_by_receiver: true }).eq('id', t.id)
    t.read_by_receiver = true
  }
}

async function sendReply() {
  const { cleaned, error: valErr } = sanitizeReply(reply.value)
  if (valErr) { toast.error(valErr); return }
  reply.value = cleaned
  sending.value = true
  const receiverId   = activeThread.value.sender_id === auth.user.id ? activeThread.value.receiver_id : activeThread.value.sender_id
  const receiverName = activeThread.value.sender_id === auth.user.id ? activeThread.value.receiver_name : activeThread.value.sender_name

  await supabase.from('messages').insert({
    sender_id:        auth.user.id,
    sender_name:      auth.profile?.full_name,
    receiver_id:      receiverId,
    receiver_name:    receiverName,
    subject:          'Re: ' + activeThread.value.subject,
    content:          reply.value,
    read_by_receiver: false
  })

  await sendEmail({
    to:      activeThread.value.sender_id === auth.user.id ? activeThread.value.receiver_name : activeThread.value.sender_name,
    subject: 'Re: ' + activeThread.value.subject,
    html:    `<p>You have a new reply from <strong>${auth.profile?.full_name}</strong> on TalentHub:</p><p>${reply.value.replace(/\n/g,'<br>')}</p>`
  })

  reply.value = ''
  sending.value = false
  toast.success('Reply sent!')
  await load()
}

function getInitials(name) {
  return (name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d), day = Math.floor(diff/86400000)
  if (day < 1) return 'Today'; if (day < 30) return `${day}d ago`
  return new Date(d).toLocaleDateString()
}
</script>


