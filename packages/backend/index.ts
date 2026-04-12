import express from 'express'
import admin from 'firebase-admin'

import googleServices from './serviceAccountKey.json'

admin.initializeApp({
  credential: admin.credential.cert(googleServices as admin.ServiceAccount)
})

const messaging = admin.messaging()

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

async function sendCommand(deviceId: string, command: any) {
	const commandId = crypto.randomUUID()

	return new Promise(async (resolve, reject) => {
		const timeout = setTimeout(() => {
			pending.delete(commandId)
			reject(new Error('Timeout'))
		}, 10000)

		pending.set(commandId, { resolve, reject, timeout })

		await sendFCM(deviceId, {
			commandId,
			...command
		})
  })
}

async function sendFCM(deviceId: string, payload: any) {
	try {
		await messaging.send({
			token: deviceId,
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
	const { deviceId, command, payload } = req.body

	try {
		const result = await sendCommand(deviceId, { command, payload: JSON.stringify(payload ?? '') })
		res.json({ result })
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

app.listen(3000, () => {
	console.log('Server is running on http://localhost:3000')
})