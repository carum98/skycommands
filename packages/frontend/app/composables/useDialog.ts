import { createApp, ref } from 'vue'

type DialogOptions = {
	props?: Record<string, any>
	eventHandlers?: Record<string, (event: Event) => void>
}

export function useDialog(component: any, options: DialogOptions = {}) {
	const dialog = ref<HTMLDialogElement | null>(null)

	const open = async () => {
		if (dialog.value) return

		dialog.value = await createDialog(component, options.props, options.eventHandlers)
	}

	const close = () => {
		if (!dialog.value) return

		dialog.value.close()
		dialog.value = null
	}

	return { open, close }
}

async function createDialog(component: any, props: Record<string, any> = {}, eventHandlers?: Record<string, (event: Event) => void>) {
	const dialog = document.createElement('dialog')
	const content = document.createElement('div')

	content.classList.add('dialog-content')
	dialog.appendChild(content)
	document.body.appendChild(dialog)

	const resolvedComponent = await component()
	
	// Convert event handlers to Vue's onEvent format
	const vueProps = { ...props }
	if (eventHandlers) {
		Object.entries(eventHandlers).forEach(([eventName, handler]) => {
			const propName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`
			vueProps[propName] = handler
		})
	}
	
	const app = createApp(resolvedComponent.default, vueProps)
	app.mount(content)

	dialog.showModal()

	dialog.addEventListener('close', () => {
		app.unmount()
		dialog.remove()
	})

	return dialog as HTMLDialogElement
}