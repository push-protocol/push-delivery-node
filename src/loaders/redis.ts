import { createClient } from 'redis'
import config from '../config'
import logger from '../loaders/logger'

var client

export default async () => {
    client = await createClient({
        url: config.REDIS_URL,
        password: config.REDIS_AUTH,
    })
    await client.connect()
    client.on('error', (err) => logger.error('Redis Client Error', err))
    await client.set('connection', '-- 🛵 Redis connection successful')
    var uptimeKey = process.env.DELIVERY_NODES_NET + '_LATEST_SERVICE_UPTIME'
    global.PREVIOUS_INSTANCE_LATEST_UPTIME = await client.get(uptimeKey)
    logger.info(
        '    -- PREVIOUS_INSTANCE_LATEST_UPTIME :: %o',
        new Date(Number(global.PREVIOUS_INSTANCE_LATEST_UPTIME))
    )
}

export { client }
