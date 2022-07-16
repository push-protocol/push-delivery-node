import { Router, Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import AuthService from '../../services/authService'
import PushTokensService from '../../services/pushTokensService'
import middlewares from '../middlewares'
import { celebrate, Joi } from 'celebrate'
import logger from '../../loaders/logger'

const route = Router()

export default (app: Router) => {
    app.use('/pushtokens', route)

    route.post(
        '/authtoken',
        celebrate({
            body: Joi.object({
                public_key: Joi.string().required(),
            }),
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug(
                'Calling /pushtokens/authtoken endpoint with body: %o',
                req.body
            )
            try {
                const authInstance = Container.get(AuthService)
                const { success, server_token, secret_enc } =
                    await authInstance.generateServerToken(req.body.public_key)
                return res
                    .status(201)
                    .json({ success, server_token, secret_enc })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )

    // To get all subscriber from a channel
    route.post(
        '/get_device_tokens',
        celebrate({
            body: Joi.object({
                wallets: Joi.array().required(),
            }),
        }),
        middlewares.onlyLocalhost,
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug(
                'Calling /pushtokens/get_devices endpoint with body: %o',
                req.body
            )

            try {
                const pushInstance = Container.get(PushTokensService)
                const { success, devices } = await pushInstance.getDeviceTokens(
                    req.body.wallets
                )

                return res.status(201).json({ success, devices })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )

    // Register Device Token
    route.post(
        '/register',
        celebrate({
            body: Joi.object({
                server_token: Joi.string().required(),
                op_aes: Joi.string().required(),
                device_token_aes: Joi.string().required(),
                platform_aes: Joi.string().required(),
            }),
        }),
        async (req, res, next) => {
            await middlewares.onlyAuthorized(req, res, next, 'register')
        },
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug(
                'Calling /pushtokens/register endpoint with body: %o',
                req.body
            )
            try {
                const pushInstance = Container.get(PushTokensService)
                const { success } = await pushInstance.registerDevice(
                    req.body.wallet,
                    req.body.device_token_decrypted,
                    req.body.platform_decrypted
                )

                return res.status(201).json({ success })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )

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

    // Delete Device Tokens
    route.post(
        '/delete_device_tokens',
        celebrate({
            body: Joi.object({
                tokens: Joi.array().required(),
            }),
        }),
        middlewares.onlyLocalhost,
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug(
                'Calling /pushtokens/delete_device_tokens endpoint with body: %o',
                req.body
            )
            try {
                const pushInstance = Container.get(PushTokensService)

                const { success } = await pushInstance.deleteDeviceTokens(
                    req.body.tokens
                )
                return res.status(201).json({ success })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )

    route.post(
        '/delete_expired',
        middlewares.onlyLocalhost,
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug('Calling /pushtokens/delete_expired endpoint')
            try {
                const authInstance = Container.get(AuthService)
                const { success } =
                    await authInstance.deleteExpiredServerTokens()
                return res.status(201).json({ success })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )

    route.post(
        '/deregister_wallet_offchain',
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
}
