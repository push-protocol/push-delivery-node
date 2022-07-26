import {
    Service,
} from 'typedi'
import logger from '../loaders/logger';
var db = require('../database/dbHelper')
var pushNodeDB = require('../database/pushNodeDBHelper')

@Service()
export default class PushTokensTableMigration {
    public async copyPushTokensTable() {
        logger.info('copyPushTokensTable Started\n')
        const limit = 5000;
        let offset = 0;
        const selectQuery =
            'SELECT wallet, device_token, platform from pushtokens LIMIT ? OFFSET ?'
        let moreResults = true
        var count = 0;
        while (moreResults) {
            await new Promise(async (resolve, reject) => {
                    logger.info("Fetching records with limit :: %o and offset :: %o", limit, offset)
                    await pushNodeDB.query(selectQuery, [limit, offset], function(err, results) {
                        if (err) {
                            return reject(err)
                        } else {
                            return resolve(results)
                        }
                    })
                })
                .then(async response => {
                    logger.info("Number of records fetched :: %o \n", response.length)
                    if (response.length == 0) {
                        moreResults = false;
                    }
                    for (let i = 0; i < response.length; i++) {
                        count = count + 1;
                        let item = response[i];
                        const query =
                            'INSERT IGNORE INTO pushtokens_v2 (wallet, device_token, platform) VALUES (?, ?, ?)'
                        try {
                            await this.insertPushToken(item, query)
                        } catch (err) {
                            logger.error(err)
                            throw err
                        }
                    }
                })
                .catch(err => {
                    logger.error(err)
                    throw err
                })
            offset = offset + limit
        }
        logger.info('✅ PushTokensTableMigration Finished. Total records inserted :: ' + count)
        return {
            success: 1
        };
    }

    public async insertPushToken(item: any, query: any) {
        return await new Promise((resolve, reject) => {
                db.query(query, [item.wallet, item.device_token, item.platform], function(err, results) {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve(results);
                    }
                });
            })
            .then(response => {
                return {
                    success: 1
                };
            })
            .catch(err => {
                logger.error(err);
                throw err;
            });
    }
}