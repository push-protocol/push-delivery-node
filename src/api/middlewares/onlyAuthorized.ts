import { Container } from 'typedi'

var db = require('../../database/dbHelper')
var crypto = require('../../helpers/cryptoHelper')
import logger from '../../loaders/logger'

const onlyAuthorized = async (req, res, next, opToValidate) => {
    const query =
        'SELECT for_wallet, secret FROM servertokens WHERE server_token=? LIMIT 1'
    const server_token_res = async (query, server_token) => {
        return new Promise((resolve, reject) => {
            db.query(query, [server_token], function (err, results) {
                if (err) {
                    logger.error(err)
                    return reject(err)
                } else {
                    logger.info('Wallet retrieved for checking: %o', results)
                    return resolve({ success: 1, data: results[0] })
                }
            })
        })
    }

    try {
        const response = await server_token_res(query, req.body.server_token)

        if (response && response.success) {
            // Check if token exists
            const data = response.data
            logger.debug('Checking Response')

            if (data) {
                const secret = data.secret
                logger.debug(
                    'Secret retrieved: ' + secret + ' Decrypting op_enc ...'
                )

                const retrievedOP = crypto.decryptWithAES(
                    req.body.op_aes,
                    secret
                )
                logger.debug('Decrypted Operation: [' + retrievedOP + ']')

                if (retrievedOP === opToValidate) {
                    req.body.device_token_decrypted = crypto.decryptWithAES(
                        req.body.device_token_aes,
                        secret
                    )
                    req.body.platform_decrypted = crypto.decryptWithAES(
                        req.body.platform_aes,
                        secret
                    )
                    req.body.wallet = data.for_wallet
                }
            } else {
                return res
                    .status(401)
                    .json({ info: 'Token expired or never existed' })
            }

            return next()
        } else {
            return res
                .sendStatus(500)
                .json({ info: 'Server behaved unexpectedly' })
        }

        return next()
    } catch (e) {
        throw e
        return next(e)
    }
}

export default onlyAuthorized
