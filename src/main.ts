import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { installEmbedBridge } from './embed'
import { initInstallBridge } from './install'
import './styles.css'

installEmbedBridge()
initInstallBridge()

createApp(App).use(router).mount('#app')
