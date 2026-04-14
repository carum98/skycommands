import { Router } from 'express'
import { CommandsController } from './commands.controller'
import { DepencyInjection } from '@core/di'
import { DevicesService } from '@devices/devices.service'

const router = Router()
const di = DepencyInjection.getInstance()

const service = di.resolve(DevicesService)
const controller = new CommandsController(service)

router.post('/execute', controller.execute)
router.post('/result', controller.receive)

export default router