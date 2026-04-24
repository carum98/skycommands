import { getDB } from '@core/database'
import { Server } from '@core/server'
import { DepencyInjection } from '@core/di'
import { DevicesService } from '@devices/devices.service'
import { CommandsService } from '@modules/commands/commands.service'

import '@core/scheduler'

const db = getDB()

const di = DepencyInjection.getInstance()
const deviceService = di.register(() => new DevicesService(db))
const commandsService = di.register(() => new CommandsService(deviceService))

const server = new Server()

server.use('/devices', require('@modules/devices').default)
server.use('/commands', require('@modules/commands').default)

server.listen(3000)