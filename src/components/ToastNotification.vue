<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      <TransitionGroup name="toast">
        <div v-for="t in toast.toasts" :key="t.id"
          class="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl min-w-[240px] max-w-sm"
          :class="{
            'bg-green-950 border-green-800 text-green-300': t.type==='success',
            'bg-red-950 border-red-800 text-red-300':     t.type==='error',
            'bg-[#111118] border-white/10 text-gray-300': t.type==='info',
          }">
          <span>{{ t.type==='success' ? '✅' : t.type==='error' ? '❌' : 'ℹ️' }}</span>
          <span class="flex-1">{{ t.message }}</span>
          <button @click="toast.remove(t.id)" class="text-current opacity-50 hover:opacity-100 bg-transparent border-0 cursor-pointer">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
<script setup>
import { toast } from '@/stores/toast'
</script>
<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(24px); }
.toast-leave-to   { opacity: 0; transform: translateX(24px); }
</style>
