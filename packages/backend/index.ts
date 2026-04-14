import express from 'express'
import admin from 'firebase-admin'
import { getDB } from '@core/database'

import googleServices from './serviceAccountKey.json'

admin.initializeApp({
  credential: admin.credential.cert(googleServices as admin.ServiceAccount)
})

const messaging = admin.messaging()
const db = getDB()

const app = express()

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
	 return res.sendStatus(204)
  }

  next()
})

const pending = new Map()

async function sendCommand(token: string, data: Record<string, string>): Promise<string> {
	const commandId = crypto.randomUUID()

	return new Promise(async (resolve, reject) => {
		const timeout = setTimeout(() => {
			pending.delete(commandId)
			reject(new Error('Timeout'))
		}, 10000)

		pending.set(commandId, { resolve, reject, timeout })

		await sendFCM(token, {
			commandId,
			...data
		})
  })
}

async function sendFCM(token: string, payload: Record<string, string>) {
	try {
		await messaging.send({
			token: token,
			data: payload,
			android: {
				priority: 'high'
			}
		})
	} catch (error) {
		console.error('Error sending FCM:', error)
		throw error
	}
}

app.post('/execute', async (req, res) => {
	const { deviceCode, uuid, command, payload } = req.body

	const device = uuid 
		? db.prepare('SELECT * FROM devices WHERE udid = ?').get(uuid)
		: db.prepare('SELECT * FROM devices WHERE code = ?').get(deviceCode)

	if (!device) {
		return res.status(404).json({ error: 'Device not found' })
	}

	try {
		const data = { 
			command, 
			...(payload && { payload: JSON.stringify(payload) })
		} as Record<string, string>

		const result = await sendCommand(device.fcm_token as string, data)

		res.json({ result: 
			result.startsWith('{') || result.startsWith('[') ? JSON.parse(result) : result
		 })
	} catch (error) {
		res.status(500).json({ error: 'Error executing command' })
	}
})

app.post('/result', (req, res) => {
	const { commandId, result } = req.body

	const pendingCommand = pending.get(commandId)

	if (!pendingCommand) {
		return res.status(404).json({ error: 'Command not found' })
	}

	clearTimeout(pendingCommand.timeout)
	pendingCommand.resolve(result)
	pending.delete(commandId)
	res.json({ success: true })
})

app.post('/register_device', async (req, res) => {
	const { fcmToken, udid } = req.body

	if (!fcmToken || !udid) {
		return res.status(400).json({ error: 'Missing fcmToken or udid' })
	}

	// Check if device already exists in database
	const existing = db.prepare('SELECT * FROM devices WHERE udid = ?').get(udid)
	if (existing) {
		return res.status(400).json({ error: 'Device already registered' })
	}

	const code = crypto.randomUUID().split('-').at(0)!
	
	// Insert into database
	db.prepare('INSERT INTO devices (code, fcm_token, udid) VALUES (?, ?, ?)').run(code, fcmToken, udid)
	res.json({ code, fcmToken, udid })
})

app.get('/devices', (req, res) => {
	const devices = db.prepare('SELECT * FROM devices').all()

	res.json(devices)
})

app.listen(3000, () => {
	console.log('Server is running on http://localhost:3000')
})