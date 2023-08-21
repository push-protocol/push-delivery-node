import { Format, TransformableInfo } from 'logform'
import { DateTime } from 'ts-luxon'
import winston from 'winston'
import config from '../config'
import { consoleTransport, customLevels, jsonLogTransport } from '../loaders/logger'
import StrUtil from './strUtil'
import { EnvLoader } from './envLoader'

/*
Example usage:
public log: Logger = WinstonUtil.newLog(ValidatorNode);

This is a hacky class which goal is
1. to create debug.log and error.log with custom text format (format2 in debugFileTransport and errorFileTransport)
2. make as little merge confligs with loaders/logger as possible (format1 in consoleTransport and jsonTransport)
3. provide newLog(name) which allows custom formatting of it's messages in debug.log and error.log

Details
-------
We combine
winston logger + className + dynamic logger from loaders/logger
to work together
and add 2 new targets
debugFileTransport -> $LOG_DIR/debug.log
errorFileTransport -> $LOG_DIR/error.log

How is this all wired

All logs come into
loaders/logger.ts LoggerInstance
it formats in
format1:
18:08:06 info    Express loaded
-> consoleTransport (takes format1) (renders as format1)
-> jsonLogTransport (takes format1) (renders as format1)
-> dynamicLoggingTransport (these are progressbars, it toggles on/off console output)
-> debugFileTransport (takes format1) (renders as format2)
-> errorFileTransport (takes format1) (renders as format2)

Some logs come into newLogger(className)
it formats in format1 + adds className meta field
format1:
18:08:06 info    Express loaded
-> consoleTransport (takes format1) (renders as format1)
-> jsonLogTransport (takes format1) (renders as format1)
-> debugFileTransport (takes format1) (renders as format2 with className)
-> errorFileTransport (takes format1) (renders as format2 with className)

format2:
I 230811 174624 Got alias List (SendMessage)

format2 with class name:
I 230811 174624 [MyClass] Got alias List (SendMessage)

*/
export class WinstonUtil {
  private static readonly CLASS_NAME_LENGTH = 23

  static loggerMap: Map<string, winston.Logger> = new Map()

  /*
  { "message": "Checking Node Version", "level": "info", "timestamp": "230809 180338", className?: "myClass"}
   */
  public static renderFormat2(info: TransformableInfo) {
    const { timestamp, level, message, meta } = info
    const levelFirstChar = level == null ? '' : level.toUpperCase()[0]
    const date = DateTime.now()
    const formattedDate = date.toFormat('yyMMdd HHmmss')
    const className = info.className
    let formattedClassName: string
    if (StrUtil.isEmpty(className)) {
      formattedClassName = ' '
    } else {
      formattedClassName = (' [' + className.substring(0, this.CLASS_NAME_LENGTH) + '] ').padEnd(
        this.CLASS_NAME_LENGTH + 4
      )
    }
    const metaAsString = meta == null ? '' : meta
    return `${levelFirstChar} ${formattedDate}${formattedClassName}${message} ${metaAsString}`
  }

  static createFormat1WhichSetsClassName(className: string | null): Format {
    return winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
      winston.format.printf((info) => {
        info['className'] = className
        return ''
      })
    )
  }

  static createFormat2WhichRendersClassName(): Format {
    return winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.printf((info) => {
        return WinstonUtil.renderFormat2(info)
      })
    )
  }

  public static debugFileTransport = new winston.transports.File({
    level: 'debug',
    filename: `${EnvLoader.getPropertyOrFail('LOG_DIR')}/debug.log`,
    handleExceptions: true,
    json: false,
    maxsize: 5242880,
    maxFiles: 5,
    colorize: false,
    tailable: true,
    format: WinstonUtil.createFormat2WhichRendersClassName()
  })

  public static errorFileTransport = new winston.transports.File({
    level: 'error',
    filename: `${EnvLoader.getPropertyOrFail('LOG_DIR')}/error.log`,
    handleExceptions: true,
    json: false,
    maxsize: 5242880,
    maxFiles: 5,
    colorize: false,
    tailable: true,
    format: WinstonUtil.createFormat2WhichRendersClassName()
  })

  public static newLog(classNameOrClass: string | { name: string }): winston.Logger {
    let loggerName = null
    if (typeof classNameOrClass === 'string') {
      loggerName = classNameOrClass
    } else if (!StrUtil.isEmpty(classNameOrClass?.name)) {
      loggerName = classNameOrClass?.name
    }
    loggerName =
      loggerName == null ? null : loggerName.toString().substring(0, this.CLASS_NAME_LENGTH)
    let loggerObj = WinstonUtil.loggerMap.get(loggerName)
    if (loggerObj != null) {
      return loggerObj
    }
    loggerObj = winston.createLogger({
      level: config.logs.level,
      levels: customLevels.levels, // from loaders/logger
      format: this.createFormat1WhichSetsClassName(loggerName), // puts a class name into the log object + formats in loaders/logger format
      transports: [
        consoleTransport,
        jsonLogTransport,
        this.debugFileTransport, // formats a class name from the log object
        this.errorFileTransport // formats a class name from the log object
      ]
    })
    WinstonUtil.loggerMap.set(loggerName, loggerObj)
    return loggerObj
  }
}
