import expressLoader from './express'
import dependencyInjectorLoader from './dependencyInjector'
import logger from './logger'
import initializer from './initializer'
import dbLoader from './db'
import deliveryNodeSocketListener from '../services/messaging/deliveryNodeSocket'
import jobsLoader from './jobs'
import redisLoader from './redis'

export default async ({ expressApp }) => {
    logger.info('✔️   Loaders connected!')

    logger.info('✌️   Database connecting!')
    await dbLoader()
    logger.info('✔️   Database connected!')

    logger.info('✌️   Redis loading!')
    await redisLoader()
    logger.info('✔️   Redis loaded!')

    logger.info('✌️   Dependency Injector loading!')
    await dependencyInjectorLoader()
    logger.info('✔️   Dependency Injector loaded!')

    logger.info('✌️   Running Initializer!')
    await initializer()
    logger.info('✔️   Initializer completed!')

    logger.info('✌️   Loading jobs!')
    await jobsLoader()
    logger.info('✔️   Jobs loaded!')

    logger.info('✌️   Loading express!')
    await expressLoader({ app: expressApp })
    logger.info('✔️   Express loaded!')

    logger.info('✌️   Loading PushNodeListener!')
    await deliveryNodeSocketListener()
    logger.info('✔️   PushNodeListener loaded!')
}
