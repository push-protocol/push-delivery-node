const env = process.env.NODE_ENV || 'local'
const deliveryNodesNet = process.env.DELIVERY_NODES_NET
const staticServeURI = 'public'

export default {
    /**
     * Your favorite port
     */
    environment: env,
    deliveryNodesNet: deliveryNodesNet,
    port: parseInt(process.env.PORT || '7575', 10),
    //runningOnMachine: process.env.RUNNING_ON_MACHINE,

    /**
     * Used by winston logger
     */
    logs: {
        level: process.env.LOG_LEVEL || 'debug',
    },

    /**
     * The delivery node database config
     */
    deliveryNodeDBHost: process.env.DELIVERY_NODE_DB_HOST,
    deliveryNodeDBName: process.env.DELIVERY_NODE_DB_NAME,
    deliveryNodeDBUser: process.env.DELIVERY_NODE_DB_USER,
    deliveryNodeDBPass: process.env.DELIVERY_NODE_DB_PASS,
    deliveryNodeDBPort: process.env.DELIVERY_NODE_DB_PORT,

    /**
     * The push node database config .. this needs to be deleted post the migration
     */
    pushNodeDBHost: process.env.PUSH_NODE_DB_HOST,
    pushNodeDBName: process.env.PUSH_NODE_DB_NAME,
    pushNodeDBUser: process.env.PUSH_NODE_DB_USER,
    pushNodeDBPass: process.env.PUSH_NODE_DB_PASS,

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
        prefix: "/apis",
        version: "v1"
    }
}
