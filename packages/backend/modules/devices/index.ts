import { Router } from 'express'
import { DevicesController } from './devices.controller'
import { DepencyInjection } from '@core/di'
import { DevicesService } from './devices.service'

const router = Router()
const di = DepencyInjection.getInstance()

const service = di.resolve(DevicesService)
const controller = new DevicesController(service)

router.get('/', controller.getAll)
router.post('/', controller.register)
router.post('/heartbeat', controller.heartbeat)
router.delete('/:code', controller.unregister)

export default router