import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css' // CORRIGIDO: sem isso, o box-sizing:border-box nunca era aplicado

createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app')
