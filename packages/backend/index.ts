import { getDB } from '@core/database'
import { Server } from '@core/server'
import { DepencyInjection } from '@core/di'
import { DevicesService } from '@devices/devices.service'

import '@core/scheduler'

const db = getDB()

const di = DepencyInjection.getInstance()
di.register(() => new DevicesService(db))

const server = new Server()

server.use('/devices', require('@modules/devices').default)
server.use('/commands', require('@modules/commands').default)

server.listen(3000)