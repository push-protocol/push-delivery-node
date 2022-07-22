import {
    Service,
    Container
} from 'typedi';
import config from '../config';
import logger from '../loaders/logger'

import PushTokensService from './pushTokensService';
import PushMessageService from './pushMessageService';

@Service()
export default class FeedsService {
    public async processFeed(feed: any) {
        try {
            logger.debug('Process feed for sid: %s | payload: %o', feed.sid, feed.payload);
            const pushTokens = Container.get(PushTokensService);
            const deviceTokensMeta = await pushTokens.getDeviceTokens(feed.users);
            let devices = deviceTokensMeta['devices'];
            const pushMessage = Container.get(PushMessageService);
            let count = 0;
            while (devices.length) {
                const deviceChunk = devices.splice(0, config.messagingChunkMaxSize);
                const loop_id = feed.sid + '_' + count;
                await pushMessage.addMessage(loop_id, deviceChunk, feed.payload);
                count = count + 1
            }
        } catch (e) {
            logger.error(e);
        }
    }
}