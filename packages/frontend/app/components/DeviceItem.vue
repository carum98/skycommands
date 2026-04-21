<script setup lang="ts">
import { timeAgo, getDiff } from '@utils/time-ago'

const props =defineProps<{
	device: { [key: string]: any }
}>()

function timeAgoColor(dateString: string) {
	const diff = getDiff(dateString)

	const good = 24 * 60 * 60 * 1000 // 24 hours

	if (diff < good) return 'green' // less than 24 hours
	if (diff < 2 * good) return 'yellow' // less than 48 hours
	return 'red' // more than 48 hours
}
</script>

<template>
	<div class="device-item">
		<p>code: <span>{{ device['code'] }}</span></p>
		<p>udid: <span>{{ device['udid'] }}</span></p>
		<p>last seen: <span>{{ device['last_seen_at'] }} (<span class="last-seen-badge" :style="{ backgroundColor: timeAgoColor(device['last_seen_at']) }"></span> {{ timeAgo(device['last_seen_at']) }})</span></p>

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

	.last-seen-badge {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: inline-block;
	}
}
</style>