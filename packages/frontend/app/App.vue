<script setup lang="ts">
const message = 'Hello, World!';

fetch('http://localhost:3000/devices/123/commands', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify({ command: 'your-command' })
})
	.then(response => response.json())
	.then(data => console.log(data))
</script>

<template>
	<div>
		<p>{{ message }}</p>
	</div>
</template>