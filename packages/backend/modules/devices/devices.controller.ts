import type { Request, Response } from 'express'
import { DevicesService } from '@devices/devices.service'

export class DevicesController {
	constructor(private service: DevicesService) { }

	getAll = (req: Request, res: Response) => {
		const devices = this.service.getAll()
		res.json(devices)
	}

	register = (req: Request, res: Response) => {
		const { fcmToken, udid } = req.body

		if (!fcmToken || !udid) {
			return res.status(400).json({ error: 'Missing fcmToken or udid' })
		}

		const existing = this.service.find(udid)

		if (existing) {
			return res.status(400).json({ error: 'Device already registered' })
		}

		const code = crypto.randomUUID().split('-').at(0)!

		this.service.create({ code, fcmToken, udid })
		res.json({ code, fcmToken, udid })
	}
}