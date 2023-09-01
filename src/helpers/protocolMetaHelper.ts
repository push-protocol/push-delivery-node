import * as db from '../database/dbHelper'
import { Container } from 'typedi'
import { Logger } from 'winston'

// const logger: Logger = Container.get('logger')
export const getProtocolMetaValues = async (forTypes, logger) => {
    return await new Promise((resolve, reject) => {
        let query = `SELECT * FROM deliverynode_meta WHERE `
        for (let i = 0; i < forTypes.length; i++) {
            query += ` type = "${forTypes[i]}" `
        }

        db.query(query, [], function (err, results) {
            if (err) {
                logger.error(
                    `Error in getProtocolMetaValues() | db.query with ${err}`
                )
                reject(err)
            } else {
                const parsedResArray = JSON.parse(JSON.stringify(results))
                const parsedResults = parsedResArray.reduce(
                    (obj, item) =>
                        Object.assign(obj, { [item.type]: item.value }),
                    {}
                )

                logger.info(
                    `Completed getProtocolMeta() - ${
                        Object.keys(parsedResults).length
                    } matches`
                )
                resolve(parsedResults)
            }
        })
    })
}

export const updateProtocolMetaValues = async (updatedMeta, logger) => {
    return await new Promise(async (resolve, reject) => {
        if (updatedMeta.length == 0) {
            const err = 'updatedMeta array is empty'
            logger.error(`Error in updateProtocolMetaValues(): ${err}`)
            reject(`Error in updateProtocolMetaValues() with err: ${err}`)
        }

        let rowsQuery = ``
        for (let i = 0; i < updatedMeta.length; i++) {
            rowsQuery += `WHEN type="${updatedMeta[i].type}" THEN "${updatedMeta[i].value}"`

            if (i < updatedMeta.length - 1) {
                rowsQuery += ' '
            }
        }

        rowsQuery += ` ELSE value`

        let whereClause = ''
        updatedMeta.forEach((element, index) => {
            if (index < updatedMeta.length - 1) {
                whereClause += `"${element.type}", ${whereClause}`
            } else {
                whereClause += `"${element.type}"`
            }
        })

        const query = `UPDATE deliverynode_meta SET value=CASE ${rowsQuery} END WHERE type IN (${whereClause});`
        logger.info(
            `Retrieving data from updateProtocolMetaValues() - Updating %d Values - %s`,
            updatedMeta.length,
            updatedMeta.join(', ')
        )

        // await new Promise(r => setTimeout(r, 15000));
        db.query(query, [], function (err, results) {
            if (err) {
                logger.error(
                    `Error in updateProtocolMetaValues() | db.query with ${err}`
                )
                reject(err)
            } else {
                logger.info(`Completed updateProtocolMetaValues()`)
                resolve(results)
            }
        })
    })
}
