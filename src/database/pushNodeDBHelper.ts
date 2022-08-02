import config from '../config'
import logger from '../loaders/logger'

var mysql = require('mysql')
// --- This will be deleted once the migration is done --- //
var dbpool = mysql.createPool({
    connectionLimit: 1,
    host: config.pushNodeDBHost,
    user: config.pushNodeDBUser,
    password: config.pushNodeDBPass,
})

var pool = mysql.createPool({
    connectionLimit: 10,
    host: config.pushNodeDBHost,
    user: config.pushNodeDBUser,
    password: config.pushNodeDBPass,
    database: config.pushNodeDBName,
})

module.exports = {
    pool,
    dbquery: function () {
        var sql_args = []
        var args = []
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        var callback = args[args.length - 1] //last arg is callback
        dbpool.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                return callback(err)
            }

            if (args.length > 2) {
                sql_args = args[1]
            }

            connection.query(args[0], sql_args, function (err, results) {
                connection.release() // always put connection back in pool after last query

                if (err) {
                    logger.error(err)
                    return callback(err)
                }

                callback(null, results)
            })
        })
    },
    query: function () {
        var sql_args = []
        var args = []
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        var callback = args[args.length - 1] //last arg is callback
        pool.getConnection(function (err, connection) {
            if (err) {
                logger.error(err)
                return callback(err)
            }

            if (args.length > 2) {
                sql_args = args[1]
            }

            connection.query(args[0], sql_args, function (err, results) {
                connection.release() // always put connection back in pool after last query
                if (err) {
                    logger.error(err)
                    return callback(err)
                }
                callback(null, results)
            })
        })
    },
}

export function dbquery(
    query: string,
    arg1: undefined[],
    arg2: (err: any, results: any) => void
) {
    throw new Error('Function not implemented.')
}
export function query(
    query: string,
    arg1: undefined[],
    arg2: (err: any, results: any) => void
) {
    throw new Error('Function not implemented.')
}
