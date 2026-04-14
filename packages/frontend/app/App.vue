<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialog } from './composables/useDialog'
import commands from '../commands.json'

const result = ref(null)

const command = ref('')
const parameters = computed(() => commands.find(cmd => cmd.command === command.value)?.parameters)

function onSubmit(event: Event) {
	const button = event.submitter as HTMLButtonElement
	if (!button) return

	const form = event.target as HTMLFormElement
	const formData = new FormData(form)
	const json = Object.fromEntries(formData.entries())

	const { deviceCode, command, ...payload } = json

	button.disabled = true

	fetch('http://localhost:3000/execute', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			deviceCode,
			command,
			payload
		})
	})
		.then(response => response.json())
		.then(data => {
			result.value = data
		})
		.catch(error => {
			console.error('Error:', error)
		})
		.finally(() => {
			button.disabled = false
		})
}

function selectDevice(event: Event) {
	const input = event.target as HTMLInputElement

	const dialog = useDialog(
		() => import('./DevicesList.vue'),
		{
			eventHandlers: {
				select: (event) => {
					input.value = event.code
					dialog.close()
				}
			}
		}
	)

	dialog.open()
}
</script>

<template>
	<main class="layout">
		<h1>SkyCommands</h1>

		<form class="command_form" @submit.prevent="onSubmit">
			<label>
				Device Code
				<input type="text" placeholder="Code" name="deviceCode" readonly @click="selectDevice" />
			</label>

			<label>Commands</label>
			<div class="commands">
				<label v-for="item in commands" :key="item.name">
					<input type="radio" :value="item.command" name="command" v-model="command" />
					{{ item.name }}
				</label>
			</div>

			<label v-for="param in parameters" :key="param.name">
					{{ param.name }}
				<textarea :placeholder="param.description" :name="param.name" rows="4"></textarea>
			</label>

			<hr>

			<button type="submit">Execute</button>
		</form>

		<div class="command_result" v-if="result">
			<h3>Result</h3>
			<pre>{{ result }}</pre>
		</div>
	</main>
</template>