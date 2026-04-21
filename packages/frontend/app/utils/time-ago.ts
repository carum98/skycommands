export function timeAgo(dateString: string) {
	const utcString = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(dateString)
		? dateString
		: dateString.replace(' ', 'T') + 'Z'
	const date = new Date(utcString)
	const now = new Date()
	const diff = now.getTime() - date.getTime()

	const seconds = Math.floor(diff / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)
	const weeks = Math.floor(days / 7)
	const months = Math.floor(days / 30)
	const years = Math.floor(days / 365)

	const plural = (n: number, unit: string) => `${n} ${unit}${n !== 1 ? 's' : ''} ago`

	if (seconds < 30) return 'just now'
	if (minutes < 1) return plural(seconds, 'second')
	if (hours < 1) return plural(minutes, 'minute')
	if (days < 1) return plural(hours, 'hour')
	if (weeks < 1) return plural(days, 'day')
	if (months < 1) return plural(weeks, 'week')
	if (years < 1) return plural(months, 'month')
	return plural(years, 'year')
}