<template>
  <div class="lang-switcher" ref="wrapper">
    <button class="lang-btn" @click="open = !open" :title="current.name">
      {{ current.flag }} <span class="lang-code">{{ current.code.toUpperCase() }}</span>
    </button>
    <div v-if="open" class="lang-dropdown">
      <button
        v-for="lang in languages" :key="lang.code"
        class="lang-option" :class="{ active: lang.code === modelValue }"
        @click="select(lang.code)">
        {{ lang.flag }} {{ lang.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LANGUAGES } from '@/utils/i18n'

const props = defineProps({ modelValue: { type: String, default: 'en' } })
const emit  = defineEmits(['update:modelValue'])

const open      = ref(false)
const wrapper   = ref(null)
const languages = LANGUAGES

const current = computed(() => languages.find(l => l.code === props.modelValue) || languages[0])

function select(code) {
  emit('update:modelValue', code)
  open.value = false
}

function handleClick(e) {
  if (wrapper.value && !wrapper.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('click', handleClick))
onUnmounted(() => document.removeEventListener('click', handleClick))
</script>

<style scoped>
.lang-switcher { position: relative; }
.lang-btn {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px; padding: 6px 10px;
  cursor: pointer; font-size: 13px; color: #a0a0b0;
  transition: all 0.15s;
}
.lang-btn:hover { background: rgba(255,255,255,0.1); color: #f0f0f5; }
.lang-code { font-weight: 600; font-size: 11px; }
.lang-dropdown {
  position: absolute; right: 0; top: calc(100% + 8px);
  background: #111118; border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px; padding: 6px;
  min-width: 180px; z-index: 100;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.lang-option {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 8px 12px;
  border: none; background: none; border-radius: 8px;
  font-size: 13px; color: #a0a0b0; cursor: pointer;
  transition: all 0.1s; text-align: left;
}
.lang-option:hover  { background: rgba(255,255,255,0.05); color: #f0f0f5; }
.lang-option.active { background: rgba(37,99,235,0.1); color: #60a5fa; }
</style>
