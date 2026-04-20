import { onUnmounted, Ref, ref, watch, WatchSource } from 'vue'

function getSourceValue<T>(source: WatchSource<T>): T {
	if (typeof source === 'function') {
		return source()
	}

	return source.value
}

export function useDebounce<T>(source: WatchSource<T>, delay: number): Ref<T> {
	const debouncedValue = ref(getSourceValue(source)) as Ref<T>
	let timeout: ReturnType<typeof setTimeout> | null = null

	watch(
		source,
		(newValue) => {
			if (timeout) {
				clearTimeout(timeout)
			}
			timeout = setTimeout(() => {
				debouncedValue.value = newValue
			}, delay)
		},
		{ immediate: true }
	)

	onUnmounted(() => {
		if (timeout) {
			clearTimeout(timeout)
		}
	})

	return debouncedValue
}