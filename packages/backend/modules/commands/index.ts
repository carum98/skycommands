import { Router } from 'express'
import { CommandsController } from './commands.controller'
import { CommandsService } from './commands.service'
import { DepencyInjection } from '@core/di'

const router = Router()
const di = DepencyInjection.getInstance()

const service = di.resolve(CommandsService)
const controller = new CommandsController(service)

router.post('/execute', controller.execute)
router.post('/result', controller.receive)
router.post('/ping', controller.ping)

router.post('/execute-old', controller.executeOld)

export default router
