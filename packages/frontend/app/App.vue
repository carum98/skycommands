<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DeviceSearch from '@components/DeviceSearch.vue'
import CommandResult from '@components/CommandResult.vue'
import { useTimer } from '@composables/useTimer'
import { $fetch } from '@utils/fetch'
import DeviceItem from '@components/DeviceItem.vue'

const commands = ref<any[]>([])
const command = ref('')
const device = ref<{ code: string } | null>(null)
const result = ref<object | null>(null)

onMounted(async () => {
	const res = await fetch('/commands.json')
	commands.value = await res.json()
	command.value = commands.value[0]?.command ?? ''
})

const { executionTimeFormatted, running, startTimer, stopTimer } = useTimer()

const parameters = computed(() => commands.value.find((cmd: any) => cmd.command === command.value)?.parameters)

async function onSubmit(event: SubmitEvent) {
	const form = event.target as HTMLFormElement
	const formData = new FormData(form)
	const json = Object.fromEntries(formData.entries())

	const { command, timeout, retries, ...payload } = json

	try {
		startTimer()

		result.value = await $fetch('/commands/execute', {
			method: 'POST',
			body: JSON.stringify({
				deviceCode: device.value?.code,
				command,
				timeout: Number(timeout) || undefined,
				retries: Number(retries) || undefined,
				payload
			})
		})
	} catch (error) {
		result.value = (error as Error).cause || 'An unknown error occurred'
	} finally {
		stopTimer()
	}
}

async function sendPing() {
	try {
		startTimer()

		result.value = await $fetch('/commands/ping', {
			method: 'POST',
			body: JSON.stringify({
				code: device.value?.code
			})
		})
	} catch (error) {
		result.value = (error as Error).cause || 'An unknown error occurred'
	} finally {
		stopTimer()
	}
}
</script>

<template>
	<main class="layout">
		<h1 class="title">
			<img src="/favicon.ico" alt="SkyCommands Logo" width="35" height="35" />
			SkyCommands
		</h1>

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
				<label v-for="param in parameters" :key="param.name" class="payload-param">
					{{ param.name }} <span v-if="param.required" style="color: red">*</span>
					<input 
						v-if="param.inputType === 'input'"
						type="text"
						:name="param.name"
						:required="param.required"
					/>
					<textarea 
						v-else-if="param.inputType === 'textarea'" 
						:name="param.name" 
						rows="3"
						:required="param.required"
					></textarea>
					<select 
						v-else-if="param.inputType === 'select'" 
						:name="param.name"
						:required="param.required"
					>
							<option v-for="item in param.options" :key="item" :value="item">{{ item }}</option>
					</select>

					<small>{{ param.description }}</small>
				</label>
			</div>

			<div class="payload-config">
				<label>
					Timeout
					<input type="number" name="timeout" placeholder="10000" />
				</label>

				<label>
					Retries
					<input type="number" name="retries" placeholder="0" />
				</label>
			</div>

			<div class="actions">
				<div v-if="device">
					<a class="device-info" interestfor="target-id" href="#">
						<strong>Selected Device:</strong> {{ device['code'] }}
					</a>
					<div class="device-info--popover" id="target-id" popover>
						<DeviceItem :device="device" />
					</div>

					<button class="ping-button" type="button" @click="sendPing">
						<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="m11.86 2l-.52 1.93c4.41.85 7.86 4.3 8.71 8.72l1.95-.52C20.95 7.03 16.96 3.04 11.86 2m-1.04 3.86l-.52 1.95c3.04.46 5.42 2.84 5.88 5.87l1.94-.52c-.66-3.72-3.57-6.66-7.3-7.3m-7.1 3.83A7.96 7.96 0 0 0 5 18.28V22h3v-1.59c.95.39 1.97.59 3 .59c1.14 0 2.27-.25 3.3-.72zm6.07.07l-.53 1.96a3 3 0 0 1 3 3l1.97-.52c-.23-2.34-2.1-4.2-4.44-4.44"/></svg>
						Ping
					</button>
				</div>

				<div class="execute-wrapper">
					<span class="exec-timer" :class="{ running }">
						{{ executionTimeFormatted }}
					</span>
					<button type="submit" :disabled="!device || running">
						Execute Command
					</button>
				</div>
			</div>
		</form>

		<CommandResult v-if="result" :result="result" />
	</main>
</template>