import { Service, Inject } from 'typedi'
import config from '../config'
import logger from '../loaders/logger'

var admin = require('firebase-admin')

@Service()
export default class FCMService {
    constructor() {
        var serviceAccount = require('../../epns-firebase-adminsdk.json')
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: config.fcmDatabaseURL,
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

    public async sendMessageToSingleRecipient(token, payload) {
        payload.token = token
        return admin
            .messaging()
            .send(payload)
            .then((response) => {
                logger.info('Successfully sent message: %o', response)
                return response
            })
            .catch((error) => {
                logger.error('Error sending message: %o', error)
                return error
            })
    }
}
