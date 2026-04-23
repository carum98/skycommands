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
			meta: { 
				requiresAuth: true,
				layout: 'home',
			},
		},
		{
			path: '/login',
			name: 'login',
			component: LoginPage,
			meta: {
				layout: 'login',
			},
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

// Handle layout changes
router.afterEach((to) => {
	const layout = (to.meta.layout as string) || 'default'
	document.body.setAttribute('data-layout', layout)
})

export default router
