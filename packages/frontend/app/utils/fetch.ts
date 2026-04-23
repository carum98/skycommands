import { useAuth } from '@composables/useAuth'

export type FetchRequestOptions = RequestInit & { query?: Record<string, string | undefined> }

export async function $fetch<T>(url: string, options?: FetchRequestOptions) {
	const uri = new URL('/api' + url, window.location.origin)

	// Add query parameters to the URL
	if (options?.query) {
		Object.entries(options.query).forEach(([key, value]) => {
			if (value !== undefined) {
				uri.searchParams.append(key, value as any)
			}
		})
	}

	const token = useAuth().getToken()

	const response = await fetch(uri, {
		...options,
		headers: {
			...(options?.method === 'POST' && { 'Content-Type': 'application/json' }),
			...(token && { Authorization: `Basic ${token}` }),
			...options?.headers,
		},
	})

	if (!response.ok) {
		const errorText = await response.json()
		throw new Error(response.statusText, { cause: errorText })
	}

	if (response.status === 204) {
		return null as unknown as T
	}

	if (response.headers.get('Content-Type')?.includes('application/json')) {
		return await response.json() as T
	}

	if (response.headers.get('Content-Type')?.includes('image')) {
		return await response.blob() as unknown as T
	}

	return await response.text() as unknown as T
}