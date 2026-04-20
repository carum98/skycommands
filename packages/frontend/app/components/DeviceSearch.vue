<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useDebounce } from '../composables/useDebounce'
import { timeAgo } from '../utils/time-ago'

const targets = [
	{ name: 'Username', value: 'user_name' },
	{ name: 'User ID', value: 'user_id' },
	{ name: 'UID', value: 'uid' },
]

const search = ref('')
const debounced = useDebounce(search, 1000)

const target = ref(targets[0].value)

const loading = ref(false)
const searchResults = ref([])

const popover = useTemplateRef('popover')

const device = defineModel('device', { type: Object, default: null })

watch(debounced, async (newValue) => {
	if (!newValue) {
		searchResults.value = []
		return
	}

	try {
		loading.value = true
		const response = await fetch(`http://localhost:3000/devices?${target.value}=${encodeURIComponent(newValue)}`)
		const data = await response.json()
		searchResults.value = data
	} catch (error) {
		console.error('Search error:', error)
	} finally {
		loading.value = false
	}
})

watch(searchResults, (newResults) => {
	if (newResults.length > 0) {
		popover.value?.showPopover()
	} else {
		popover.value?.hidePopover()
	}
})

function onSelectDevice(item: any) {
	device.value = item
	popover.value?.hidePopover()
	search.value = ''
}
</script>

<template>
	<div class="search-wrapper" id="search-anchor">
		<input type="text" v-model="search" :placeholder="`Target Device (${targets.map(t => t.name).join(', ')})`" class="search-input" />

		<select v-model="target" class="search-select">
			<option v-for="t in targets" :key="t.name" :value="t.value">
				{{ t.name }}
			</option>
		</select>
	</div>

	<div class="search-results" popover="manual" ref="popover" anchor="search-anchor">
		<div v-if="loading" class="loading">Searching...</div>
		<div v-else-if="searchResults.length === 0" class="no-results">No results found</div>
		<ul v-else>
			<li v-for="item in searchResults" :key="item['code']" @click="onSelectDevice(item)">
				<p>code: <span>{{ item['code'] }}</span></p>
				<p>udid: <span>{{ item['udid'] }}</span></p>
				<p>last seen: <span>{{ item['last_seen_at'] }} ({{ timeAgo(item['last_seen_at']) }})</span></p>

				<div>
					<p v-for="(value, key) in JSON.parse(item['metadata'])" :key="key">{{ key }}: <span>{{ value }}</span></p>
				</div>
			</li>
		</ul>
	</div>
</template>
