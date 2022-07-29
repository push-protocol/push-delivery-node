import {
    Service,
    Container
} from 'typedi'
import config from '../config'
import logger from '../loaders/logger'
import PushTokensService from './pushTokensService'
import FCMService from './fcmService'

const db = require('../database/dbHelper')

@Service()
export default class PushMessageService {
    // For adding or modifying info of channel
    public async addMessage(loop_id, tokens, payload) {
        logger.info(
            'Adding incoming messages from feed with loop_id: ' + loop_id
        )
        // Need to ignore to handle the case of feeds process failing, it's a bit hacky
        const query =
            'INSERT IGNORE INTO pushmsg (loop_id, tokens, payload) VALUES (?, ?, ?);'
        return await new Promise(async (resolve, reject) => {
                db.query(
                    query,
                    [loop_id, JSON.stringify(tokens), JSON.stringify(payload)],
                    function(err, results) {
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
                const row = {
                    "loop_id": loop_id,
                    "tokens": JSON.stringify(tokens),
                    "payload": JSON.stringify(payload)
                }
                this.processMessage(row)
                    .then((response) => {
                        logger.debug(
                            'Completed processMessages() for loop_id: ' +
                            loop_id
                        )
                    })
                    .catch((err) => {
                        logger.error(
                            '🔥 Error processMessages() for loop_id: ' +
                            loop_id,
                            err
                        )
                    })
                return {
                    success: 1,
                    loop_id: loop_id
                }
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
            'SELECT loop_id, tokens, payload FROM pushmsg WHERE attempts<? ORDER BY  timestamp DESC LIMIT 50'
        return await new Promise((resolve, reject) => {
                db.query(
                    query,
                    [config.messagingMaxAttempts],
                    function(err, results) {
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
                for (const row of response) {
                    this.processMessage(row)
                        .then((response) => {
                            logger.debug(
                                'Completed processMessages() for loop_id: ' +
                                row.loop_id
                            )
                        })
                        .catch((err) => {
                            logger.error(
                                '🔥 Error processMessages() for loop_id: ' +
                                row.loop_id,
                                err
                            )
                        })
                }
                return {
                    success: 1
                }
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }

    public async deleteStaleMessages() {
        logger.debug(
            'Trying to delete all the messages which could not be delivered, 1000 messages at a time'
        )
        const query =
            'DELETE FROM pushmsg WHERE attempts>=? AND timestamp <= DATE(NOW() - INTERVAL ? DAY) ORDER BY timestamp ASC LIMIT 1000'
        let moreResults = true
        let count = 0
        while (moreResults) {
            await new Promise((resolve, reject) => {
                    db.query(
                        query,
                        [config.messagingMaxAttempts, config.preserveStaleMessagesDays],
                        function(err, results) {
                            if (err) {
                                return reject(err)
                            } else {
                                return resolve(results)
                            }
                        }
                    )
                })
                .then((response) => {
                    count += response['affectedRows'];
                    if (response['affectedRows'] == 0) {
                        moreResults = false;
                        logger.info("No more records left for deletion, exiting the loop")
                    } else {
                        logger.info("Deleted %s records in this iteration. Moving to next iteration")
                    }

                    return {
                        success: 1
                    }
                })
                .catch((err) => {
                    logger.error(err)
                    throw err
                })
        }
        logger.info('✅ Completed deleteStaleMessages() Total Deleted %s records', count)
    }

    public async processMessage(row: any) {
        if (config.LOCK_MESSAGING_LOOPIDS[row.loop_id]) {
            logger.debug(
                'Notification Loop ID: %s is already processing, skipped...',
                row.loop_id
            )
        }

        // If lock, queue the other transactions
        if (!config.LOCK_MESSAGING_LOOPIDS[row.loop_id]) {
            config.LOCK_MESSAGING_LOOPIDS[row.loop_id] = true
            logger.debug('🎯 Sending Notification for loop_id: ' + row.loop_id)

            // Set valid flag for rest of logic
            let valid = true
            let err = ''
            let fcmResponse = {}
            const fcm = Container.get(FCMService)
            try {
                fcmResponse = await fcm.sendMessageToMultipleRecipient(
                    JSON.parse(row.tokens),
                    JSON.parse(row.payload)
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
                            failedTokens.push(JSON.parse(row.tokens)[idx])
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

                // Finally, populate the payload
                try {
                    await this.finishProcessing(row)
                    logger.info('✅ Completed processMessage()')
                    return {
                        success: 1
                    }
                } catch (e) {
                    valid = false
                    logger.error(err)
                    err = e
                }
            } else {
                // Write attempt number before erroring out
                try {
                    await this.bumpAttemptCount(row.loop_id)
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
    private async finishProcessing(row) {
        logger.debug(
            'Finishing Processing for processMessage of loop_id: ' + row.loop_id
        )
        const insert_query =
            'INSERT IGNORE INTO pushmsg_archive (loop_id, tokens, attempts) VALUES (?, ?, ?);'

        await new Promise((resolve, reject) => {
                db.query(insert_query, [row.loop_id, row.tokens, row.attempts], function(err, results) {
                    if (err) {
                        return reject(err)
                    } else {
                        return resolve(results)
                    }
                })
            })
            .then((response) => {
                logger.info('✅ Added message to acrchive')
                return true
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })

        const query = 'DELETE from pushmsg WHERE loop_id=?'
        return await new Promise((resolve, reject) => {
                db.query(query, [row.loop_id], function(err, results) {
                    // release the lock
                    delete config.LOCK_MESSAGING_LOOPIDS[row.loop_id]
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
                db.query(query, [loop_id], function(err, results) {
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