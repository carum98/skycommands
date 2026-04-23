import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@pages/HomePage.vue'
import LoginPage from '@pages/LoginPage.vue'
import { useAuth } from '@composables/useAuth'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomePage,
			meta: { requiresAuth: true },
		},
		{
			path: '/login',
			name: 'login',
			component: LoginPage,
		},
	],
})

router.beforeEach((to) => {
	const { isAuthenticated } = useAuth()

	if (to.meta.requiresAuth && !isAuthenticated.value) {
		return { name: 'login', query: { redirect: to.fullPath } }
	}

	if (to.name === 'login' && isAuthenticated.value) {
		return { name: 'home' }
	}
})

export default router
