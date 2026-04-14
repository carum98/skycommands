<script setup lang="ts">
import { ref } from 'vue'
const devices = ref([])

fetch('http://localhost:3000/devices')
	.then(response => response.json())
	.then(data => {
		devices.value = data
	})
	.catch(error => {
		console.error('Error:', error)
	})
</script>

<template>
	<div class="devices_list">
		<ul>
			<li v-for="device in devices" :key="device.code" @click="$emit('select', device)">
				<p>{{ device.code }}</p>
				<p>{{ device.udid }}</p>
			</li>
		</ul>
	</div>
</template>