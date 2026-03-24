<template>
  <div>
    <Navbar />
    <div class="blog-page">

      <!-- Header -->
      <div class="blog-header">
        <div class="section-label">Blog & News</div>
        <h1>Career Tips & Updates</h1>
        <p>Job hunting advice, platform news and professional tips for Africa.</p>
      </div>

      <!-- Posts grid -->
      <div v-if="loading" class="page-loader"><div class="spinner"></div> Loading…</div>
      <div v-else-if="!posts.length" class="empty">
        <div class="empty-icon">📰</div>
        <p>No posts yet. Check back soon.</p>
      </div>
      <div v-else class="blog-grid">
        <RouterLink v-for="post in posts" :key="post.id"
          :to="'/blog/' + post.slug"
          class="blog-card">
          <div v-if="post.cover_image" class="blog-card-img">
            <img :src="post.cover_image" :alt="post.title" />
          </div>
          <div v-else class="blog-card-img-placeholder">{{ post.emoji || '📰' }}</div>
          <div class="blog-card-body">
            <div class="blog-card-cat">{{ post.category }}</div>
            <h2 class="blog-card-title">{{ post.title }}</h2>
            <p class="blog-card-excerpt">{{ post.excerpt }}</p>
            <div class="blog-card-meta">
              <span>{{ post.author }}</span>
              <span>{{ formatDate(post.created_at) }}</span>
              <span>{{ post.read_time || '3' }} min read</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import { supabase } from '@/supabase'

const loading = ref(true)
const posts   = ref([])

onMounted(async () => {
  const { data } = await supabase.from('blog_posts')
    .select('*').eq('published', true)
    .order('created_at', { ascending: false })
  posts.value = data || []
  loading.value = false
})

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.blog-page   { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.blog-header { text-align: center; margin-bottom: 48px; }
.blog-header h1 { font-size: 32px; font-weight: 700; margin: 8px 0; }
.blog-header p  { font-size: 15px; color: var(--text-dim); }
.blog-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 900px) { .blog-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 600px) { .blog-grid { grid-template-columns: 1fr; } }
.blog-card   {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-xl); overflow: hidden;
  text-decoration: none; color: inherit; transition: all 0.2s;
  display: block;
}
.blog-card:hover { border-color: var(--border2); transform: translateY(-2px); }
.blog-card-img   { height: 180px; overflow: hidden; }
.blog-card-img img { width: 100%; height: 100%; object-fit: cover; }
.blog-card-img-placeholder {
  height: 180px; background: var(--surface2);
  display: flex; align-items: center; justify-content: center; font-size: 48px;
}
.blog-card-body  { padding: 20px; }
.blog-card-cat   { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
.blog-card-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; line-height: 1.4; }
.blog-card-excerpt { font-size: 13px; color: var(--text-dim); line-height: 1.6; margin-bottom: 16px; }
.blog-card-meta  { display: flex; gap: 12px; font-size: 11px; color: var(--text-ghost); flex-wrap: wrap; }
</style>
