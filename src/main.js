import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { auth } from './stores/auth'
import './style.css'

auth.init().then(() => {
  createApp(App).use(router).mount('#app')
})
