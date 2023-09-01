import { Container } from 'typedi'
import config from '../config'
import fs from 'fs'

import {
    getProtocolMetaValues,
    updateProtocolMetaValues,
} from './protocolMetaHelper'
import { Logger } from 'winston'

// MIGRATION HELPERS
const execMigrationVersion = async (folderPath, version, upgrade, logger) => {
    return await new Promise(async (resolve) => {
        const suffix = process.env.NODE_ENV === 'production' ? 'js' : 'ts'
        const absPath = `${folderPath}/migrationV${version}.${suffix}`
        const relativePath = `../migrationV${version}.${suffix}`

        if (fs.existsSync(absPath)) {
            const migrateScript = await import(absPath)
            await migrateScript.default(upgrade)
        } else {
            logger.error(
                `${relativePath} Not Found... can't proceed without file`
            )
            process.exit(1)
        }

        resolve(true)
    })
}

const doMigration = async (from, to, upgrade, logger) => {
    const migrationFolderPath = `${__dirname}/../migrations/versioned`

    const total = to - from

    return await new Promise(async (resolve, reject) => {
        let counter = 0

        // handle edge case of genesis 1
        while (from != to) {
            upgrade ? from++ : to--
            await execMigrationVersion(
                migrationFolderPath,
                upgrade ? from : to + 1,
                upgrade,
                logger
            )
                .then(async () => {
                    counter++

                    await updateProtocolMetaValues([
                        {
                            type: `migrationVersion`,
                            value: from.toString(),
                        },
                    ], logger).catch((err) => {
                        logger.error(
                            'Error while updating migration version doMigration() | MigrationHelper with err: %o',
                            err
                        )
                        reject(err)
                    })
                })
                .catch((err) => {
                    logger.error(
                        'Error while trying to execute migrating version with err: %o',
                        err
                    )
                    reject(err)
                })

            await new Promise((r) => setTimeout(r, 300))
        }

        resolve(true)
    })
}

// START MIGRATION SCRIPT
export const startMigration = async (logger) => {
    // const logger: Logger = Container.get('logger')

    const success = true
    return await new Promise(async (resolve, reject) => {
        const offset = 23

        // Turn off normal logger

        const forTypes = ['migrationVersion']
        let currentMigVersion = config.migrationVersion
        const configMigVersion = config.migrationVersion

        await getProtocolMetaValues(forTypes, logger)
            .then((protocolMeta) => {
                currentMigVersion = parseInt(protocolMeta.migrationVersion)
            })
            .catch((err) => {
                logger.error('🔥 error in retriving migrationVersion: %o', err)
                process.exit(1)
            })

        if (currentMigVersion == configMigVersion) {
        } else {
            // Start Migration Script
            const upgrade = currentMigVersion < configMigVersion ? true : false
            const from = upgrade ? currentMigVersion : configMigVersion
            const to = upgrade ? configMigVersion : currentMigVersion
            logger.info(`Doing migration from: ${from} to: ${to}`)
            await doMigration(from, to, upgrade, logger).catch((err) => {
                logger.error(
                    'Error while executing doMigration() | MigrationHelper with err: %o',
                    err
                )
                reject(err)
                process.exit(0)
            })
        }

        resolve(true)
    })
}
