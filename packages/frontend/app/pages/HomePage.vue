<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@composables/useAuth'

import DeviceSearch from '@components/DeviceSearch.vue'
import CommandResult from '@components/CommandResult.vue'
import CommandPanel from '@/components/CommandPanel.vue'

const router = useRouter()
const { logout: doLogout } = useAuth()

const device = ref(null)
const result = ref(null)

function logout() {
	doLogout()
	router.push('/login')
}
</script>

<template>
	<header>
		<h1>
			<img src="/logo.png" alt="SkyCommands Logo" width="40" height="40" />
			SkyCommands
		</h1>
		<button class="logout-button" type="button" @click="logout">
			<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3zm-1-9c0-.55-.45-1-1-1H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h10c.55 0 1-.45 1-1s-.45-1-1-1H5c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h9c.56 0 1-.45 1-1m5 8l-5-4v3h-3v2h3v3z"/></svg>
			Logout
		</button>
	</header>

	<main>
		<DeviceSearch v-model:device="device" />
		<CommandPanel v-model:device="device" v-model:result="result" />
		<CommandResult v-if="result" :result="result" />
	</main>
</template>
