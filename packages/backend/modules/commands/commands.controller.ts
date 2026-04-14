import type { Request, Response } from 'express'
import { sendFCM } from '@core/fcm'
import { DevicesService } from '@devices/devices.service'

type PendingCommand = {
   resolve: (value: string) => void
   reject: (error: Error) => void
   timeout: NodeJS.Timeout
}

export class CommandsController {
   private pending = new Map<string, PendingCommand>()

   constructor(private devicesService: DevicesService) { }

   execute = async (req: Request, res: Response) => {
      const { deviceCode, uuid, command, payload } = req.body

      const device = uuid
         ? this.devicesService.findByUdid(uuid)
         : this.devicesService.findByCode(deviceCode)

      if (!device) {
         return res.status(404).json({ error: 'Device not found' })
      }

      try {
         const data = {
            command,
            ...(payload && { payload: JSON.stringify(payload) })
         } as Record<string, string>

         const result = await this.sendCommand(device.fcm_token as string, data)

         res.json({
            result: result.startsWith('{') || result.startsWith('[') ? JSON.parse(result) : result
         })
      } catch (error) {
         res.status(500).json({ error: 'Error executing command' })
      }
   }

   receive = (req: Request, res: Response) => {
      const { commandId, result } = req.body

      const pendingCommand = this.pending.get(commandId)

      if (!pendingCommand) {
         return res.status(404).json({ error: 'Command not found' })
      }

      clearTimeout(pendingCommand.timeout)
      pendingCommand.resolve(result)
      this.pending.delete(commandId)

      res.json({ success: true })
   }

   private async sendCommand(token: string, data: Record<string, string>): Promise<string> {
      const commandId = crypto.randomUUID()

      return new Promise(async (resolve, reject) => {
         const timeout = setTimeout(() => {
            this.pending.delete(commandId)
            reject(new Error('Timeout'))
         }, 10000)

         this.pending.set(commandId, { resolve, reject, timeout })

         await sendFCM(token, {
            commandId,
            ...data
         })
      })
   }
}