import cron from 'node-cron'
import { getDB } from '@core/database'
import { cleanupOldLogs, logError } from '@core/logger'

function startScheduler() {
	// Runs every 10 days for testing
	cron.schedule('0 0 */10 * *', () => {
		try {
			const db = getDB()
			db.exec("DELETE FROM devices WHERE last_seen_at < datetime('now', '-30 days')")
			console.log('DB cleanup done:', new Date().toISOString())
		} catch (error) {
			logError('scheduler.cleanup', error)
		}
	})

	// Runs daily at 00:05 and deletes log files older than 10 days
	cron.schedule('5 0 * * *', async () => {
		try {
			const deleted = await cleanupOldLogs(10)
			console.log(`Logs cleanup done: ${deleted} file(s) removed`, new Date().toISOString())
		} catch (error) {
			logError('scheduler.logs_cleanup', error)
		}
	})
}

try {
	startScheduler()
} catch (error) {
	logError('scheduler.start', error)
}
