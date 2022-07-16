const env = process.env.NODE_ENV || 'local'
const deliveryNodesNet = process.env.DELIVERY_NODES_NET
const staticServeURI = 'public'

export default {
    /**
     * Your favorite port
     */
    environment: env,
    deliveryNodesNet: deliveryNodesNet,
    port: parseInt(process.env.PORT || '3000', 10),
    runningOnMachine: process.env.RUNNING_ON_MACHINE,

    /**
     * Used by winston logger
     */
    logs: {
        level: process.env.LOG_LEVEL || 'silly',
    },

    /**
     * The database config
     */
    dbhost: process.env.DB_HOST,
    dbname: process.env.DB_NAME,
    dbuser: process.env.DB_USER,
    dbpass: process.env.DB_PASS,

    staticServePath: staticServeURI,

    /**
     * Deadlocks
     */
    LOCK_MESSAGING_LOOPIDS: {},

    /**
     * Firebase related
     */
    fcmDatabaseURL: process.env.FIREBASE_DATABASE_URL,

    /**
     * API configs
     */
    api: {
        prefix: '/apis',
    },
}
