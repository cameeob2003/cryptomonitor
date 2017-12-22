import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: require('@/components/DashboardPage').default
    },
    {
      path: '*',
      redirect: '/dashboard'
    }
  ]
})
