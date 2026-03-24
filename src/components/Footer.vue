<template>
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
            <RouterLink to="/cv-builder">CV Builder</RouterLink>
            <RouterLink to="/dashboard">My Applications</RouterLink>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Employers</div>
            <RouterLink to="/post">Post a Job</RouterLink>
            <RouterLink to="/workers">Find Workers</RouterLink>
            <RouterLink to="/dashboard">Dashboard</RouterLink>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Resources</div>
            <RouterLink to="/blog">Blog & Tips</RouterLink>
            <RouterLink to="/register">Join Now</RouterLink>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} TalentHub. All rights reserved.</span>
        <span>Made with ❤️ in Africa</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
