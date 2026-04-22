import cron from 'node-cron'
import { getDB } from '@core/database'

function startScheduler() {
	// Runs every 10 days for testing
	cron.schedule('0 0 */10 * *', () => {
		const db = getDB()
		db.exec("DELETE FROM devices WHERE last_seen_at < datetime('now', '-30 days')")
		console.log('DB cleanup done:', new Date().toISOString())
	})
}

try {
	startScheduler()
} catch (error) {
	console.error('Failed to start scheduler:', error)
}
