import { Router } from 'express'
import pushtokens from './routes/pushtokens'
import logger from '../loaders/logger'
import {ExpressUtil} from "../utilz/expressUtil";
import {EnvLoader} from "../utilz/envLoader";

export default () => {
    const app = Router();
    if (EnvLoader.getPropertyAsBool('VALIDATOR_HTTP_LOG')) {
      app.use(ExpressUtil.handle)
    }
    pushtokens(app)
    app.use((req, res, next) => {
        res.setHeader('Content-Type', 'text/html')
        res.send(`
             <html>
                <body>
                    <h1>This is an invalid API path.
                    </h1>
                </body>
            </html>
            `)
    })

    app.use((error, req, res, next) => {
        logger.error(error.message)
        res.statusCode = error.statusCode
        res.json({
            message: error.message,
        })
    })
    return app
}
