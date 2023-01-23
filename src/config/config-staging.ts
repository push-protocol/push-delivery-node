export default {
    PUSH_NODE_WEBSOCKET_URL: "https://backend-staging.epns.io",
    REDIS_URL: process.env.REDIS_URL,
    /**
     *   Messaging related
     */
    messagingMaxAttempts: 5,
    messagingChunkMaxSize: 500,
    preserveStaleMessagesDays: 7,
}
