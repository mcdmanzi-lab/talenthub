<template>
  <div>
    <Navbar />
    <div v-if="loading" class="page-loader" style="justify-content:center"><div class="spinner"></div></div>
    <div v-else-if="!post" class="empty" style="margin-top:80px">
      <div class="empty-icon">📰</div>
      <p>Post not found.</p>
      <RouterLink to="/blog" class="btn btn-ghost" style="margin-top:16px">← Back to Blog</RouterLink>
    </div>
    <article v-else class="blog-post-page">
      <div class="blog-post-header">
        <RouterLink to="/blog" class="blog-back">← Back to Blog</RouterLink>
        <div class="blog-post-cat">{{ post.category }}</div>
        <h1>{{ post.title }}</h1>
        <div class="blog-post-meta">
          <span>✍️ {{ post.author }}</span>
          <span>📅 {{ formatDate(post.created_at) }}</span>
          <span>⏱ {{ post.read_time || '3' }} min read</span>
        </div>
      </div>

      <div v-if="post.cover_image" class="blog-post-cover">
        <img :src="post.cover_image" :alt="post.title" />
      </div>

      <div class="blog-post-body" v-html="renderedContent"></div>

      <div class="blog-post-footer">
        <RouterLink to="/blog" class="btn btn-ghost">← Back to Blog</RouterLink>
        <RouterLink to="/register" class="btn btn-primary">Join TalentHub →</RouterLink>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { supabase } from '@/supabase'

const route   = useRoute()
const loading = ref(true)
const post    = ref(null)

// Simple markdown-like renderer
const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return post.value.content
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|l])(.+)$/gm, '<p>$1</p>')
})

onMounted(async () => {
  const { data } = await supabase.from('blog_posts')
    .select('*').eq('slug', route.params.slug).eq('published', true).maybeSingle()
  post.value = data
  loading.value = false

  // Increment views
  if (data) {
    await supabase.from('blog_posts').update({ views: (data.views || 0) + 1 }).eq('id', data.id)
  }
})

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.blog-post-page   { max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
.blog-back        { font-size: 13px; color: var(--text-dim); text-decoration: none; display: inline-block; margin-bottom: 16px; }
.blog-back:hover  { color: var(--text); }
.blog-post-cat    { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
.blog-post-header h1 { font-size: 32px; font-weight: 700; line-height: 1.3; margin-bottom: 16px; }
.blog-post-meta   { display: flex; gap: 16px; font-size: 12px; color: var(--text-ghost); flex-wrap: wrap; margin-bottom: 32px; }
.blog-post-cover  { border-radius: var(--radius-xl); overflow: hidden; margin-bottom: 32px; }
.blog-post-cover img { width: 100%; max-height: 400px; object-fit: cover; }
.blog-post-body   { font-size: 15px; line-height: 1.85; color: var(--text-dim); }
.blog-post-body :deep(h2) { font-size: 22px; font-weight: 700; color: var(--text); margin: 32px 0 12px; }
.blog-post-body :deep(h3) { font-size: 18px; font-weight: 600; color: var(--text); margin: 24px 0 10px; }
.blog-post-body :deep(p)  { margin-bottom: 16px; }
.blog-post-body :deep(ul) { padding-left: 24px; margin-bottom: 16px; }
.blog-post-body :deep(li) { margin-bottom: 8px; }
.blog-post-body :deep(strong) { color: var(--text); font-weight: 600; }
.blog-post-footer { display: flex; gap: 12px; margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border); }
</style>
