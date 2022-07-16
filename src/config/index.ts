import dotenv from 'dotenv'

// import {logLevel} from '../app'
// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const envFound = dotenv.config()
if (envFound.error) {
    // This error should crash whole process
    throw new Error("⚠️  Couldn't find .env file  ⚠️")
}

export const changeLogLevel = (level: string) => {
    if (level) {
        global.logLevel = level
    }
}

//get the general config
const generalConfig = require('./config-general').default

// load the appropriate config as per the server state
let config
console.log(process.env.DELIVERY_NODES_NET)
if (process.env.DELIVERY_NODES_NET == 'PROD') {
    config = require('./config-prod').default
} else if (process.env.DELIVERY_NODES_NET == 'STAGING') {
    config = require('./config-staging').default
} else if (process.env.DELIVERY_NODES_NET == 'DEV') {
    config = require('./config-dev').default
} else {
    throw new Error('⚠️  Provide proper DELIVERY_NODES_NETWORK in .env ⚠️')
}

export default { ...config, ...generalConfig }
