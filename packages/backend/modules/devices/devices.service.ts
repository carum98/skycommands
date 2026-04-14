import type { DatabaseSync } from 'node:sqlite'

export class DevicesService {
	constructor(private db: DatabaseSync) { }

	findByUdid(udid: string) {
		return this.db.prepare('SELECT * FROM devices WHERE udid = ?').get(udid)
	}

	findByCode(code: string) {
		return this.db.prepare('SELECT * FROM devices WHERE code = ?').get(code)
	}

	create(data: { code: string; fcmToken: string; udid: string }) {
		return this.db.prepare('INSERT INTO devices (code, fcm_token, udid) VALUES (?, ?, ?)').run(data.code, data.fcmToken, data.udid)
	}

	getAll() {
		return this.db.prepare('SELECT * FROM devices').all()
	}
}