import { Service, Inject } from 'typedi'
import config from '../config'
import * as apn from 'apn'
import logger from '../loaders/logger'
var admin = require('firebase-admin')
var utils = require('../helpers/utilsHelper')
const filePath = require('path').resolve(__dirname, '../../key.p8')
const fs = require('fs')
const key = fs.readFileSync(filePath, 'utf8')
const apnOptions = {
    token: {
        key: key,
        keyId: process.env.DELIVERY_NODE_APN_KEY_ID,
        teamId: process.env.DELIVERY_NODE_APN_TEAM_ID,
    },
    production: true,
}
@Service()
export default class FCMService {
    constructor() {
        var serviceAccount = require('../../firebase-adminsdk.json')
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        })
    }

    public async sendMessageToMultipleRecipient(tokens, payload) {
        payload.tokens = tokens
        return admin
            .messaging()
            .sendMulticast(payload)
            .then((response) => {
                logger.info('Successfully sent message: %o', response)
                return response
            })
            .catch((error) => {
                logger.error('Error sending message: %o', error)
                return error
            })
    }

    public async sendVoIPNotificationToIOS(token, payload) {
        const note = utils.generateIOSVideoCallPayloadFromFeed(payload)
     
        var apnProvider = new apn.Provider(apnOptions)
        return apnProvider
            .send(note, token)
            .then((result: any) => {
                if (result)
                    if (!result.failed) {
                        logger.info('RESULT', result)
                        return result
                    } else {
                        throw result.failed[0].response
                    }
            })
            .catch((error) => {
                logger.error('Error sending message: %o', error)
                return error
            })
    }
}
