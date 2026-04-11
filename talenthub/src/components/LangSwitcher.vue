<template>
  <!-- Floating language bar -->
  <div class="lang-bar" :class="{ rtl: isRTL }">
    <!-- Auto-translate toggle -->
    <button
      class="auto-btn"
      :class="{ active: autoTranslateEnabled }"
      :title="autoTranslateEnabled ? 'Auto-translate ON' : 'Auto-translate OFF'"
      @click="handleToggleAuto"
    >
      <span class="auto-icon">✦</span>
      <span class="auto-label">{{ autoTranslateEnabled ? "Auto ON" : "Auto OFF" }}</span>
      <span v-if="isTranslating" class="spinner" />
    </button>

    <!-- Language selector -->
    <div class="lang-select-wrap" ref="dropdownRef">
      <button class="lang-btn" @click="open = !open">
        <span>{{ currentLangInfo.flag }}</span>
        <span class="lang-code">{{ currentLanguage.toUpperCase() }}</span>
        <span class="chevron" :class="{ flipped: open }">▾</span>
      </button>

      <Transition name="dropdown">
        <div v-if="open" class="lang-dropdown">
          <div class="dropdown-search-wrap">
            <input
              v-model="search"
              placeholder="Search..."
              class="dropdown-search"
              @click.stop
            />
          </div>
          <div class="dropdown-list">
            <button
              v-for="[code, info] in filteredLanguages"
              :key="code"
              class="dropdown-item"
              :class="{ active: currentLanguage === code }"
              @click="pick(code)"
            >
              <span>{{ info.flag }}</span>
              <span class="item-name">{{ info.name }}</span>
              <span v-if="currentLanguage === code" class="item-check">✓</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Translate whole page button -->
    <button
      class="translate-btn"
      :disabled="isTranslating || currentLanguage === 'en'"
      :title="`Translate page to ${currentLangInfo.name}`"
      @click="$emit('translate-page')"
    >
      <span v-if="isTranslating" class="spinner" />
      <span v-else>🌐</span>
      <span class="translate-label">Translate</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTranslationStore, SUPPORTED_LANGUAGES } from "@/stores/translation";

const emit = defineEmits(["translate-page", "language-changed"]);

const store = useTranslationStore();
const { currentLanguage, currentLangInfo, isTranslating, autoTranslateEnabled, isRTL } = store;

const open = ref(false);
const search = ref("");
const dropdownRef = ref(null);

const filteredLanguages = computed(() => {
  const q = search.value.toLowerCase();
  return Object.entries(SUPPORTED_LANGUAGES).filter(
    ([code, info]) => !q || info.name.toLowerCase().includes(q) || code.includes(q)
  );
});

function pick(code) {
  store.setLanguage(code);
  open.value = false;
  search.value = "";
  emit("language-changed", code);
}

function handleToggleAuto() {
  store.toggleAutoTranslate();
  if (store.autoTranslateEnabled && store.currentLanguage !== "en") {
    emit("translate-page");
  }
}

function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<style scoped>
.lang-bar {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 50px;
  padding: 0.3rem 0.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* Auto button */
.auto-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 50px;
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.78rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.auto-btn.active {
  background: #ededff;
  border-color: #6366f1;
  color: #4f46e5;
}

.auto-icon {
  font-size: 0.7rem;
}

/* Language button */
.lang-select-wrap {
  position: relative;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  border-radius: 50px;
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-btn:hover {
  border-color: #6366f1;
  background: #ededff;
}

.lang-code {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.chevron {
  font-size: 0.7rem;
  transition: transform 0.2s;
}

.chevron.flipped {
  transform: rotate(180deg);
}

/* Dropdown */
.lang-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 220px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.13);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-search-wrap {
  padding: 0.6rem;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-search {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  box-sizing: border-box;
}

.dropdown-search:focus {
  border-color: #6366f1;
}

.dropdown-list {
  max-height: 260px;
  overflow-y: auto;
  padding: 0.4rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #333;
  text-align: left;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: #f5f5ff;
}

.dropdown-item.active {
  background: #ededff;
  color: #4f46e5;
  font-weight: 600;
}

.item-name {
  flex: 1;
}

.item-check {
  color: #6366f1;
  font-size: 0.8rem;
}

/* Translate button */
.translate-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 50px;
  border: 1.5px solid #6366f1;
  background: #6366f1;
  font-size: 0.78rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.translate-btn:hover:not(:disabled) {
  background: #4f46e5;
  border-color: #4f46e5;
}

.translate-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.translate-label {
  font-size: 0.78rem;
}

/* Spinner */
.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

.auto-btn .spinner {
  border-color: rgba(99, 102, 241, 0.3);
  border-top-color: #6366f1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.18s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

@media (max-width: 480px) {
  .auto-label,
  .translate-label {
    display: none;
  }
}
</style>
