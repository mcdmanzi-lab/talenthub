<template>
  <div class="welcome-page">
    <div class="welcome-card">
      <div class="welcome-icon">🎉</div>
      <h1>Congratulations!</h1>
      <p>Your account has been created successfully. Welcome to TalentHub.</p>
      <div class="welcome-check">
        <div class="check-row">✅ Profile created</div>
        <div class="check-row">✅ Job alerts activated</div>
        <div class="check-row">✉️ Confirmation email sent</div>
      </div>
      <RouterLink to="/subscribe" class="btn btn-primary btn-full btn-lg" style="margin-top:24px">
        Activate Account →
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
}
.welcome-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius-xl);
  padding: 40px 32px;
  text-align: center;
}
.welcome-icon { font-size: 56px; margin-bottom: 16px; }
.welcome-card h1 { font-size: 26px; font-weight: 700; margin-bottom: 8px; }
.welcome-card p  { font-size: 14px; color: var(--text-dim); margin-bottom: 24px; }
.welcome-check {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--surface2);
  border-radius: var(--radius);
  padding: 16px;
  text-align: left;
}
.check-row { font-size: 14px; color: var(--text-dim); }
</style>
