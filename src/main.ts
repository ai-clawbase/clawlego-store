import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { installEmbedBridge } from './embed'
import './styles.css'

installEmbedBridge()

createApp(App).use(router).mount('#app')
