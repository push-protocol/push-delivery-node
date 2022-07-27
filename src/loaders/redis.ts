import {
    createClient
} from 'redis';
import config from '../config';
import logger from '../loaders/logger'

var client;

export default  async ()   =>  { 
    client = await createClient({
        url: config.REDIS_URL
    });
    await client.connect();
    client.on('error', (err) => logger.error('Redis Client Error', err));
    await client.set('connection', '-- 🛵 Redis connection successful');
    logger.info(await client.get('connection'))
 }

export {client}
