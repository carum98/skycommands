import type { Request, Response } from 'express'
import { DevicesService } from '@devices/devices.service'

export class DevicesController {
	constructor(private service: DevicesService) { }

	getAll = (req: Request, res: Response) => {
		const devices = this.service.getAll(req.query as Record<string, string>)
		res.json(devices)
	}

	register = (req: Request, res: Response) => {
		const { fcmToken, udid } = req.body

		if (!fcmToken || !udid) {
			return res.status(400).json({ error: 'Missing fcmToken or udid' })
		}

		const existing = this.service.find(udid)

		if (existing) {
			return res.json({ code: existing.code })
		}

		const code = crypto.randomUUID().split('-').at(0)!

		this.service.create({ code, fcmToken, udid })
		res.json({ code })
	}

	unregister = (req: Request, res: Response) => {
		const { code } = req.params

		if (!code) return res.status(400).json({ error: 'Missing code' })

		const existing = this.service.find(code as string)
		if (!existing) return res.status(404).json({ error: 'Device not found' })

		this.service.delete(existing.id)
		res.json({ success: true })
	}

	heartbeat = async (req: Request, res: Response) => {
		const { udid } = req.body

		if (!udid) {
			return res.status(400).json({ error: 'Missing udid' })
		}

		const existing = this.service.find(udid)
		if (!existing) return res.status(404).json({ error: 'Device not found' })

		this.service.heartbeat(existing.id)

		res.json({ success: true })
	}

	updateMetadata = (req: Request, res: Response) => {
		const { code } = req.params
		const metadata = req.body

		if (!code || !metadata) {
			return res.status(400).json({ error: 'Missing code or metadata' })
		}

		const existing = this.service.find(code as string)
		if (!existing) return res.status(404).json({ error: 'Device not found' })

		this.service.updateMetadata(existing.id, metadata)

		res.json({ success: true })
	}
}