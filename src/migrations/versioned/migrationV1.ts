// Do Versioning
// Function
// upgrade() -> Runs for upgrading version
// downgrade() -> Runs for downgrading version
// Use this template upper functions to make this work well

// Version 1 is genesis and should be called
import { Container } from 'typedi'
import * as db from "../../database/dbHelper"
export default async (upgrade) => {
    const logger = Container.get('logger')

    const crashWithError = (err) => {
        logger.error(
            `🔥 Error executing [${
                upgrade ? 'Upgrade' : 'Downgrade'
            }] [${global.utils.getCallerFile()}] | err: ${err}`
        )
        process.exit(1)
    }

    const upgradeScript = async () => {
        const query1 =
            'ALTER TABLE `pushtokens` ADD `apn_token` text DEFAULT NULL;'

        // const batchedQuery = `${query1} ${query2} ${query3} ${query4}`; // CAN'T DO BEGIN END BLOCK AS ALTER IS NOT ALLOWED
        logger.info(`Executing Queries...`)

        return new Promise((resolve, reject) => {
            db.query(query1, [], function (err) {
                if (err) {
                    crashWithError(err)
                    reject(err)
                } else {
                    logger.info('Upgraded to version 3')
                    resolve(true)
                }
            })
        })
    }

    const downgradeScript = async () => {
        crashWithError(
            "Downgrading... Version 1 is genesis, can't use, aborting!"
        )
    }

    upgrade ? await upgradeScript() : await downgradeScript()
}
