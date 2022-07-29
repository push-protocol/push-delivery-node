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
     * The delivery node database config
     */
    dbhost: process.env.DB_HOST,
    dbname: process.env.DB_NAME,
    dbuser: process.env.DB_USER,
    dbpass: process.env.DB_PASS,
    dbport: process.env.DB_PORT,


    /**
     * The push node database config .. this needs to be deleted post the migration
     */
    pushnode_dbhost: process.env.PUSH_NODE_DB_HOST,
    pushnode_dbname: process.env.PUSH_NODE_DB_NAME,
    pushnode_dbuser: process.env.PUSH_NODE_DB_USER,
    pushnode_dbpass: process.env.PUSH_NODE_DB_PASS,

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
