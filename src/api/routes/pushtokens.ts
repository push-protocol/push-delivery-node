import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express'
import {
    Container
} from 'typedi'
import PushTokensService from '../../services/pushTokensService'
import {
    celebrate,
    Joi,
    errors
} from 'celebrate';
import logger from '../../loaders/logger'
var utils = require('../../helpers/utilsHelper')
import config from '../../config';

const route = Router()

export default (app: Router) => {
    app.use(`/${config.api.version}/pushtokens`, route);
    app.use(errors());

    // Register Device Token
    route.post(
        "/register",
        celebrate({
            body: Joi.object({
                wallet: Joi.string().required(),
                device_token: Joi.string().required(),
                platform: Joi.string().required()
            })
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug(
                "Calling v1/pushtokens/register endpoint with body: %o",
                req.body
            );
            try {
                const pushInstance = Container.get(PushTokensService);
                const {
                    result: wallet,
                    err
                } = utils.convertCaipToAddress(req.body.wallet);
                if (wallet && !err) {
                    const {
                        success
                    } = await pushInstance.registerDevice(
                        wallet,
                        req.body.device_token,
                        req.body.platform
                    );
                    return res.status(204).json();
                } else {
                    return next(err);
                }
            } catch (e) {
                logger.error(
                    "🔥 Error while calling v1/pushtokens/register endpoint: %o",
                    e
                );
                return next(e);
            }
        }
    );

    route.delete(
        "/",
        celebrate({
            body: Joi.object({
                walletAddress: Joi.string().required(),
                deviceToken: Joi.string().required()
            })
        }),
        async (req: Request, res: Response, next: NextFunction) => {
            logger.debug(
                "Calling v1/pushtokens endpoint with body: %o",
                JSON.stringify(req.body)
            );
            try {
                const pushInstance = Container.get(PushTokensService);
                const {
                    result: walletAddress,
                    err
                } = utils.convertCaipToAddress(
                    req.body.walletAddress
                );
                if (walletAddress && !err) {
                    const {
                        success
                    } = await pushInstance.deleteWalletAndDevice(
                        walletAddress,
                        req.body.device_token
                    );
                    return res.status(204).json();
                } else {
                    return next(err);
                }
            } catch (e) {
                logger.error("🔥 error: %o", e);
                return next(e);
            }
        }
    );
}