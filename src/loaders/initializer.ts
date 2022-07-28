import dbGenerator from '../database/dbGeneratorHelper'
import logger from '../loaders/logger'

export default async () => {
    logger.info('   -- ✌️   Running DB Checks')
    await dbGenerator.generateDBStructure(logger)
    logger.info('      ✔️   DB Checks completed!')
    logger.transports.forEach((t) => (t.silent = false))
    logger.info('      ✔️   Protocol History Synced!')
}
