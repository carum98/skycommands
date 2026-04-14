import { getDB } from '@core/database'
import { DepencyInjection } from '@core/di'
import { Server } from '@core/server'

import { DevicesService } from '@devices/devices.service'

const db = getDB()

const di = DepencyInjection.getInstance()
di.register(() => new DevicesService(db))

const server = new Server()

server.use('/devices', require('@modules/devices').default)
server.use('/commands', require('@modules/commands').default)

server.listen(3000)