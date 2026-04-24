<script setup lang="ts">
import { computed } from 'vue'
import { syntaxHighlight } from '../utils/syntax-highlight'

const props = defineProps<{
	result: object | string
}>()

const jsonHighlighted = computed(() => {
	if (!props.result) return null
	return syntaxHighlight(props.result)
})

function onFullscreen() {
	const element = document.querySelector('.command_result') as HTMLElement
	if (!element) return

	// Toggle fullscreen
	if (!document.fullscreenElement) {
		element.requestFullscreen()
	} else {
		document.exitFullscreen()
	}
}
</script>

<template>
	<div class="command_result">
		<pre><code v-html="jsonHighlighted"></code></pre>

		<button class="fullscreen-btn" @click="onFullscreen">
			<svg width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9V6a2 2 0 0 1 2-2h3m11 11v3a2 2 0 0 1-2 2h-3m0-16h3a2 2 0 0 1 2 2v3M9 20H6a2 2 0 0 1-2-2v-3"/></svg>
		</button>
	</div>
</template>

<style>
.command_result {
	background-color: var(--sk-surface);
	border-radius: 15px;
	width: 100%;
	max-height: 600px;
	position: relative;
	overflow: scroll;

	pre {
		overflow: scroll;
		white-space: pre;
		height: 100%;
		padding: 20px;
	}

	code {
		font-family: Consolas, monospace;

		.string,
		.boolean,
		.null {
			color: #c88d75;
		}

		.number {
			color: #a5bb99;
		}

		.key {
			color: #6c94aa;
		}
	}

	.fullscreen-btn {
		background-color: transparent;
		position: absolute;
		top: 10px;
		right: 10px;
		color: var(--sk-text);
		border: none;
		padding: 5px 10px;
		border-radius: 10px;
	}
}
</style>