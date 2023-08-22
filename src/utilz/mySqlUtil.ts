import { Logger } from 'winston'
import { OkPacket, Pool } from 'mysql'
import { WinstonUtil } from './winstonUtil'
import { EnvLoader } from './envLoader'

/*
 A sync replacement of db.query callback-y code

   public async sendSpamEvent(payload_id) {
     const query = `select sender from feeds WHERE payload_id=?`
     return await new Promise((resolve, reject) => {
           db.query(query, [payload_id], function (err, results) {
             if (err) {
               logger.error(err)
               reject(err)
             } else {
               if (results.length > 0) {
                 const sender = results[0].sender
                 const feed = {
                   payload_id: payload_id,
                   sender: sender,
                 }
                 resolve(feed)
               } else {
                 resolve({})
               }
             }
           })
         }).catch((err) => {
           logger.error(err)
           reject(err)
         })
       }
    ).catch((err) => {
       logger.error(err)
       reject(err)
     })
   }

 Would look like

 let rows = await MySqlUtil.query<{channel: string, alias: string, subscriber: string, timestamp: string, is_currently_subscribed: string}>
 (`select channel, alias, subscriber, timestamp, is_currently_subscribed
   from subscribers
   where (${channelDbField} = ? AND subscriber = ?)`,
   cmd.message.channel, subscriberAddr);

 */
export class MySqlUtil {
  private static log: Logger = WinstonUtil.newLog('mysql')
  static logSql = false
  static pool: Pool

  public static init(pool: Pool) {
    MySqlUtil.pool = pool
    if (!MySqlUtil.logSql && EnvLoader.getPropertyAsBool('LOG_SQL_STATEMENTS')) {
      pool.on('connection', function (connection) {
        connection.on('enqueue', function (sequence) {
          // if (sequence instanceof mysql.Sequence.Query) {
          if ('Query' === sequence.constructor.name) {
            MySqlUtil.log.debug(sequence.sql)
          }
        })
      })
      MySqlUtil.logSql = true
    }
    this.log.info('sql statement logging is enabled')
  }

  public static async queryOneValueOrDefault<V>(
    query: string,
    defaultValue: V,
    ...sqlArgs: any[]
  ): Promise<V | null> {
    const result = await this.queryOneRow(query, ...sqlArgs)
    if (result == null) {
      return defaultValue
    }
    const firstPropertyName = Object.entries(result)[0][0]
    if (firstPropertyName == null) {
      return defaultValue
    }
    const resultValue = result[firstPropertyName]
    if (resultValue == null) {
      return defaultValue
    }
    return resultValue
  }

  public static async queryOneValue<V>(query: string, ...sqlArgs: any[]): Promise<V | null> {
    return await this.queryOneValueOrDefault(query, null, ...sqlArgs)
  }

  public static async queryOneRow<R>(query: string, ...sqlArgs: any[]): Promise<R | null> {
    const result = await this.queryArr<R>(query, ...sqlArgs)
    if (result.length != 1) {
      return null
    }
    return result[0]
  }

  public static async queryAnyArr(query: string, ...sqlArgs: any[]): Promise<any[]> {
    return await this.queryArr<any>(query, ...sqlArgs)
  }

  public static async update(query: string, ...sqlArgs: any[]): Promise<OkPacket> {
    const res: any = await this.queryArr<void>(query, ...sqlArgs)
    return <OkPacket>res
  }

  public static async insert(query: string, ...sqlArgs: any[]): Promise<OkPacket> {
    const res: any = await this.queryArr(query, ...sqlArgs)
    return <OkPacket>res
  }

  public static async queryArr<R>(query: string, ...sqlArgs: any[]): Promise<R[]> {
    return new Promise<[R]>((resolve, reject) => {
      MySqlUtil.pool.getConnection(function (err, connection) {
        if (err) {
          MySqlUtil.log.error(err)
          reject(err)
          return
        }
        connection.query(query, sqlArgs, function (err, results) {
          connection.release() // always put connection back in pool after last query
          if (err) {
            MySqlUtil.log.error(err)
            reject(err)
            return
          }
          resolve(results)
          return
        })
      })
    })
  }
}
