<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useDebounce } from '@composables/useDebounce'
import { timeAgo } from '@utils/time-ago'
import { $fetch } from '@utils/fetch'
import DeviceItem from './DeviceItem.vue'

const targets = [
	{ name: 'Username', value: 'user_name' },
	{ name: 'User ID', value: 'user_id' },
	{ name: 'Company ID', value: 'company_id' },
	{ name: 'Code', value: 'code' },
	{ name: 'UID', value: 'udid' },
	{ name: 'Token', value: 'fcm_token' },
]

const search = ref('')
const debounced = useDebounce(search, 1000)

const target = ref(targets[0].value)

const loading = ref(false)
const searchResults = ref([])

const popover = useTemplateRef('popover')

const device = defineModel('device', { type: Object, default: null })

watch(search, (newValue) => {
	loading.value = !!newValue
})

watch(debounced, async (newValue) => {
	if (!newValue) {
		searchResults.value = []
		return
	}

	try {
		loading.value = true
		searchResults.value = await $fetch<any>(`/devices`, {
			query: {
				[target.value]: newValue
			}
		})
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
		<svg v-if="loading" width="25" height="25" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z" opacity=".5"/><path fill="currentColor" d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"><animateTransform attributeName="transform" dur="1s" from="0 12 12" repeatCount="indefinite" to="360 12 12" type="rotate"/></path></svg>
		<svg v-else width="25" height="25" viewBox="0 0 24 24"><path fill="currentColor" d="M3 19v-1h9.039v1zm2.616-2.384q-.691 0-1.153-.463T4 15V6.616q0-.691.463-1.153T5.616 5h12.769q.517 0 .912.28t.55.72H5.615q-.231 0-.424.192T5 6.616V15q0 .23.192.423t.423.193h6.424v1zm14.576 1.057v-7.577q0-.134-.096-.23q-.096-.097-.23-.097h-3.732q-.134 0-.23.096t-.096.231v7.577q0 .135.096.23q.096.097.23.097h3.731q.135 0 .231-.096t.096-.231M16.02 19q-.504 0-.858-.353q-.353-.354-.353-.858V9.98q0-.505.353-.858q.353-.354.858-.354h3.962q.504 0 .858.353q.353.354.353.859v7.807q0 .505-.353.859q-.353.353-.858.353zm1.978-6.5q.29 0 .483-.2q.193-.202.193-.47q0-.29-.193-.483t-.488-.193q-.273 0-.469.193t-.196.488q0 .273.2.469q.201.196.47.196M18 13.885"/></svg>

		<input type="text" v-model="search" :placeholder="`Search Target Device`" class="search-input" />

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
				<DeviceItem :device="item" />
			</li>
		</ul>
	</div>
</template>

<style scoped>
.search-wrapper {
	position: relative;
	width: 100%;
	anchor-name: --search-wrapper;

	.search-input {
		border: unset;
		width: 100%;
		padding: 13px 20px 13px 55px;
		border-radius: 25px;
		background-color: var(--sk-background-input);
		color: var(--sk-text);
		font-size: 17px;
	}

	.search-select {
		position: absolute;
		right: 10px;
		top: 50%;
		width: 120px;
		transform: translateY(-50%);
		border: unset;
		background-color: var(--sk-surface);
		color: var(--sk-text);
		padding: 8px;
		border-radius: 25px;
		font-size: 15px;
		cursor: pointer;

		appearance: none;
		text-align: center;
		padding-right: 10px;

		&:focus {
			outline: none;
		}
	}

	>svg {
		position: absolute;
		left: 20px;
		top: 50%;
		transform: translateY(-50%);
		color: gray;
	}
}

.search-results {
	position-anchor: --search-wrapper;
	top: anchor(bottom);
	left: anchor(left);
	right: anchor(right);
	margin-top: 5px;

	background-color: var(--sk-background-input);
	padding: 15px;

	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;

		li {
			padding: 10px 15px;
			border-radius: 10px;
			cursor: pointer;
			background-color: var(--sk-background);
		}
	}
}
</style>