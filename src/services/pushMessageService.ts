import { Service, Container } from 'typedi'
import config from '../config'
import logger from '../loaders/logger'
import PushTokensService from './pushTokensService'
import FCMService from './fcmService'

const db = require('../database/dbHelper')

@Service()
export default class PushMessageService {
    // For adding or modifying info of channel
    public async addMessage(loop_id, tokens, payload) {
        logger.debug(
            'Adding incoming messages from feed with loop_id: ' + loop_id
        )

        // Need to ignore to handle the case of feeds process failing, it's a bit hacky
        const query =
            'INSERT IGNORE INTO pushmsg (loop_id, tokens, payload) VALUES (?, ?, ?);'

        return await new Promise(async (resolve, reject) => {
            db.query(
                query,
                [loop_id, JSON.stringify(tokens), JSON.stringify(payload)],
                function (err, results) {
                    if (err) {
                        return reject(err)
                    } else {
                        return resolve(results)
                    }
                }
            )
        })
            .then(async (response) => {
                logger.info('✅ Completed addMessage(): %o', response)
                this.batchProcessMessages()
                return { success: 1, loop_id: loop_id }
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }

    // for processing feeds
    public async batchProcessMessages() {
        logger.debug(
            'Trying to batch process all messages which are not processed, 50 requests at a time'
        )
        const query =
            'SELECT loop_id, tokens, payload FROM pushmsg WHERE processed=0 AND attempts<? ORDER BY attempts ASC, timestamp DESC LIMIT 50'
        return await new Promise((resolve, reject) => {
            db.query(
                query,
                [config.messagingMaxAttempts],
                function (err, results) {
                    if (err) {
                        return reject(err)
                    } else {
                        return resolve(results)
                    }
                }
            )
        })
            .then((response) => {
                logger.info('✅ Completed batchProcessMessages(): %o', response)
                // Now Loop the channel data
                for (const item of response) {
                    this.processMessage(item.loop_id, item.tokens, item.payload)
                        .then((response) => {
                            logger.debug(
                                'Completed processMessages() for loop_id: ' +
                                    item.loop_id
                            )
                        })
                        .catch((err) => {
                            logger.error(
                                '🔥 Error processMessages() for loop_id: ' +
                                    item.loop_id,
                                err
                            )
                        })
                }

                // Finally return succes
                return { success: 1 }
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }

    // for processing ipfshash
    public async processMessage(loop_id, tokens, payload) {
        if (config.LOCK_MESSAGING_LOOPIDS[loop_id]) {
            logger.debug(
                'Notification Loop ID: %s is already processing, skipped...',
                loop_id
            )
        }

        // If lock, queue the other transactions
        if (!config.LOCK_MESSAGING_LOOPIDS[loop_id]) {
            config.LOCK_MESSAGING_LOOPIDS[loop_id] = true
            logger.debug('🎯 Sending Notification for loop_id: ' + loop_id)

            // Set valid flag for rest of logic
            let valid = true
            let err = ''
            let fcmResponse = {}

            const fcm = Container.get(FCMService)

            try {
                fcmResponse = await fcm.sendMessageToMultipleRecipient(
                    JSON.parse(tokens),
                    JSON.parse(payload)
                )
            } catch (e) {
                valid = false
                logger.error(e)
                err = e
            }

            // Check and remove failed tokens
            if (valid) {
                if (fcmResponse.failureCount > 0) {
                    const failedTokens = []

                    fcmResponse.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(JSON.parse(tokens)[idx])
                        }
                    })

                    // List of tokens that failed
                    logger.info(
                        'List of tokens that caused failures: %o',
                        failedTokens
                    )

                    // Now handle failed tokens
                    if (failedTokens.length > 0) {
                        const pushTokens = Container.get(PushTokensService)
                        try {
                            await pushTokens.deleteDeviceTokens(failedTokens)
                        } catch (e) {
                            valid = false
                            logger.error(e)
                            err = e
                        }
                    }
                }
            }

            // Finally, populate the payload
            if (valid) {
                try {
                    await this.finishProcessing(loop_id)
                    logger.info('✅ Completed processMessage()')
                    return { success: 1 }
                } catch (e) {
                    valid = false
                    logger.error(err)
                    err = e
                }
            }

            if (!valid) {
                // Write attempt number before erroring out
                try {
                    await this.bumpAttemptCount(loop_id)
                } catch (e) {
                    err = e
                    // do nothing as this logic will now throw an error nonetheless
                }

                logger.error(err)
                throw err
            }
        }
    }

    // To populate payload
    private async finishProcessing(loop_id) {
        logger.debug(
            'Finishing Processing for processMessage of loop_id: ' + loop_id
        )

        const query = 'UPDATE pushmsg SET processed=1 WHERE loop_id=?'

        return await new Promise((resolve, reject) => {
            db.query(query, [loop_id], function (err, results) {
                // release the lock
                delete config.LOCK_MESSAGING_LOOPIDS[loop_id]

                if (err) {
                    return reject(err)
                } else {
                    return resolve(results)
                }
            })
        })
            .then((response) => {
                logger.info('✅ Completed finishProcessing()')
                return true
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }

    // to bump attempt count incase it isn't processed
    private async bumpAttemptCount(loop_id: string) {
        const query = 'UPDATE pushmsg SET attempts=attempts+1 WHERE loop_id=?'

        return await new Promise((resolve, reject) => {
            db.query(query, [loop_id], function (err, results) {
                // release the lock
                delete config.LOCK_MESSAGING_LOOPIDS[loop_id]

                if (err) {
                    return reject(err)
                } else {
                    return resolve(results)
                }
            })
        })
            .then((response) => {
                logger.info('✅ Completed bumpAttemptCount()')
                return true
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }
}
