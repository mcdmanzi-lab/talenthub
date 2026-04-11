import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { auth } from './stores/auth'
import './style.css'

const pinia = createPinia()

auth.init().then(() => {
  createApp(App)
    .use(pinia)
    .use(router)
    .mount('#app')
})
