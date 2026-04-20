<script setup lang="ts">
import { ref, computed } from 'vue'
import commands from '../commands.json'
import DeviceSearch from './components/DeviceSearch.vue'
import CommandResult from './components/CommandResult.vue'

const command = ref('')
const device = ref<{ code: string } | null>(null)
const result = ref<string | null>(null)

const parameters = computed(() => commands.find(cmd => cmd.command === command.value)?.parameters)

function onSubmit(event: SubmitEvent) {
	const button = event.submitter as HTMLButtonElement
	if (!button) return

	const form = event.target as HTMLFormElement
	const formData = new FormData(form)
	const json = Object.fromEntries(formData.entries())

	const { command, ...payload } = json

	button.disabled = true

	fetch('http://localhost:3000/commands/execute', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			deviceCode: device.value?.code,
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
</script>

<template>
	<main class="layout">
		<h1>SkyCommands</h1>

		<DeviceSearch v-model:device="device" />

		<form class="panel" @submit.prevent="onSubmit">
			<div class="commands">
				<label v-for="item in commands" :key="item.name">
					<input type="radio" :value="item.command" name="command" v-model="command" />
					<p>{{ item.name }}</p>
					<small>{{ item.description }}</small>
				</label>
			</div>

			<div class="payload">
				<label v-for="param in parameters" :key="param.name">
					{{ param.name }}
					<textarea :placeholder="param.description" :name="param.name" rows="3"></textarea>
				</label>
			</div>

			<div class="actions">
				<div v-if="device">
					<p><strong>Selected Device:</strong> {{ device['code'] }}</p>

					<button class="ping-button" type="button">
						<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="m11.86 2l-.52 1.93c4.41.85 7.86 4.3 8.71 8.72l1.95-.52C20.95 7.03 16.96 3.04 11.86 2m-1.04 3.86l-.52 1.95c3.04.46 5.42 2.84 5.88 5.87l1.94-.52c-.66-3.72-3.57-6.66-7.3-7.3m-7.1 3.83A7.96 7.96 0 0 0 5 18.28V22h3v-1.59c.95.39 1.97.59 3 .59c1.14 0 2.27-.25 3.3-.72zm6.07.07l-.53 1.96a3 3 0 0 1 3 3l1.97-.52c-.23-2.34-2.1-4.2-4.44-4.44"/></svg>
						Ping
					</button>
				</div>

				<button type="submit">
					Execute Command
				</button>
			</div>
		</form>

		<CommandResult v-if="result" :result="result" />
	</main>
</template>