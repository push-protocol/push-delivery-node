import expressLoader from './express'
import dependencyInjectorLoader from './dependencyInjector'
import logger from './logger'
import initializer from './initializer'
import dbLoader from './db'
import pushNodeListener from '../sockets/pushNodeListener'
import jobsLoader from './jobs';
import redisLoader from './redis';

export default async ({ expressApp}) => {
    logger.info('✔️   Loaders connected!')

    await dbLoader()
    logger.info('✔️   Database connected!')

    await redisLoader()
    logger.info('✔️   Redis loaded!')

    await dependencyInjectorLoader()
    logger.info('✔️   Dependency Injector loaded!')

    logger.info('✌️   Running Initializer')
    await initializer({ logger })
    logger.info('✔️   Initializer completed!')

    logger.info('✌️   Loading jobs');
    await jobsLoader({ logger });
    logger.info('✔️   Jobs loaded!');

    await expressLoader({ app: expressApp })
    logger.info('✔️   Express loaded!')

    await pushNodeListener()
    logger.info('✔️   PushNodeListener loaded!')
}
