import { Router } from 'express'
import pushtokens from './routes/pushtokens'
import migrations from './routes/migrations'
import logger from '../loaders/logger'

export default () => {
    const app = Router()

    pushtokens(app)
    migrations(app)

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
