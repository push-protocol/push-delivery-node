import { Service, Inject } from 'typedi'
import logger from '../loaders/logger'
var db = require('../database/dbHelper')

@Service()
export default class PushTokensService {
    public async registerDevice(
        wallet: string,
        device_token_decrypted: string,
        platform_decrypted: string
    ) {
        logger.debug('Registering device')

        const query =
            'INSERT IGNORE INTO pushtokens (wallet, device_token, platform) VALUES (?, ?, ?)'

        const insert_push_token = async (query, logger) => {
            return new Promise((resolve, reject) => {
                db.query(
                    query,
                    [wallet, device_token_decrypted, platform_decrypted],
                    function (err, results) {
                        if (err) {
                            logger.error(err)
                            return reject(err)
                        } else {
                            logger.debug(results)
                            console.log(results)
                            return resolve({ success: 1, data: results })
                        }
                    }
                )
            })
        }

        try {
            const response = await insert_push_token(query, logger)
            if (response.success) {
                return { success: 1 }
            }
        } catch (err) {
            logger.error(err)
            throw err
        }
    }

    async getDeviceTokens(wallets: any[]) {
        logger.debug('Trying to convert wallets to device tokens: %o', wallets)

        const queryClause = "('" + wallets.join("','") + "')"
        const query =
            'SELECT wallet, device_token from pushtokens WHERE wallet IN ' +
            queryClause

        return await new Promise((resolve, reject) => {
            db.query(query, function (err, results) {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(results)
                }
            })
        })
            .then((response) => {
                logger.info('✅ Completed getDeviceTokens(): %o', response)

                let devices = []
                for (var i in response) {
                    devices.push(response[i]['device_token'])
                }

                return { success: 1, devices: devices }
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }

    public async deleteDeviceTokens(tokens: any[]) {
        logger.debug('Trying to delete device tokens: %o', tokens)

        const queryClause = "('" + tokens.join("','") + "')"
        const query =
            'DELETE from pushtokens WHERE device_token IN ' + queryClause

        return await new Promise((resolve, reject) => {
            db.query(query, function (err, results) {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(results)
                }
            })
        })
            .then((response) => {
                logger.info('✅ Completed deleteDeviceTokens(): %o', response)
                return { success: 1 }
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }

    public async deleteWalletAndDevice(wallet: string, device_token: string) {
        logger.debug(
            'Trying to delete wallet: %o registered on the device: %o',
            wallet,
            device_token
        )
        const query = 'DELETE from pushtokens WHERE wallet=? AND device_token=?'
        return await new Promise((resolve, reject) => {
            db.query(query, [wallet, device_token], function (err, results) {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(results)
                }
            })
        })
            .then((response) => {
                logger.info(
                    'Completed deletion of wallet: %o registered on the device: %o. Response: %o',
                    wallet,
                    device_token,
                    JSON.stringify(response)
                )
                return {
                    success: 1,
                }
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }
}
