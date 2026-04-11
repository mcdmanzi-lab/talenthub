<template>
  <div id="app" :dir="isRTL ? 'rtl' : 'ltr'" :class="{ rtl: isRTL }">
    <!-- Language picker modal (first visit) -->
    <LanguagePicker :show="showLanguagePicker" />

    <!-- Translation status toast -->
    <Transition name="toast-slide">
      <div v-if="isTranslating" class="translate-toast">
        <span class="toast-spinner" />
        Translating to {{ currentLangInfo.name }}…
      </div>
    </Transition>

    <!-- Main router view -->
    <RouterView />
  </div>
</template>

<script setup>
import { watch } from "vue";
import { storeToRefs } from "pinia";
import { useTranslationStore } from "@/stores/translation";
import LanguagePicker from "@/components/LanguagePicker.vue";

const store = useTranslationStore();
const { showLanguagePicker, currentLanguage, isRTL, isTranslating, currentLangInfo, autoTranslateEnabled } =
  storeToRefs(store);

// Apply direction to <html> on mount and whenever language changes
watch(
  currentLanguage,
  (lang) => {
    const info = store.SUPPORTED_LANGUAGES[lang];
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", info?.dir || "ltr");
  },
  { immediate: true }
);
</script>

<style>
/* Global RTL support */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .navbar,
[dir="rtl"] .footer {
  flex-direction: row-reverse;
}

/* Translation toast */
.translate-toast {
  position: fixed;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1e1e2e;
  color: #fff;
  padding: 0.6rem 1.25rem;
  border-radius: 50px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  z-index: 9998;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}

.toast-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.25s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
