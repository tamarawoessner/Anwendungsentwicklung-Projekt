import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import StationAnalysisView from '../views/StationAnalysisView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/analyse', 
      name: 'StationAnalysisView',
      component: StationAnalysisView
    }
  ]
})

export default router