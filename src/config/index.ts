import dotenv from 'dotenv'

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

// Optional support for CONFIG_DIR variable
console.log(`config dir is ${process.env.CONFIG_DIR}`);
let options = {};
if(process.env.CONFIG_DIR) {
  options = {path: `${process.env.CONFIG_DIR}/.env`};
}
const envFound = dotenv.config(options);
if (envFound.error) {
    throw new Error("⚠️  Couldn't find .env file  ⚠️")
}

export const changeLogLevel = (level: string) => {
    if (level) {
        global.logLevel = level
    }
}

const generalConfig = require('./config-general').default

let config
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
