import admin from 'firebase-admin'

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
	} catch (error) {
		console.error('Error sending FCM:', error)
		return false
	}
}