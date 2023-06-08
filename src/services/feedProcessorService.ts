import { Service, Container } from 'typedi'
import config from '../config'
import logger from '../loaders/logger'

import PushTokensService from './pushTokensService'
import PushMessageService from './pushMessageService'
import {FData, FPayload} from "./DeliveryNode";
var utils = require('../helpers/utilsHelper')

@Service()
export default class FeedsService {
    public async processFeed(feed: DNFeedItem) {
        try {
            logger.debug('Process feed for sid: %o | feed: %o', feed.sid, feed)
            if (feed.users.length == 0) {
                logger.info(
                    'The Feed contains empty tokens, hence skipping the feed with sid :: %o ',
                    feed.sid
                )
                return
            }
            const pushTokens = Container.get(PushTokensService)
            const deviceTokensMeta = await pushTokens.getDeviceTokens(
                feed.users
            )
            let devices = deviceTokensMeta['devices']
            if (devices.length == 0) {
                logger.info(
                    'The feed has no appropriate device id mappings for the given addresses, hence skipping the feed with sid :: %o ',
                    feed.sid
                )
                return
            }
            const pushMessage = Container.get(PushMessageService)
            let count = 0
            const msgPayload = utils.generateMessagingPayloadFromFeed(feed.payload)

            while (devices.length) {
                const deviceChunk = devices.splice(
                    0,
                    config.messagingChunkMaxSize
                )
                const loop_id = feed.sid + '_' + count
                var isDuplicate = await pushMessage.isLoopIdDuplicate(loop_id)
                if (!isDuplicate) {
                    await pushMessage.addMessage(
                        loop_id,
                        deviceChunk,
                        msgPayload
                    )
                    count = count + 1
                } else {
                    logger.debug(
                        'Loop id :: %o already exists in DB, hence skipping',
                        loop_id
                    )
                }
            }
        } catch (e) {
            logger.error(e)
        }
    }
}

// this is the object which comes from push storage node
export class DNFeedItem {
  sid: string;
  payload_id: string;
  users: string[];
  payload: FPayload;
  epoch: string;
}
