import { NextFunction, Request, Response } from 'express'
import { WinstonUtil } from './winstonUtil'

export class ExpressUtil {
  static log = WinstonUtil.newLog('http')

  static handle(req: Request, res: Response, next: NextFunction) {
    ExpressUtil.log.debug(
      `>> Calling %s %s %o with body: %o`,
      req.method,
      req.url,
      req.params,
      req.body
    )
    res.on('finish', function () {
      ExpressUtil.log.debug(`<< Reply ${res.statusCode} with body: %s`, res.statusMessage)
    })
    next()
  }
}
