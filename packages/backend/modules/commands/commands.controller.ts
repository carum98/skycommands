import type { Request, Response } from 'express'
import { sendFCM } from '@core/fcm'
import { logCommand, logError } from '@core/logger'
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
      const { deviceCode, uuid, command, payload, timeout = 10000, attempts = 1 } = req.body
      const device = this.devicesService.find(deviceCode || uuid)

      if (!device) {
         return res.status(404).json({ error: 'Device not found' })
      }

      // Tracks the id of the latest attempt; returned to the caller so it
      // matches the id the device received and the one logged for that attempt.
      let commandId: string | undefined

      try {
         let result: string | undefined
         let lastError: Error | undefined

         for (let attempt = 1; attempt <= attempts; attempt++) {
            // Each attempt uses a fresh id so a late response from a previous
            // attempt cannot resolve the current one.
            commandId = crypto.randomUUID()
            const data = {
               commandId,
               command,
               ...(payload && { payload: JSON.stringify(payload) })
            }

            logCommand({
               event: 'sent',
               commandId,
               deviceCode: device.code as string,
               command,
               payload,
            })

            try {
               result = await this.dispatchAttempt(device.fcm_token as string, data, timeout)
               break
            } catch (error) {
               lastError = error as Error
            }
         }

         if (result === undefined) throw lastError

         const parsed = tryParseJSON(result)

         logCommand({
            event: 'result',
            commandId: commandId!,
            deviceCode: device.code as string,
            command,
            result: parsed,
         })

         res.json({ command_id: commandId, result: parsed })
      } catch (error: unknown) {
         const message = (error as Error).message || 'Error executing command'
         logError('commands.execute', error, { commandId, deviceCode: device.code, command })
         res.status(500).json({ command_id: commandId, error: message })
      }
   }

   private async dispatchAttempt(token: string, data: Record<string, string>, timeoutMs: number): Promise<string> {
      const success = await sendFCM(token, data)
      if (!success) throw new Error('Failed to send FCM')

      return new Promise<string>((resolve, reject) => {
         const id = data.commandId
         const timer = setTimeout(() => {
            this.pending.delete(id)
            reject(new Error('Timeout'))
         }, timeoutMs)
         this.pending.set(id, { resolve, reject, timeout: timer })
      })
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

   ping = async (req: Request, res: Response) => {
      req.body.deviceCode = req.body.code
      req.body.command = 'ping'
      await this.execute(req, res)
   }
}

function tryParseJSON(value: string): unknown {
   if (!value.startsWith('{') && !value.startsWith('[')) return value
   try {
      return JSON.parse(value)
   } catch {
      return value
   }
}
