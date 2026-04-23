<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@composables/useAuth'

const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
	error.value = ''
	loading.value = true

	try {
		await login(username.value, password.value)
	} catch {
		error.value = 'Invalid username or password'
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="login-wrapper">
		<form class="login-card" @submit.prevent="onSubmit">
			<div class="login-header">
				<img src="/favicon.ico" alt="SkyCommands Logo" width="35" height="35" />
				<h1>SkyCommands</h1>
			</div>

			<label class="login-field">
				Username
				<input type="text" v-model="username" autocomplete="username" required />
			</label>

			<label class="login-field">
				Password
				<input type="password" v-model="password" autocomplete="current-password" required />
			</label>

			<p v-if="error" class="login-error">{{ error }}</p>

			<button type="submit" :disabled="loading">
				{{ loading ? 'Signing in…' : 'Sign in' }}
			</button>
		</form>
	</div>
</template>

<style scoped>
.login-wrapper {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
}

.login-card {
	background-color: var(--sk-surface);
	border-radius: 20px;
	padding: 40px;
	width: 360px;
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.login-header {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 8px;

	h1 {
		font-size: 22px;
		font-weight: 600;
	}

	img {
		box-shadow: 0 0 .75rem rgba(0, 73, 163, .5);
	}
}

.login-field {
	display: flex;
	flex-direction: column;
	gap: 8px;
	font-size: 15px;

	input {
		width: 100%;
	}
}

.login-error {
	color: #f87171;
	font-size: 14px;
}

button[type="submit"] {
	background-color: var(--sk-primary);
	color: var(--sk-text);
	padding: 10px;
	border-radius: 10px;
	font-size: 15px;
	margin-top: 4px;

	&:disabled {
		opacity: 0.6;
		cursor: progress;
	}
}
</style>
