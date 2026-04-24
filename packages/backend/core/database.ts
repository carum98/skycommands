import { DatabaseSync } from 'node:sqlite'
import { logError } from '@core/logger'

const db = new DatabaseSync('./database.db')

const migrations = [
	{
		version: 1,
		name: 'create_devices',
		sql: `
			CREATE TABLE IF NOT EXISTS devices (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				code TEXT UNIQUE,
				udid TEXT,
				fcm_token TEXT,
				metadata TEXT,
				created_at TEXT DEFAULT (datetime('now')),
				last_seen_at TEXT DEFAULT (datetime('now'))
			);
		`
	}
]

function runMigrations() {
	db.exec(`CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)`);

	const applied = new Set(db.prepare('SELECT name FROM migrations').all().map(row => row.name))

	for (const migration of migrations) {
		const name = `migration_${migration.name}`

		if (!applied.has(name)) {
			db.exec(migration.sql)
			db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name)
		}
	}
}

export function getDB() {
	try {
		runMigrations()
		return db
	} catch (error) {
		logError('database.init', error)
		throw error
	}
}
