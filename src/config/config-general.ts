const env = process.env.NODE_ENV || 'local'
const deliveryNodesNet = process.env.DELIVERY_NODES_NET
const staticServeURI = 'public'

export default {

    environment: env,
    deliveryNodesNet: deliveryNodesNet,
    port: parseInt(process.env.PORT || '7575', 10),

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
