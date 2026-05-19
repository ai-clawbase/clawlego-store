import { createRouter, createWebHistory } from 'vue-router'

const StoreView = () => import('./views/StoreView.vue')
const ItemView = () => import('./views/ItemView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'store', component: StoreView },
    { path: '/item/:kind/:id', name: 'item', component: ItemView },
    { path: '/:catchAll(.*)', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
