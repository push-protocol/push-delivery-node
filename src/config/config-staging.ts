export default {
    PUSH_NODE_WEBSOCKET_URL: process.env.PUSH_NODE_WEBSOCKET_URL,
    /**
     *   Messaging related
     */
    messagingMaxAttempts: 5,
    messagingChunkMaxSize: 500,
    preserveStaleMessagesDays: 7
}