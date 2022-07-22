import expressLoader from './express'
import dependencyInjectorLoader from './dependencyInjector'
import logger from './logger'
import initializer from './initializer'
import dbLoader from './db'
import pushNodeListener from '../sockets/pushNodeListener'

export default async ({ expressApp, server, testMode }) => {
    logger.info('✔️   Loaders connected!')

    const pool = await dbLoader()
    logger.info('✔️   Database connected!')

    await dependencyInjectorLoader()
    logger.info('✔️   Dependency Injector loaded!')

    logger.info('✌️   Running Initilizer')
    await initializer({ logger, testMode })
    logger.info('✔️   Initilizer completed!')

    await expressLoader({ app: expressApp })
    logger.info('✔️   Express loaded!')

    await pushNodeListener()
    logger.info('✔️   PushNodeListener loaded!')
}
