<script setup lang="ts">
import { timeAgo } from '@utils/time-ago'

defineProps<{
	device: { [key: string]: any }
}>()
</script>

<template>
	<div class="device-item">
		<p>code: <span>{{ device['code'] }}</span></p>
		<p>udid: <span>{{ device['udid'] }}</span></p>
		<p>last seen: <span>{{ device['last_seen_at'] }} ({{ timeAgo(device['last_seen_at']) }})</span></p>

		<div>
			<p v-for="(value, key) in JSON.parse(device['metadata'])" :key="key">{{ key }}: <span>{{ value }}</span></p>
		</div>
	</div>
</template>

<style>
.device-item {
	p {
		&:not(:last-child) {
			margin-bottom: 2px;
		}

		span {
			color: #bbbbbb;
		}
	}

	> div {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		margin-top: 20px;
	}
}
</style>