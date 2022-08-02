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
            logger.debug('Process feed for sid: %o | feed: %o', feed.sid, feed);
            if (feed.users.length == 0) {
                logger.info("The Feed contains empty tokens, hence skipping the feed with sid :: %o ", feed.sid);
                return;
            }
            const pushTokens = Container.get(PushTokensService);
            const deviceTokensMeta = await pushTokens.getDeviceTokens(feed.users);
            let devices = deviceTokensMeta['devices'];
            if (devices.length == 0) {
                logger.info("The feed has no appropriate device id mappings for the given addresses, hence skipping the feed with sid :: %o ", feed.sid);
                return;
            }
            const pushMessage = Container.get(PushMessageService);
            let count = 0;
            while (devices.length) {
                const deviceChunk = devices.splice(0, config.messagingChunkMaxSize);
                const loop_id = feed.sid + '_' + count;
                var isDuplicate = await pushMessage.isLoopIdDuplicate(loop_id);
                if (!isDuplicate) {
                    await pushMessage.addMessage(loop_id, deviceChunk, feed.payload);
                    count = count + 1;
                } else {
                    logger.debug("Loop id :: %o already exists in DB, hence skipping", loop_id);
                }
            }
        } catch (e) {
            logger.error(e);
        }
    }
}