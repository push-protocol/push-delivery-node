import { Service } from 'typedi'

var db = require('../database/dbHelper')
var utils = require('../helpers/utilsHelper')
var crypto = require('../helpers/cryptoHelper')
import logger from '../loaders/logger'

@Service()
export default class AuthService {
    public async generateServerToken(forPublicKey: string) {
        const server_token = utils.generateRandomWord(40, true)
        const secret = utils.generateRandomWord(15, false)
        const secret_enc = await crypto.encryptWithECIES(secret, forPublicKey)
        const wallet = crypto.getWalletFromUncompressedPublicKey(forPublicKey)

        const query =
            'INSERT INTO servertokens (server_token, for_wallet, secret) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE server_token=VALUES(server_token), secret=VALUES(secret);'

        return await new Promise((resolve, reject) => {
            db.query(
                query,
                [server_token, wallet, secret],
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
                logger.info('✅ Completed generateServerToken()')
                return {
                    success: 1,
                    server_token: server_token,
                    secret_enc: secret_enc,
                }
            })
            .catch((err) => {
                logger.error(err)
                throw err
            })
    }

    public async deleteExpiredServerTokens() {
        const timestamp = new Date().getTime() / 1000 - 60 * 10 // milliseconds * secs * mins = 10 mins
        logger.debug('Deleting Server Tokens before ' + timestamp)

        const query =
            'DELETE FROM servertokens WHERE UNIX_TIMESTAMP(timestamp)<?'

        const delete_server_tokens = async (query, logger) => {
            return new Promise((resolve, reject) => {
                db.query(query, timestamp, function (err, results) {
                    if (err) {
                        logger.error(err)
                        return reject(err)
                    } else {
                        return resolve({ success: 1, data: results })
                    }
                })
            })
        }
        try {
            const response = await delete_server_tokens(query, logger)
            if (response.success) {
                logger.info('✅ Completed deleteExpiredServerTokens()')
                return { success: 1 }
            }
        } catch (err) {
            logger.error(err)
            throw err
        }
    }
}
