<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { $fetch } from '@utils/fetch'
import { useTimer } from '@composables/useTimer'
import DeviceItem from '@components/DeviceItem.vue'

const commands = ref<any[]>([])
const command = ref('')

const device = defineModel('device', { type: Object, default: null })
const result = defineModel('result', { type: Object, default: null })

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
	<form class="commands-panel" @submit.prevent="onSubmit">
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

		<div v-if="device" class="actions">
			<div>
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
				<button type="submit" :disabled="running">
					<svg v-if="running" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z" opacity=".5"/><path fill="currentColor" d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"><animateTransform attributeName="transform" dur="1s" from="0 12 12" repeatCount="indefinite" to="360 12 12" type="rotate"/></path></svg>
					<svg v-else width="18" height="18" viewBox="0 0 16 16"><path fill="currentColor" d="m9.11.427l6.14 4.98c.993.805.993 2.37 0 3.18l-3.76 3.05q.005-.069.005-.139c0-.349-.09-.677-.246-.962l3.35-2.74a1.035 1.035 0 0 0 0-1.59l-6.08-4.98c-.633-.514-1.52-.043-1.52.794v2.55a2 2 0 0 0-1 0V2.02c0-1.67 1.85-2.62 3.11-1.59z"/><path fill="currentColor" fill-rule="evenodd" d="m5.66 7.06l.394-.788a.5.5 0 1 1 .895.447l-.343.685a3.36 3.36 0 0 1 1.411 1.48l1.21-.804a.5.5 0 1 1 .554.832l-1.46.972l.012.094l.113 1.02h1.06a.5.5 0 0 1 0 1h-.944l.003.024q.046.421-.003.824a3.5 3.5 0 0 1-.469 1.386l1.64.818a.5.5 0 0 1-.447.895l-1.83-.914c-.637.598-1.5.967-2.45.967s-1.81-.37-2.45-.967l-1.83.914a.5.5 0 1 1-.447-.895l1.64-.818a3.56 3.56 0 0 1-.472-2.21l.003-.025H.506l-.06-.003a.5.5 0 0 1 .06-.996h1.06l.114-1.02l.011-.094l-1.46-.972a.5.5 0 1 1 .554-.832l1.21.804q.203-.414.503-.755c.258-.292.565-.538.908-.725l-.342-.685a.5.5 0 0 1 .894-.447l.394.788a3.4 3.4 0 0 1 1.318 0zm-1.12.981l-.349.07l-.313.17a2.36 2.36 0 0 0-.991 1.04l-.161.333l-.051.369l-.009.066l-.227 2.04a2.55 2.55 0 0 0 .34 1.59l.188.32l.273.257a2.573 2.573 0 0 0 3.52 0l.273-.256l.19-.321c.271-.461.403-1.01.338-1.59l-.227-2.04l-.008-.066l-.051-.37l-.161-.331a2.37 2.37 0 0 0-.991-1.04L5.81 8.11l-.35-.07a2.4 2.4 0 0 0-.925 0z" clip-rule="evenodd"/></svg>

					Execute Command
				</button>
			</div>
		</div>
	</form>
</template>

<style>
.commands-panel {
	background-color: var(--sk-surface);
	padding: 20px;
	border-radius: 20px;
	width: 100%;

	display: flex;
	flex-direction: column;
	gap: 20px;

	.commands {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 15px;

		label {
			background-color: var(--sk-background);
			padding: 10px 15px;
			cursor: pointer;
			border-radius: 15px;
			min-width: 0;

			input[type="radio"] {
				display: none;
			}

			&:has(input[type="radio"]:checked) {
				background-color: var(--sk-primary);

				small {
					color: #fff;
				}
			}

			p {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			small {
				display: block;
				margin-top: 5px;
				color: #bbbbbb;
			}
		}
	}

	.payload {
		background-color: var(--sk-background-input);
		border-radius: 10px;
		padding: 15px;

		&:empty {
			display: none;
		}

		.payload-param {
			display: block;

			&:not(:last-child) {
				margin-bottom: 10px;
			}

			>* {
				margin-top: 5px;
			}

			textarea {
				background-color: var(--sk-background);
				border: none;
				padding: 10px 15px;
				width: 100%;
				font-size: 15px;
			}

			input {
				background-color: var(--sk-background);
				border: none;
				padding: 8px 15px;
				font-size: 15px;
				width: 100%;
			}

			select {
				background-color: var(--sk-background);
				border: none;
				padding: 8px 15px;
				font-size: 15px;
				width: 100%;
				appearance: none;
			}

			small {
				display: block;
				margin-top: 5px;
				color: #bbbbbb;
			}
		}
	}

	.payload-config {
		display: flex;
		gap: 15px;

		input {
			display: block;
			background-color: var(--sk-background);
			border: none;
			padding: 8px 15px;
			font-size: 15px;
		}
	}

	.actions {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}

	.device-info {
		color: var(--sk-text);
		text-decoration: none;
	}

	.device-info--popover {
		position-area: bottom;
		background-color: var(--sk-background-input);
		padding: 15px;
	}

	.ping-button {
		background-color: var(--sk-primary);
		padding: 5px 12px;
		border-radius: 10px;
		color: var(--sk-text);
		width: fit-content;
		margin-top: 10px;

		display: flex;
		align-items: center;
		gap: 8px;
	}

	.execute-wrapper {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-left: auto;
	}

	.exec-timer {
		font-size: 18px;
		color: var(--sk-text);
		opacity: 0.6;
		font-variant-numeric: tabular-nums;

		&.running {
			opacity: 1;
			color: var(--sk-primary);
		}
	}

	button[type="submit"] {
		background-color: color-mix(in oklab, var(--sk-primary) 80%, var(--sk-surface) 20%);
		padding: 7px 18px;
		border-radius: 10px;
		color: var(--sk-text);
		font-size: 15px;
		width: fit-content;

		display: flex;
		align-items: center;
		gap: 8px;

		&:disabled {
			background-color: #0160BE80;
			cursor: progress;
		}
	}
}
</style>