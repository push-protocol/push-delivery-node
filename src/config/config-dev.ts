export default {
    PUSH_NODE_WEBSOCKET_URL: "https://backend-dev.epns.io",
    REDIS_URL: process.env.REDIS_URL,
    // channel can be either full caip or no caip
    // if empty, the node will deliver notification for all channels
    // if a channel is in nocaip, it will deliver notification for both the eth and alias channel
    // if a channel is in caip, it will deliver notification for that particular chain's notification
    CHANNEL_ADDRESSES: ["abc", "cde"],

    /**
     *   Messaging related
     */
    messagingMaxAttempts: 5,
    messagingChunkMaxSize: 500,
    preserveStaleMessagesDays: 7,
}
