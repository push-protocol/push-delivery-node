import { Router, Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import middlewares from '../middlewares'
import { celebrate, Joi } from 'celebrate'
import logger from '../../loaders/logger'
import PushTokensTableMigration from '../../migrations/pushtokensTableMigration'

const route = Router()

export default (app: Router) => {
    app.use('/migrations', route)
    route.post(
        '/pushtokens_table_from_push_node_to_delivery_node',
        celebrate({
            body: Joi.object({}),
        }),
        middlewares.onlyLocalhost,
        async (req: Request, res: Response, next: NextFunction) => {
            logger.info(
                'Calling /migrations/pushtokens_table_from_push_node_to_delivery_node'
            )
            try {
                const pushTokensTableMigration = Container.get(
                    PushTokensTableMigration
                )
                pushTokensTableMigration.copyPushTokensTable()
                return res.status(201).json({
                    status: 'started',
                })
            } catch (e) {
                logger.error('🔥 error: %o', e)
                return next(e)
            }
        }
    )
}
