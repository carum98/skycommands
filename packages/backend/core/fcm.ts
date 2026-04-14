import admin from 'firebase-admin'

import googleServices from '../serviceAccountKey.json'

admin.initializeApp({
	credential: admin.credential.cert(googleServices as admin.ServiceAccount)
})

const messaging = admin.messaging()

export async function sendFCM(token: string, payload: Record<string, string>) {
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