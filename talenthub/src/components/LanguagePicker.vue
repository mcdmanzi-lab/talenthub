<template>
  <Teleport to="body">
    <Transition name="lang-modal">
      <div v-if="show" class="lang-overlay" @click.self="dismiss">
        <div class="lang-modal" role="dialog" aria-modal="true" aria-label="Choose your language">
          <!-- Header -->
          <div class="lang-header">
            <div class="lang-globe">🌍</div>
            <h2 class="lang-title">Welcome to TalentHub</h2>
            <p class="lang-subtitle">Choose your preferred language to get started</p>
          </div>

          <!-- Search -->
          <div class="lang-search-wrap">
            <span class="lang-search-icon">🔍</span>
            <input
              v-model="search"
              type="text"
              placeholder="Search language..."
              class="lang-search"
              autofocus
            />
          </div>

          <!-- Language grid -->
          <div class="lang-grid">
            <button
              v-for="[code, info] in filteredLanguages"
              :key="code"
              class="lang-option"
              :class="{ selected: selected === code }"
              @click="select(code)"
            >
              <span class="lang-flag">{{ info.flag }}</span>
              <span class="lang-name">{{ info.name }}</span>
              <span v-if="selected === code" class="lang-check">✓</span>
            </button>
          </div>

          <!-- Footer -->
          <div class="lang-footer">
            <button class="lang-dismiss" @click="dismiss">Continue in English</button>
            <button
              class="lang-confirm"
              :disabled="!selected || selected === 'en'"
              @click="confirm"
            >
              Confirm &amp; Translate
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from "vue";
import { useTranslationStore, SUPPORTED_LANGUAGES } from "@/stores/translation";

const props = defineProps({
  show: { type: Boolean, required: true },
});

const store = useTranslationStore();
const search = ref("");
const selected = ref(store.currentLanguage);

const filteredLanguages = computed(() => {
  const q = search.value.toLowerCase();
  return Object.entries(SUPPORTED_LANGUAGES).filter(
    ([code, info]) =>
      !q || info.name.toLowerCase().includes(q) || code.toLowerCase().includes(q)
  );
});

function select(code) {
  selected.value = code;
}

function confirm() {
  if (selected.value) store.setLanguage(selected.value);
}

function dismiss() {
  store.dismissLanguagePicker();
}
</script>

<style scoped>
.lang-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.lang-modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.25);
}

.lang-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
}

.lang-globe {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.lang-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 0.25rem;
}

.lang-subtitle {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.lang-search-wrap {
  position: relative;
  margin: 1rem 1.5rem;
}

.lang-search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
}

.lang-search {
  width: 100%;
  padding: 0.65rem 0.75rem 0.65rem 2.25rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.lang-search:focus {
  border-color: #6366f1;
}

.lang-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 0.5rem;
  padding: 0 1.5rem;
  overflow-y: auto;
  flex: 1;
  max-height: 340px;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.75rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  transition: all 0.15s;
  text-align: left;
  position: relative;
}

.lang-option:hover {
  border-color: #6366f1;
  background: #f0f0ff;
}

.lang-option.selected {
  border-color: #6366f1;
  background: #ededff;
  color: #4f46e5;
  font-weight: 600;
}

.lang-flag {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.lang-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lang-check {
  color: #6366f1;
  font-weight: 700;
  font-size: 0.85rem;
}

.lang-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #f0f0f0;
  justify-content: flex-end;
}

.lang-dismiss {
  padding: 0.65rem 1.25rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #555;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.lang-dismiss:hover {
  border-color: #aaa;
  color: #222;
}

.lang-confirm {
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: #6366f1;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.lang-confirm:hover:not(:disabled) {
  background: #4f46e5;
}

.lang-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Transition */
.lang-modal-enter-active,
.lang-modal-leave-active {
  transition: all 0.25s ease;
}

.lang-modal-enter-from,
.lang-modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

@media (max-width: 480px) {
  .lang-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .lang-footer {
    flex-direction: column;
  }
  .lang-dismiss,
  .lang-confirm {
    width: 100%;
    text-align: center;
  }
}
</style>
