import { Service, Container } from 'typedi'
import config from '../config'
import logger from '../loaders/logger'

import PushTokensService from './pushTokensService'
import PushMessageService from './pushMessageService'
var utils = require('../helpers/utilsHelper')

@Service()
export default class FeedsService {
    private generateMessageBasedOnPlatformAndType(
        feed: any,
        platform: string,
        voip: boolean
    ) {
        if (!voip) {
            return platform === config.platformEnum.web
                ? utils.generateWebMessagingPayloadFromFeed(feed)
                : utils.generateMobileMessagingPayloadFromFeed(feed)
        } else {
            if (voip && platform == config.platformEnum.android)
                return utils.generateAndrioidVideoCallPayloadFromFeed(feed)
        }
        return feed
    }
    public async processFeed(feed: any) {
        try {
            logger.debug('Process feed for sid: %o | feed: %o', feed.sid, feed)
            if (feed.users.length === 0) {
                logger.info(
                    'The Feed contains empty tokens, hence skipping the feed with sid :: %o ',
                    feed.sid
                )
                return
            }
            /**
             * BY DEFAULT DELIVERY NODES SKIP SPAM AND SILENT NOTIFICATIONS
             */
            if (feed.is_spam == 1) {
                logger.info(
                    'Spam Feed, hence skipping the feed with sid :: %o ',
                    feed.sid
                )
                return
            }
            if (feed.payload.data.silent == 1) {
                logger.info(
                    'Silent Feed, hence skipping the feed with sid :: %o ',
                    feed.sid
                )
                return
            }
            if (
                feed.payload.data.additionalMeta &&
                JSON.parse(feed.payload.data.additionalMeta.data).status == 4
            ) {
                logger.info('Cancel video call feed sid:: %o ', feed.sid)
                return
            }
            const pushTokens = Container.get(PushTokensService)
            const deviceTokensMeta = await pushTokens.getDeviceTokens(
                feed.users,
                feed.payload.data.additionalMeta &&
                    JSON.parse(feed.payload.data.additionalMeta.data).status ==
                        1
            )
            let devices = deviceTokensMeta.devices
            if (devices.length == 0) {
                logger.info(
                    'The feed has no appropriate device id mappings for the given addresses, hence skipping the feed with sid :: %o ',
                    feed.sid
                )
                return
            }
            const pushMessage = Container.get(PushMessageService)
            let count = 0
            const msgPayload = this.generateMessageBasedOnPlatformAndType(
                feed.payload,
                deviceTokensMeta.platform,
                deviceTokensMeta.voip
            )
            // to keep track of the pltform and voip status
            msgPayload.platform = deviceTokensMeta.platform
            msgPayload.voip = deviceTokensMeta.voip
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
