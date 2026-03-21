<template>
  <div>
    <Navbar />
    <div class="messages-page">
      <div class="messages-layout">

        <!-- LEFT: Conversation list -->
        <aside class="threads-panel">
          <div class="threads-header">
            <h2 class="threads-title">Messages</h2>
            <span v-if="unread > 0" class="badge badge-blue">{{ unread }} new</span>
          </div>
          <div v-if="loading" class="page-loader"><div class="spinner"></div></div>
          <div v-else-if="!conversations.length" class="empty" style="padding:32px 16px">
            <div class="empty-icon">✉️</div>
            <p>No messages yet.</p>
          </div>
          <div v-else>
            <div v-for="conv in conversations" :key="conv.other_id"
              class="thread-item"
              :class="{ active: activeConv?.other_id === conv.other_id, unread: conv.unread_count > 0 }"
              @click="openConversation(conv)">
              <div class="thread-avatar">{{ getInitials(conv.other_name) }}</div>
              <div class="thread-info">
                <div class="thread-name">{{ conv.other_name }}</div>
                <div class="thread-preview">{{ conv.last_message?.slice(0, 55) }}…</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                <div class="thread-time">{{ timeAgo(conv.last_at) }}</div>
                <span v-if="conv.unread_count > 0" class="badge badge-blue" style="font-size:10px">{{ conv.unread_count }}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- RIGHT: Conversation messages -->
        <main class="message-view">
          <!-- Empty state -->
          <div v-if="!activeConv" class="msg-empty">
            <div style="font-size:3rem;opacity:.3">✉️</div>
            <p>Select a conversation</p>
          </div>

          <!-- Active conversation -->
          <template v-else>
            <!-- Header -->
            <div class="mv-header">
              <div class="conv-avatar">{{ getInitials(activeConv.other_name) }}</div>
              <div>
                <div class="mv-subject">{{ activeConv.other_name }}</div>
                <div class="mv-meta">{{ activeMessages.length }} messages</div>
              </div>
            </div>

            <!-- Messages -->
            <div class="msg-bubble-list" ref="bubbleList">
              <div v-if="loadingMessages" class="page-loader"><div class="spinner"></div></div>
              <div v-else v-for="msg in activeMessages" :key="msg.id"
                class="msg-bubble-wrap"
                :class="{ mine: msg.sender_id === auth.user.id }">
                <div class="msg-bubble" :class="{ 'bubble-mine': msg.sender_id === auth.user.id, 'bubble-theirs': msg.sender_id !== auth.user.id }">
                  <div v-if="msg.subject && !msg.subject.startsWith('Re:')" class="bubble-subject">{{ msg.subject }}</div>
                  <div class="bubble-content">{{ msg.content }}</div>
                  <div class="bubble-time">{{ timeAgo(msg.created_at) }}</div>
                </div>
              </div>
            </div>

            <!-- Reply box -->
            <div class="mv-reply">
              <div style="display:flex;gap:10px;align-items:flex-end">
                <textarea class="input reply-input" v-model="reply" rows="3"
                  placeholder="Write a message…"
                  @keydown.enter.ctrl.prevent="sendReply"
                  @keydown.enter.meta.prevent="sendReply" />
                <button class="btn btn-primary" style="flex-shrink:0;height:42px" @click="sendReply" :disabled="sending">
                  <span v-if="sending" class="spinner"></span>
                  <span v-else>Send ↑</span>
                </button>
              </div>
              <div style="font-size:11px;color:var(--text-ghost);margin-top:6px">Ctrl+Enter to send</div>
            </div>
          </template>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, nextTick } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { supabase } from '@/supabase'
import { auth } from '@/stores/auth'
import { toast } from '@/stores/toast'
import { sendEmail } from '@/utils/email'
import { sanitizeReply } from '@/utils/validate'

const loading        = ref(true)
const loadingMessages = ref(false)
const allMessages    = ref([])
const activeConv     = ref(null)
const activeMessages = ref([])
const reply          = ref('')
const sending        = ref(false)
const bubbleList     = ref(null)

// Group messages into conversations by the other person
const conversations = computed(() => {
  const map = {}
  for (const msg of allMessages.value) {
    const otherId   = msg.sender_id === auth.user.id ? msg.receiver_id : msg.sender_id
    const otherName = msg.sender_id === auth.user.id ? msg.receiver_name : msg.sender_name
    if (!map[otherId]) {
      map[otherId] = { other_id: otherId, other_name: otherName, last_message: '', last_at: msg.created_at, unread_count: 0 }
    }
    map[otherId].last_message = msg.content
    if (new Date(msg.created_at) > new Date(map[otherId].last_at)) map[otherId].last_at = msg.created_at
    if (!msg.read_by_receiver && msg.receiver_id === auth.user.id) map[otherId].unread_count++
  }
  return Object.values(map).sort((a,b) => new Date(b.last_at) - new Date(a.last_at))
})

const unread = computed(() => conversations.value.reduce((sum, c) => sum + c.unread_count, 0))

onMounted(async () => {
  if (auth.user?.id) await loadAll()
})

onActivated(async () => {
  if (auth.user?.id) await loadAll()
})

watch(() => auth.user?.id, async (id) => {
  if (id) await loadAll()
}, { immediate: true })

async function loadAll() {
  loading.value = true
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${auth.user.id},receiver_id.eq.${auth.user.id}`)
    .order('created_at', { ascending: true })
  allMessages.value = data || []
  loading.value = false
}

async function openConversation(conv) {
  activeConv.value = conv
  loadingMessages.value = true

  // Get all messages between the two users
  activeMessages.value = allMessages.value.filter(msg =>
    (msg.sender_id === auth.user.id && msg.receiver_id === conv.other_id) ||
    (msg.sender_id === conv.other_id && msg.receiver_id === auth.user.id)
  )

  // Mark unread messages as read
  const unreadIds = activeMessages.value
    .filter(m => !m.read_by_receiver && m.receiver_id === auth.user.id)
    .map(m => m.id)
  if (unreadIds.length) {
    await supabase.from('messages').update({ read_by_receiver: true }).in('id', unreadIds)
    unreadIds.forEach(id => {
      const msg = allMessages.value.find(m => m.id === id)
      if (msg) msg.read_by_receiver = true
    })
  }

  loadingMessages.value = false
  await nextTick()
  scrollToBottom()
}

async function sendReply() {
  if (!reply.value.trim()) return
  const { cleaned, error: valErr } = sanitizeReply(reply.value)
  if (valErr) { toast.error(valErr); return }

  sending.value = true
  const newMsg = {
    sender_id:        auth.user.id,
    sender_name:      auth.profile?.full_name,
    receiver_id:      activeConv.value.other_id,
    receiver_name:    activeConv.value.other_name,
    subject:          'Re: conversation',
    content:          cleaned,
    read_by_receiver: false,
  }

  const { data } = await supabase.from('messages').insert(newMsg).select().single()
  if (data) {
    allMessages.value.push(data)
    activeMessages.value.push(data)
  }

  await sendEmail({
    to:      activeConv.value.other_name,
    subject: `New message from ${auth.profile?.full_name} on TalentHub`,
    html:    `<p><strong>${auth.profile?.full_name}</strong> sent you a message on TalentHub:</p><p style="background:#f3f4f6;padding:12px;border-radius:8px">${cleaned.replace(/\n/g,'<br>')}</p><a href="${import.meta.env.VITE_APP_URL}/messages" style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">Reply on TalentHub →</a>`
  })

  reply.value = ''
  sending.value = false
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (bubbleList.value) bubbleList.value.scrollTop = bubbleList.value.scrollHeight
}

function getInitials(name) {
  return (name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
}
function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d), m = Math.floor(diff/60000), h = Math.floor(diff/3600000), day = Math.floor(diff/86400000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (day < 7) return `${day}d ago`
  return new Date(d).toLocaleDateString()
}
</script>

<style scoped>
.msg-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  color: var(--text-ghost);
  font-size: 14px;
}
.conv-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--accent-bg); color: #93c5fd;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; border: 1px solid var(--accent-border);
  flex-shrink: 0;
}
.mv-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.msg-bubble-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.msg-bubble-wrap { display: flex; }
.msg-bubble-wrap.mine { justify-content: flex-end; }
.msg-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
}
.bubble-mine {
  background: var(--accent);
  color: white;
  border-bottom-right-radius: 4px;
}
.bubble-theirs {
  background: var(--surface2);
  color: var(--text);
  border-bottom-left-radius: 4px;
}
.bubble-subject {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.7;
  margin-bottom: 4px;
}
.bubble-content { word-break: break-word; }
.bubble-time {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 4px;
  text-align: right;
}
.reply-input { resize: none; }
.mv-reply { padding: 16px 20px; border-top: 1px solid var(--border); }
</style>
