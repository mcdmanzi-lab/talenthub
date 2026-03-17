<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive :include="['Dashboard', 'Messages']">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
  <ToastNotification />
</template>

<script setup>
import { RouterView } from 'vue-router'
import ToastNotification from '@/components/ToastNotification.vue'
</script>
