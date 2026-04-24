import type { Request, Response } from 'express'
import { CommandsService, DeviceNotFoundError, DispatchError } from './commands.service'

export class CommandsController {
   constructor(private service: CommandsService) { }

   execute = async (req: Request, res: Response) => {
      const { deviceCode, uuid, command, payload, timeout, attempts } = req.body

      try {
         const { commandId, result } = await this.service.dispatch(
            deviceCode || uuid,
            command,
            { timeout, attempts, payload }
         )
         res.json({ command_id: commandId, result })
      } catch (error: unknown) {
         if (error instanceof DeviceNotFoundError) {
            return res.status(404).json({ error: 'Device not found' })
         }
         if (error instanceof DispatchError) {
            return res.status(500).json({ command_id: error.commandId, error: error.message })
         }
         res.status(500).json({ error: (error as Error).message || 'Error executing command' })
      }
   }

   receive = (req: Request, res: Response) => {
      const { commandId, result } = req.body
      const ok = this.service.complete(commandId, result)
      if (!ok) return res.status(404).json({ error: 'Command not found' })
      res.json({ success: true })
   }

   ping = async (req: Request, res: Response) => {
      req.body.deviceCode = req.body.code
      req.body.command = 'ping'
      await this.execute(req, res)
   }
}
