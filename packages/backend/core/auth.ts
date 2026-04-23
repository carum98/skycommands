import type { Request, Response, NextFunction } from 'express'

export function auth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization

	if (header?.startsWith('Bearer ')) {
		return bearerAuth(header.slice(7), res, next)
	}

	if (header?.startsWith('Basic ')) {
		return basicAuth(header.slice(6), res, next)
	}

	const username = process.env.AUTH_USERNAME
	const password = process.env.AUTH_PASSWORD
	const appKey = process.env.APP_KEY

	if (!username && !password && !appKey) {
		return next()
	}

	res.setHeader('WWW-Authenticate', 'Basic realm="SkyCommands"')
	return res.status(401).json({ error: 'Unauthorized' })
}

function basicAuth(credentials: string, res: Response, next: NextFunction) {
	const username = process.env.AUTH_USERNAME
	const password = process.env.AUTH_PASSWORD

	if (!username || !password) {
		console.warn('AUTH_USERNAME or AUTH_PASSWORD not set — basic auth disabled')
		return res.status(401).json({ error: 'Unauthorized' })
	}

	const decoded = Buffer.from(credentials, 'base64').toString('utf-8')
	const [user, pass] = decoded.split(':')

	if (user !== username || pass !== password) {
		res.setHeader('WWW-Authenticate', 'Basic realm="SkyCommands"')
		return res.status(401).json({ error: 'Unauthorized' })
	}

	next()
}

function bearerAuth(token: string, res: Response, next: NextFunction) {
	const appKey = process.env.APP_KEY

	if (!appKey) {
		console.warn('APP_KEY not set — bearer auth disabled')
		return res.status(401).json({ error: 'Unauthorized' })
	}

	if (token !== appKey) {
		return res.status(401).json({ error: 'Unauthorized' })
	}

	next()
}
