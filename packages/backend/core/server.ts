import express from 'express'
import { auth } from '@core/auth'

export class Server {
	private app = express()

	constructor() {
		this.app.use(express.json())

		this.app.use((req, res, next) => {
			res.setHeader('Access-Control-Allow-Origin', '*')
			res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
			res.setHeader('Access-Control-Allow-Credentials', 'true')

			if (req.method === 'OPTIONS') {
				return res.sendStatus(204)
			}

			next()
		})

		this.app.use(auth)
	}

	use(path: string, router: express.Router) {
		this.app.use(path, router)
	}

	listen(port: number) {
		this.app.listen(port, () => {
			console.log(`Server is running on port ${port}`)
		})
	}
}