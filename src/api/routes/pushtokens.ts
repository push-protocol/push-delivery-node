import { Router, Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import PushTokensService from '../../services/pushTokensService'
import AuthService from '../../services/authService'
import middlewares from '../middlewares'
import { celebrate, Joi } from 'celebrate'
import logger from '../../loaders/logger'

const route = Router()

export default (app: Router) => {
    app.use('/pushtokens', route)

    // Register Device Token
    route.post(
        '/register_no_auth',
        celebrate({
            body: Joi.object({
                op: Joi.string().required(),
                wallet: Joi.string().required(),
                device_token: Joi.string().required(),
                platform: Joi.string().required(),
            }),
        }),
        async (req, res, next) => {
            await middlewares.onlyAuthorizedSimple(req, res, next, 'register')
        },
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug(
                'Calling /pushtokens/register_no_auth endpoint with body: %o',
                req.body
            )
            try {
                const pushInstance = Container.get(PushTokensService)
                const { success } = await pushInstance.registerDevice(
                    req.body.wallet.toLowerCase(),
                    req.body.device_token,
                    req.body.platform
                )

                return res.status(201).json({ success })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )

    route.post(
        '/deregister_wallet_token',
        celebrate({
            body: Joi.object({
                message: {
                    walletAddress: Joi.string().required(),
                    deviceToken: Joi.string().required(),
                },
                op: Joi.string().required(),
            }),
        }),
        async (req, res, next) => {
            await middlewares.onlyAuthorizedSimple(req, res, next, 'write')
        },
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug(
                'Calling /pushtokens/unregister_wallet endpoint with body: %o',
                JSON.stringify(req.body)
            )
            try {
                const pushInstance = Container.get(PushTokensService)
                const { success } = await pushInstance.deleteWalletAndDevice(
                    req.body.message.walletAddress,
                    req.body.message.deviceToken
                )
                return res.status(200).json({
                    success,
                })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )

    route.post(
        '/authtoken',
        celebrate({
            body: Joi.object({
                public_key: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            const Logger = Container.get('logger')
            logger.debug(
                'Calling /pushtokens/authtoken endpoint with body: %o',
                req.body
            )
            try {
                const authInstance = Container.get(AuthService)
                const { success, server_token, secret_enc } =
                    await authInstance.generateServerToken(req.body.public_key)

                return res.status(201).json({
                    success,
                    server_token,
                    secret_enc,
                })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )
}
