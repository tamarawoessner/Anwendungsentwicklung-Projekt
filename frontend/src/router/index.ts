import { createRouter, createWebHistory } from 'vue-router'
import SearchView from '../views/SearchView.vue'
import StationAnalysisView from '../views/StationAnalysisView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'search',
      component: SearchView
    },
    {
      path: '/analyse/:stationId',
      name: 'analyse',
      component: StationAnalysisView,
      props: true
    }
  ]
})

export default router
