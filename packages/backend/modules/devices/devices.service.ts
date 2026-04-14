import type { DatabaseSync } from 'node:sqlite'

export class DevicesService {
	constructor(private db: DatabaseSync) { }

	find(codeOrUdid: string) {
		return this.db.prepare('SELECT * FROM devices WHERE code = ? OR udid = ?').get(codeOrUdid, codeOrUdid)
	}

	create(data: { code: string; fcmToken: string; udid: string }) {
		return this.db.prepare('INSERT INTO devices (code, fcm_token, udid) VALUES (?, ?, ?)').run(data.code, data.fcmToken, data.udid)
	}

	getAll() {
		return this.db.prepare('SELECT code, udid FROM devices').all()
	}
}