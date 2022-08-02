import config from '../config'
import * as db from './dbHelper'

module.exports = {
    generateDBStructure: async function (logger) {
        await this.generateDB(logger)
        await this.generateTablePushMessage(logger)
        await this.generateTablePushMessageArchive(logger)
        await this.generateTablePushTokens(logger)
        await this.generateTableServerTokens(logger)
    },
    generateDB: async function (logger) {
        const query = `CREATE DATABASE IF NOT EXISTS ${config.deliveryNodeDBName}`
        return new Promise((resolve, reject) => {
            db.dbquery(query, [], function (err, results) {
                if (err) {
                    logger.info(
                        '     ----[🔴] db creation       | Creation Errored'
                    )
                    reject(err)
                } else {
                    if (results.changedRows == 0) {
                        logger.info(
                            '     ----[🟢] db creation       | DB Exists'
                        )
                    } else {
                        logger.info(
                            '     ----[🟠🟢] db creation       | DB Created'
                        )
                    }
                    resolve(true)
                }
            })
        })
    },

    generateTablePushMessage: async function (logger) {
        const query = `CREATE TABLE IF NOT EXISTS pushmsg (
      id int(11) NOT NULL AUTO_INCREMENT,
      loop_id varchar(20) NOT NULL COMMENT 'When feeds breaks messages in batches, this ensures uniqueness',
      tokens json NOT NULL,
      payload json NOT NULL,
      attempts int(11) NOT NULL DEFAULT '0',
      timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY loop_id (loop_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        return new Promise((resolve, reject) => {
            db.query(query, [], function (err, results) {
                if (err) {
                    logger.info('     ----[🔴] pushmsg      | Table Errored')
                    reject(err)
                } else {
                    if (results.changedRows == 0) {
                        logger.info('     ----[🟢] pushmsg      | Table Exists')
                    } else {
                        logger.info(
                            '     ----[🟠🟢] pushmsg      | Table Created'
                        )
                    }
                    resolve(true)
                }
            })
        })
    },
    generateTablePushMessageArchive: async function (logger) {
        const query = `CREATE TABLE IF NOT EXISTS pushmsg_archive (
      id int(11) NOT NULL AUTO_INCREMENT,
      loop_id varchar(20) NOT NULL COMMENT 'When feeds breaks messages in batches, this ensures uniqueness',
      tokens json NOT NULL,
      attempts int(11) NOT NULL DEFAULT '0',
      timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY loop_id (loop_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        return new Promise((resolve, reject) => {
            db.query(query, [], function (err, results) {
                if (err) {
                    logger.info(
                        '     ----[🔴] pushmsg_archive      | Table Errored'
                    )
                    reject(err)
                } else {
                    if (results.changedRows == 0) {
                        logger.info(
                            '     ----[🟢] pushmsg_archive      | Table Exists'
                        )
                    } else {
                        logger.info(
                            '     ----[🟠🟢] pushmsg_archive      | Table Created'
                        )
                    }
                    resolve(true)
                }
            })
        })
    },
    generateTablePushTokens: async function (logger) {
        const query = `CREATE TABLE IF NOT EXISTS pushtokens (
      id int(11) NOT NULL AUTO_INCREMENT,
      wallet varchar(42) NOT NULL,
      device_token varchar(255) NOT NULL,
      platform varchar(10) NOT NULL,
      timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY combined_device_token_wallet (device_token, wallet)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        return new Promise((resolve, reject) => {
            db.query(query, [], function (err, results) {
                if (err) {
                    logger.info('     ----[🔴] pushtokens     | Table Errored')
                    reject(err)
                } else {
                    if (results.changedRows == 0) {
                        logger.info(
                            '     ----[🟢] pushtokens     | Table Exists'
                        )
                    } else {
                        logger.info(
                            '     ----[🟠🟢] pushtokens     | Table Created'
                        )
                    }
                    resolve(true)
                }
            })
        })
    },
    generateTableServerTokens: async function (logger) {
        const query = `CREATE TABLE IF NOT EXISTS servertokens (
      id int(11) NOT NULL AUTO_INCREMENT,
      server_token varchar(80) NOT NULL,
      for_wallet varchar(42) NOT NULL,
      secret varchar(15) NOT NULL,
      timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY for_wallet_2 (for_wallet),
      KEY for_wallet (for_wallet)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`

        return new Promise((resolve, reject) => {
            db.query(query, [], function (err, results) {
                if (err) {
                    logger.info('     ----[🔴] servertokens   | Table Errored')
                    reject(err)
                } else {
                    if (results.changedRows == 0) {
                        logger.info(
                            '     ----[🟢] servertokens   | Table Exists'
                        )
                    } else {
                        logger.info(
                            '     ----[🟠🟢] servertokens   | Table Created'
                        )
                    }
                    resolve(true)
                }
            })
        })
    },
}
