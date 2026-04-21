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
      const { deviceCode, uuid, command, payload, timeout = 10000, retries = 1 } = req.body
      const device = this.devicesService.find(deviceCode || uuid)

      if (!device) {
         return res.status(404).json({ error: 'Device not found' })
      }

      // Generate a unique command ID for tracking
      const commandId = crypto.randomUUID()

      try {
         // Data to be sent to the device
         const data = {
            commandId,
            command,
            ...(payload && { payload: JSON.stringify(payload) })
         }

         // Attempt to send the command with retries
         let result: string | undefined
         let lastError: Error | undefined

         for (let attempt = 1; attempt <= retries; attempt++) {
            try {
               // Send the command via FCM and wait for the response or timeout
               result = await new Promise(async (resolve, reject) => {
                  const success = await sendFCM(device.fcm_token as string, data)

                  if (success) {
                     // Set up a timeout to reject the promise if no response is received in time
                     const timer = setTimeout(() => {
                        this.pending.delete(commandId)
                        reject(new Error('Timeout'))
                     }, timeout)

                     // Store the resolve and reject functions in the pending map for later through receive endpoint
                     this.pending.set(commandId, { resolve, reject, timeout: timer })
                  } else {
                     reject(new Error('Failed to send FCM'))
                  }
               })
               break
            } catch (error) {
               lastError = error as Error
            }
         }

         // If we exhausted all retries and still have no result, throw the last error
         if (result === undefined) throw lastError

         // Parse result if it's JSON, otherwise return as string
         res.json({
            command_id: commandId,
            result: result.startsWith('{') || result.startsWith('[') ? JSON.parse(result) : result,
         })
      } catch (error: Error | unknown) {
         res.status(500).json({
            command_id: commandId,
            error: (error as Error).message || 'Error executing command'
         })
      }
   }

   receive = (req: Request, res: Response) => {
      const { commandId, result } = req.body

      // Look up the pending command by ID
      const pendingCommand = this.pending.get(commandId)

      if (!pendingCommand) {
         return res.status(404).json({ error: 'Command not found' })
      }

      // Resolve the pending command with the result and clear the timeout
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