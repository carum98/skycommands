import { FCMUnregisteredError, sendFCM } from '@core/fcm'
import { logCommand, logError } from '@core/logger'
import { DevicesService } from '@devices/devices.service'

type PendingCommand = {
   resolve: (value: string) => void
   reject: (error: Error) => void
   timeout: NodeJS.Timeout
}

export type DispatchOptions = {
   timeout?: number
   attempts?: number
   payload?: unknown
}

export type DispatchResult = {
   commandId: string
   result: unknown
}

export class DeviceNotFoundError extends Error {
   constructor(identifier: string) {
      super(`Device not found: ${identifier}`)
      this.name = 'DeviceNotFoundError'
   }
}

export class DispatchError extends Error {
   constructor(message: string, public readonly commandId: string | undefined) {
      super(message)
      this.name = 'DispatchError'
   }
}

export class CommandsService {
   private pending = new Map<string, PendingCommand>()

   constructor(private devicesService: DevicesService) { }

   async dispatch(identifier: string, command: string, opts: DispatchOptions = {}): Promise<DispatchResult> {
      const { timeout = 10000, attempts = 1, payload } = opts

      const device = this.devicesService.find(identifier)
      if (!device) throw new DeviceNotFoundError(identifier)

      let commandId: string | undefined
      let result: string | undefined
      let lastError: Error | undefined

      for (let attempt = 1; attempt <= attempts; attempt++) {
         // Each attempt uses a fresh id so a late response from a previous
         // attempt cannot resolve the current one.
         commandId = crypto.randomUUID()
         const data: Record<string, string> = {
            commandId,
            command,
         }
         if (payload !== undefined) {
            data.payload = JSON.stringify(payload)
         }

         logCommand({
            event: 'sent',
            commandId,
            deviceCode: device.code,
            command,
            payload,
            attempt,
         })

         try {
            result = await this.dispatchAttempt(device.fcm_token, data, timeout)
            break
         } catch (error) {
            logCommand({
               event: 'failed',
               commandId,
               deviceCode: device.code,
               command,
               attempt,
               error: (error as Error).message
            })

            if (error instanceof FCMUnregisteredError) {
               this.devicesService.delete(device.id)
               throw new DispatchError('Device is no longer registered', commandId)
            }

            lastError = error as Error
         }
      }

      if (result === undefined) {
         logError('commands.dispatch', lastError, { commandId, deviceCode: device.code, command })
         throw new DispatchError(lastError?.message || 'Error executing command', commandId)
      }

      const parsed = this.tryParseJSON(result)

      logCommand({
         event: 'result',
         commandId: commandId!,
         deviceCode: device.code,
         command,
         result: parsed,
      })

      return { commandId: commandId!, result: parsed }
   }

   complete(commandId: string, result: string): boolean {
      const pending = this.pending.get(commandId)
      if (!pending) return false

      clearTimeout(pending.timeout)
      this.pending.delete(commandId)
      pending.resolve(result)
      return true
   }

   private async dispatchAttempt(token: string, data: Record<string, string>, timeoutMs: number): Promise<string> {
      const success = await sendFCM(token, data)
      if (!success) throw new Error('Failed to send FCM')
      // Note: FCMUnregisteredError is intentionally not caught here — it propagates up

      return new Promise<string>((resolve, reject) => {
         const id = data.commandId
         const timer = setTimeout(() => {
            this.pending.delete(id)
            reject(new Error('Timeout'))
         }, timeoutMs)
         this.pending.set(id, { resolve, reject, timeout: timer })
      })
   }

   private tryParseJSON(value: string): unknown {
      if (!value.startsWith('{') && !value.startsWith('[')) return value
      try {
         return JSON.parse(value)
      } catch {
         return value
      }
   }
}
