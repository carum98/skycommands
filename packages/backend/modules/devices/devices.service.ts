import type { DatabaseSync } from 'node:sqlite'

export class DevicesService {
	constructor(private db: DatabaseSync) { }

	find(codeOrUdid: string) {
		return this.db.prepare('SELECT * FROM devices WHERE code = ? OR udid = ?').get(codeOrUdid, codeOrUdid)
	}

	create(data: { code: string; fcmToken: string; udid: string }) {
		return this.db.prepare('INSERT INTO devices (code, fcm_token, udid) VALUES (?, ?, ?)').run(data.code, data.fcmToken, data.udid)
	}

	delete(id: number) {
		return this.db.prepare('DELETE FROM devices WHERE id = ?').run(id)
	}

	heartbeat(id: number) {
		return this.db.prepare('UPDATE devices SET last_seen_at = datetime(\'now\') WHERE id = ?').run(id)
	}

	updateMetadata(id: number, metadata: Record<string, unknown>) {
		return this.db.prepare('UPDATE devices SET metadata = ? WHERE id = ?').run(JSON.stringify(metadata), id)
	}

	getAll(filter?: Record<string, string>) {
		const baseQuery = 'SELECT code, udid, metadata, created_at, last_seen_at FROM devices'

		const entries = Object.entries(filter ?? {}).filter(([, v]) => v !== undefined && v !== null)
		if (entries.length === 0) return this.db.prepare(baseQuery).all()

		const conditions = entries.map(([key]) => `json_extract(metadata, '$.${key}') = ?`)
		const values = entries.map(([, v]) => v)

		return this.db.prepare(`${baseQuery} WHERE ${conditions.join(' AND ')}`).all(...values)
	}
}