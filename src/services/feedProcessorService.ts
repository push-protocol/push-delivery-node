import { Service, Container } from 'typedi'
import config from '../config'
import logger from '../loaders/logger'
import * as PushNodeUtils from '../utils/pushNodeUtils'
import PushTokensService from './pushTokensService'
import PushMessageService from './pushMessageService'
import * as StringUtil from '../utils/stringUtil'
import { verifyPayloadSize } from '../utils/commonUtils'
var utils = require('../helpers/utilsHelper')

@Service()
export default class FeedsService {
    async generateDataObject(feed) {
        if (feed.payload.data.type === 4) {
            return {}
        }

        if (feed.payload.data.app === 'Push Chat') {
            const verificationProof = feed.payload.verificationProof
            const chatIdMatch = verificationProof.match(
                /:internal:([a-f0-9]{64})/
            )

            let chatId = null
            if (chatIdMatch && chatIdMatch[1]) {
                chatId = chatIdMatch[1]
                console.log('Extracted chatId:', chatId)
            } else {
                console.error(
                    'Failed to extract chatId from verificationProof:',
                    verificationProof
                )
                return {} // Ignore and return an empty object
            }

            if (!chatId) {
                console.error('chatId could not be extracted')
                return {}
            }

            // let url = config.PUSH_NODE_WEBSOCKET_URL
            // const requestUrl = `${url}/apis/v1/chat/${chatId}/address/${feed.sender}`
            // const threadHashUrl = `${url}/apis/v1/chat/users/${feed.sender}/conversations/${chatId}/hash`

            let threadHash

            try {
                // const threadHashResponse = await axios.get(threadHashUrl)
                const threadHashResponse = await PushNodeUtils.getThreadHashUrl(
                    feed.sender,
                    chatId
                )
                threadHash = threadHashResponse.data.threadHash || ''
            } catch (error) {
                console.error('Error while calling the ThreadHash API:', error)
            }

            let msg = null
            if (threadHash) {
                try {
                    // const msgUrl = `${url}/apis/v1/chat/conversationhash/${threadHash}?fetchLimit=1`
                    // const msgResponse = await axios.get(msgUrl)
                    const msgResponse = await PushNodeUtils.messageUrl(
                        threadHash
                    )
                    if (
                        Array.isArray(msgResponse.data) &&
                        msgResponse.data.length > 0
                    ) {
                        msg = msgResponse.data[0]
                    }
                } catch (error) {
                    console.error('Error while calling the Message API:', error)
                }
            }

            try {
                // const response = await axios.get(requestUrl)
                const response = await PushNodeUtils.getChatUserInfo(
                    chatId,
                    feed.sender
                )
                const meta = response.data.meta

                const subType = meta.group ? 'GROUP_CHAT' : 'INDIVIDUAL_CHAT'
                const userInfo = await PushNodeUtils.getUserInfo(feed.sender)
                if (subType === 'INDIVIDUAL_CHAT') {
                    return {
                        // check if the user's profile picture is bigger than 4kb

                        type: 'PUSH_NOTIFICATION_CHAT',
                        details: {
                            subType,
                            info: {
                                wallets: feed.sender,
                                profilePicture:
                                    userInfo.data.profile.picture ?? '',
                                chatId,
                                threadhash: threadHash,
                            },
                        },
                        messageBody: {
                            title: StringUtil.getTrimmedAddress(feed.sender),
                            body: StringUtil.getGenericMessage(
                                msg?.messageType ?? null
                            ),
                        },
                    }
                } else if (subType === 'GROUP_CHAT') {
                    let groupInfo = null
                    if (meta.group) {
                        try {
                            // const groupInfoUrl = `${url}/apis/v2/chat/groups/${chatId}`
                            // const groupInfoResponse = await axios.get(groupInfoUrl)
                            const groupInfoResponse =
                                await PushNodeUtils.getGroupInfo(chatId)
                            groupInfo = {
                                groupName: groupInfoResponse.data.groupName,
                                groupImage: groupInfoResponse.data.groupImage,
                            }
                        } catch (error) {
                            console.error(
                                'Error while calling the Group Info API:',
                                error
                            )
                        }
                    }
                    return {
                        type: 'PUSH_NOTIFICATION_CHAT',
                        details: {
                            subType,
                            info: {
                                wallets: feed.sender,
                                profilePicture:
                                    userInfo.data.profile.picture ?? '',
                                chatId,
                                threadhash: threadHash,
                            },
                        },
                        messageBody: {
                            title: groupInfo.groupName ?? '',
                            body: `${StringUtil.getTrimmedAddress(
                                feed.sender
                            )} : ${StringUtil.getGenericMessage(
                                msg?.messageType ?? null
                            )}`,
                        },
                    }
                }
            } catch (error) {
                console.error('Error while calling the API:', error)
                return {}
            }
        }

        return {
            type: 'PUSH_NOTIFICATION_CHANNEL',
            details: {
                subType: feed.is_spam ? 'SPAM' : 'INBOX',
                info: {
                    icon: feed.payload.data.icon || '',
                    app: feed.payload.data.app || '',
                    image: feed.payload.data.aimg || '',
                },
            },
        }
    }

    private generateMessageBasedOnPlatformAndType(
        feed: any,
        platform: string,
        voip: boolean
    ) {
        if (!voip) {
            return utils.generateWebMessagingPayloadFromFeed(feed)
            // TODO: Fix this issue once the mobile app is deployed
            // return platform === config.platformEnum.web
            //     ? utils.generateWebMessagingPayloadFromFeed(feed)
            //     : utils.generateMobileMessagingPayloadFromFeed(feed)
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
                feed.payload.data.additionalMeta.data &&
                typeof feed.payload.data.additionalMeta.data === 'object' &&
                JSON.parse(feed.payload.data.additionalMeta.data).status === 4
            ) {
                logger.info('Cancel video call feed sid:: %o ', feed.sid)
                return
            }
            const pushTokens = Container.get(PushTokensService)
            const deviceTokensMeta = await pushTokens.getDeviceTokens(
                feed.users,
                feed.payload.data.additionalMeta &&
                    feed.payload.data.additionalMeta.data &&
                    typeof feed.payload.data.additionalMeta.data === 'object' &&
                    JSON.parse(feed.payload.data.additionalMeta.data).status ===
                        1
            )
            let devices = deviceTokensMeta.devices
            if (devices.length == 0) {
                logger.info(
                    'The feed has no appropriate device id mappings for the given addresses, hence  skipping the feed with sid :: %o ',
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

            const data = await this.generateDataObject(feed)
            msgPayload.notification.title =
                data?.messageBody?.title ?? msgPayload.notification.title
            msgPayload.notification.body =
                data?.messageBody?.body ?? msgPayload.notification.body
            delete data.messageBody
            msgPayload.data = data
            // check for the whole payload size
            const isValidPayloadSize = verifyPayloadSize(
                JSON.stringify(msgPayload)
            )
            if (
                !isValidPayloadSize &&
                msgPayload.data.tyepe === 'PUSH_NOTIFICATION_CHAT'
            ) {
                // remove the images from the payload
                msgPayload.apns.fcm_options.image = ''
                // if still greater than 4kb
                if (!verifyPayloadSize(JSON.stringify(msgPayload))) {
                    msgPayload.data.details.info.profilePicture = ''
                    // just for debugging the payload size after emoving images
                    verifyPayloadSize(JSON.stringify(msgPayload))
                }
            }
            msgPayload.data.details = JSON.stringify(msgPayload.data.details)
            console.log('msgPayload:', msgPayload)
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
