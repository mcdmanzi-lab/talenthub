<template>
  <div class="landing">
    <Navbar />

    <!-- HERO -->
    <section class="hero">
      <div class="blur-blob"></div>
      <div class="hero-inner">
        <div class="hero-pill">🌍 {{ t(lang, 'tagline') }}</div>
        <h1>{{ t(lang, 'hero_title') }}<br /><span>{{ t(lang, 'hero_sub') }}</span></h1>
        <p>{{ t(lang, 'hero_desc') }}</p>
        <div class="hero-cta">
          <RouterLink to="/jobs"     class="btn btn-primary btn-lg">{{ t(lang, 'browse_jobs_btn') }}</RouterLink>
          <RouterLink to="/register" class="btn btn-ghost btn-lg">{{ t(lang, 'post_job_btn') }}</RouterLink>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><strong>{{ jobCount }}+</strong><small>{{ t(lang, 'active_jobs') }}</small></div>
          <div class="divider-v" style="height:28px"></div>
          <div class="hero-stat"><strong>1,000+</strong><small>{{ t(lang, 'professionals') }}</small></div>
          <div class="divider-v" style="height:28px"></div>
          <div class="hero-stat"><strong>4.8/5</strong><small>{{ t(lang, 'rating') }}</small></div>
        </div>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="section">
      <div class="section-inner">
        <div class="section-label">{{ t(lang, 'categories_label') }}</div>
        <h2>{{ t(lang, 'explore_field') }}</h2>
        <div class="cat-grid">
          <RouterLink v-for="cat in categories" :key="cat.slug" :to="`/jobs?cat=${cat.slug}`" class="cat-card">
            <span style="font-size:20px">{{ cat.icon }}</span>
            <div class="cat-card-text">
              <strong>{{ cat.name }}</strong>
              <small>{{ cat.desc }}</small>
            </div>
            <span class="cat-card-arrow">→</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="section section-alt">
      <div class="section-inner">
        <div class="section-label">{{ t(lang, 'process_label') }}</div>
        <h2>{{ t(lang, 'how_it_works') }}</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-num">01</div>
            <div class="step-icon">👤</div>
            <h3>{{ t(lang, 'step1_title') }}</h3>
            <p>{{ t(lang, 'step1_desc') }}</p>
          </div>
          <div class="step-card">
            <div class="step-num">02</div>
            <div class="step-icon">📋</div>
            <h3>{{ t(lang, 'step2_title') }}</h3>
            <p>{{ t(lang, 'step2_desc') }}</p>
          </div>
          <div class="step-card">
            <div class="step-num">03</div>
            <div class="step-icon">🔔</div>
            <h3>{{ t(lang, 'step3_title') }}</h3>
            <p>{{ t(lang, 'step3_desc') }}</p>
          </div>
          <div class="step-card">
            <div class="step-num">04</div>
            <div class="step-icon">🚀</div>
            <h3>{{ t(lang, 'step4_title') }}</h3>
            <p>{{ t(lang, 'step4_desc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="section-inner">
        <div class="cta-box">
          <div>
            <h2>{{ t(lang, 'ready_title') }}</h2>
            <p>{{ t(lang, 'ready_desc') }}</p>
          </div>
          <div class="cta-actions">
            <RouterLink to="/register" class="btn btn-primary btn-lg">{{ t(lang, 'create_account') }}</RouterLink>
            <RouterLink to="/jobs"     class="btn btn-ghost btn-lg">{{ t(lang, 'browse_jobs_btn') }} →</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- FOLLOW US -->
    <section class="section" style="text-align:center">
      <div style="max-width:672px;margin:0 auto">
        <div class="section-label">{{ t(lang, 'community') }}</div>
        <h2 style="margin-bottom:12px">{{ t(lang, 'follow_title') }}</h2>
        <p style="font-size:14px;color:#6b7280;margin-bottom:32px">{{ t(lang, 'follow_desc') }}</p>
        <div class="social-grid">
          <a href="https://www.instagram.com/joblink2026/" target="_blank" class="social-btn social-btn-ig">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            <div class="social-btn-text"><strong>@joblink2026</strong><small>Instagram</small></div>
          </a>
          <a href="https://www.tiktok.com/@joblink2026" target="_blank" class="social-btn social-btn-tt">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/></svg>
            <div class="social-btn-text"><strong>@joblink2026</strong><small>TikTok</small></div>
          </a>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <img src="/logo.png" alt="TalentHub" />
            <p>Africa's professional job platform connecting talent with opportunity.</p>
            <div class="footer-socials">
              <a href="https://www.instagram.com/joblink2026/" target="_blank" class="footer-social-btn">Instagram</a>
              <a href="https://www.tiktok.com/@joblink2026" target="_blank" class="footer-social-btn">TikTok</a>
            </div>
          </div>
          <div class="footer-links">
            <div class="footer-col">
              <div class="footer-col-title">Job Seekers</div>
              <RouterLink to="/jobs">Browse Jobs</RouterLink>
              <RouterLink to="/register">Create Profile</RouterLink>
              <RouterLink to="/dashboard">My Applications</RouterLink>
            </div>
            <div class="footer-col">
              <div class="footer-col-title">Employers</div>
              <RouterLink to="/post">Post a Job</RouterLink>
              <RouterLink to="/workers">Find Workers</RouterLink>
              <RouterLink to="/dashboard">Dashboard</RouterLink>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© {{ new Date().getFullYear() }} TalentHub. All rights reserved.</span>
          <span>Made with ❤️ in Africa</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { supabase } from '@/supabase'
import { t, getLang } from '@/utils/i18n'

const jobCount = ref(0)
const lang     = ref(getLang())

function onLangChanged(e) { lang.value = e.detail }

onMounted(async () => {
  const { data } = await supabase.from('jobs').select('id').eq('status','approved')
  jobCount.value = data?.length || 0
  window.addEventListener('lang-changed', onLangChanged)
})
onUnmounted(() => window.removeEventListener('lang-changed', onLangChanged))

const categories = [
  { slug:'tech',       icon:'💻', name:'Web & Tech',  desc:'Software, apps, networks' },
  { slug:'design',     icon:'🎨', name:'Design',       desc:'UI/UX, graphics, branding' },
  { slug:'marketing',  icon:'📣', name:'Marketing',    desc:'Digital, social, SEO' },
  { slug:'writing',    icon:'✍️', name:'Writing',      desc:'Content, copy, translation' },
  { slug:'management', icon:'📋', name:'Management',   desc:'Operations, HR, finance' },
  { slug:'other',      icon:'💼', name:'Other',        desc:'More opportunities' },
]
</script>
