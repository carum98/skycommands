<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@composables/useAuth'

const { login } = useAuth()

const router = useRouter()
const route = useRoute()

async function onSubmit(event: Event) {
	try {
		const formData = new FormData(event.target as HTMLFormElement)

		const username = formData.get('username') as string
		const password = formData.get('password') as string

		await login(username, password)

		const redirect = (route.query.redirect as string) || '/'
		router.push(redirect)
	} catch (error) {
		console.error(error)
	}
}
</script>

<template>
	<main>
		<form class="sk-form-login" @submit.prevent="onSubmit">
			<img src="/logo.png" width="80" height="80" alt="Logo" />

			<label>
				Usuario
			</label>
			<input 
				type="text" 
				name="username"
				placeholder="Usuario" 
			/>

			<label>
				Contraseña
			</label>
			<input 
				type="password"
				name="password"
				placeholder="Contraseña" 
			/>
			
			<button type="submit" class="sk-button block">
				Iniciar sesión
			</button>
		</form>
	</main>
	<footer>
		<p>Plaforna para uso interno de <a href="https://skydatalatam.com" target="_blank">SkyData</a></p>
		<p>Desarrollado por <a href="https://carum.dev" target="_blank">Carlos Umaña</a></p>
	</footer>
</template>

<style>
.sk-form-login {
	width: 300px;

	> input {
		margin-bottom: 15px;
	}

	> img {
		display: block;
		margin: 0 auto;
		filter: var(--drop-shadow);
	}

	> label {
		display: block;
		margin-bottom: 5px;
		margin-left: 5px;
	}

	> button[type="submit"] {
		margin-top: 15px;
		float: right;
		width: 100%;

		background-color: var(--sk-primary);
		color: #fff;
		border-radius: 15px;
		padding: 10px 20px;
		font-size: 1rem;
		cursor: pointer;
		transition: box-shadow .2s ease-in-out;
	}

	input {
		border: 2px solid rgba(177, 177, 177, 0.301);
		width: 100%;
		background-color: var(--sk-surface);
		border-radius: 15px;
		padding: 12px 20px;
		font-size: 1rem;
		box-sizing: border-box;
		outline: none;
		transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

		&:focus {
			border-color: var(--sk-primary);
			box-shadow: var(--shadow);
		}
	}
}
</style>
