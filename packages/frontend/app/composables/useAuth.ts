import { ref, computed } from 'vue'

const STORAGE_KEY = 'skycommands_auth'

const token = ref<string | null>(localStorage.getItem(STORAGE_KEY))

export function useAuth() {
	const isAuthenticated = computed(() => token.value !== null)

	async function login(username: string, password: string) {
		const encoded = btoa(`${username}:${password}`)

		const response = await fetch('/api/devices', {
			headers: { Authorization: `Basic ${encoded}` },
		})

		if (!response.ok) {
			throw new Error('Invalid credentials')
		}

		token.value = encoded
		localStorage.setItem(STORAGE_KEY, encoded)
	}

	function logout() {
		token.value = null
		localStorage.removeItem(STORAGE_KEY)
	}

	function getToken() {
		return token.value
	}

	return { isAuthenticated, login, logout, getToken }
}
