import admin from 'firebase-admin'
import { logError } from '@core/logger'

import googleServices from '../serviceAccountKey.json'

admin.initializeApp({
	credential: admin.credential.cert(googleServices as admin.ServiceAccount)
})

const messaging = admin.messaging()

export async function sendFCM(token: string, payload: Record<string, string>): Promise<boolean> {
	try {
		await messaging.send({
			token: token,
			data: payload,
			android: {
				priority: 'high'
			}
		})
		return true
	} catch (error: any) {
		if (error?.errorInfo?.code === 'messaging/registration-token-not-registered') {
			throw new FCMUnregisteredError(token)
		}
		logError('fcm.send', error)
		return false
	}
}

export class FCMUnregisteredError extends Error {
	constructor(token: string) {
		super(`FCM token is no longer registered: ${token}`)
		this.name = 'FCMUnregisteredError'
	}
}
