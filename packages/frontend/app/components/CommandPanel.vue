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

		&:disabled {
			background-color: #0160BE80;
			cursor: progress;
		}
	}
}
</style>