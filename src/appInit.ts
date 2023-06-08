import 'reflect-metadata' // We need this in order to use @Decorators
import express from 'express'
import chalk from 'chalk'
import {Container} from "typedi";
import logger from "./loaders/logger";
import {ValidatorContractState} from "./services/messaging/validatorContractState";
import DeliveryNode from "./services/messaging/DeliveryNode";

let server = null

async function startServer(logLevel: string = null, testMode: boolean = false) {
    if (logLevel) {
        const changeLogLevel = (await require('./config/index')).changeLogLevel
        changeLogLevel(logLevel)
    }

    // Continue Loading normally
    const config = require('./config/index').default
    logLevel = logLevel || config.logs.level

    // ONLY TIME CONSOLE IS USED
    console.log(
        chalk.bold.inverse('RUNNING WITH LOG LEVEL '),
        chalk.bold.blue.inverse(`  ${logLevel}  `),
        chalk.bold.green.inverse(`  ${config.deliveryNodesNet}  `)
    )

    // Load logger
    const Logger = (await require('./loaders/logger')).default

    // CHECK IF THE ENVIROMENT LOADED IS RIGHT
    if (
        config.deliveryNodesNet !== 'PROD' &&
        config.deliveryNodesNet !== 'STAGING' &&
        config.deliveryNodesNet !== 'DEV'
    ) {
        Logger.error(
            "Can't continue, PUSH_NODES_NET needs to be set in .env to either PROD, STAGING or DEV"
        )
        process.exit(1)
    }
    Container.set("logger", logger);

    let dn = Container.get(DeliveryNode);
    dn.postConstruct();


    // Check environment setup first
    Logger.info('✌️   Verifying ENV')
    const EnvVerifierLoader = (await require('./loaders/envVerifier')).default
    await EnvVerifierLoader()
    Logger.info('✔️   ENV Verified / Generated and Loaded!')

    // load app
    const app = express()
    server = require('http').createServer(app)

    /**
     * A little hack here
     * Import/Export can only be used in 'top-level code'
     * Well, at least in node 10 without babel and at the time of writing
     * So we are using good old require.
     **/
    await require('./loaders').default({
        expressApp: app,
        server: server,
        testMode: testMode,
    })

    server.listen(config.port, (err) => {
        if (err) {
            Logger.error(err)
            process.exit(1)
            return
        }

        let artwork = `
    ██████╗ ███████╗██╗     ██╗██╗   ██╗███████╗██████╗ ██╗   ██╗    ███╗   ██╗ ██████╗ ██████╗ ███████╗
    ██╔══██╗██╔════╝██║     ██║██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝
    ██║  ██║█████╗  ██║     ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝     ██╔██╗ ██║██║   ██║██║  ██║█████╗
    ██║  ██║██╔══╝  ██║     ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗  ╚██╔╝      ██║╚██╗██║██║   ██║██║  ██║██╔══╝
    ██████╔╝███████╗███████╗██║ ╚████╔╝ ███████╗██║  ██║   ██║       ██║ ╚████║╚██████╔╝██████╔╝███████╗
    ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝       ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝

    `
        if (process.env.DELIVERY_NODES_NET == 'STAGING') {
            artwork = `
    ██████╗ ███████╗██╗     ██╗██╗   ██╗███████╗██████╗ ██╗   ██╗    ███╗   ██╗ ██████╗ ██████╗ ███████╗    ███████╗████████╗ █████╗  ██████╗ ██╗███╗   ██╗ ██████╗
    ██╔══██╗██╔════╝██║     ██║██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝ ██║████╗  ██║██╔════╝
    ██║  ██║█████╗  ██║     ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝     ██╔██╗ ██║██║   ██║██║  ██║█████╗      ███████╗   ██║   ███████║██║  ███╗██║██╔██╗ ██║██║  ███╗
    ██║  ██║██╔══╝  ██║     ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗  ╚██╔╝      ██║╚██╗██║██║   ██║██║  ██║██╔══╝      ╚════██║   ██║   ██╔══██║██║   ██║██║██║╚██╗██║██║   ██║
    ██████╔╝███████╗███████╗██║ ╚████╔╝ ███████╗██║  ██║   ██║       ██║ ╚████║╚██████╔╝██████╔╝███████╗    ███████║   ██║   ██║  ██║╚██████╔╝██║██║ ╚████║╚██████╔╝
    ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝       ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝

    `
        }

        if (process.env.DELIVERY_NODES_NET == 'DEV') {
            artwork = `
    ██████╗ ███████╗██╗     ██╗██╗   ██╗███████╗██████╗ ██╗   ██╗    ███╗   ██╗ ██████╗ ██████╗ ███████╗    ██████╗ ███████╗██╗   ██╗
    ██╔══██╗██╔════╝██║     ██║██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝    ██╔══██╗██╔════╝██║   ██║
    ██║  ██║█████╗  ██║     ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝     ██╔██╗ ██║██║   ██║██║  ██║█████╗      ██║  ██║█████╗  ██║   ██║
    ██║  ██║██╔══╝  ██║     ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗  ╚██╔╝      ██║╚██╗██║██║   ██║██║  ██║██╔══╝      ██║  ██║██╔══╝  ╚██╗ ██╔╝
    ██████╔╝███████╗███████╗██║ ╚████╔╝ ███████╗██║  ██║   ██║       ██║ ╚████║╚██████╔╝██████╔╝███████╗    ██████╔╝███████╗ ╚████╔╝
    ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝   ╚═╝       ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚═════╝ ╚══════╝  ╚═══╝

    `
        }

        Logger.info(`
        ################################################



        ${artwork}



        🛡️  Server listening on port: ${config.port} 🛡️

        ################################################
        `)
    })
}

// stopServer shuts down the server. Used in tests.
async function stopServer() {
    server.close()
}

export { startServer, stopServer }
