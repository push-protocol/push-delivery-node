export default {
<<<<<<< HEAD
    PUSH_NODE_WEBSOCKET_URL: 'https://backend-staging.epns.io',
=======
    PUSH_NODE_WEBSOCKET_URL: 'https://backend-staging-v2.push.org',
>>>>>>> parent of f5678a9 (Revert back to GKE CICD state)
    REDIS_URL: process.env.REDIS_URL,
    REDIS_AUTH: process.env.REDIS_AUTH,
    // channel can be either full caip or no caip
    // if empty, the node will deliver notification for all channels
    // if a channel is in nocaip, it will deliver notification for both the eth and alias channel
    //ex: 0xabc is a channel that has an alias in polygon. adding 0xabc as an address will allow the delivery node to process
    // notifications from both the ethereum as well as polygon.
    // if a channel is in caip, it will deliver notification for that particular chain's notification
    //ex: eip155:5:0xabc is defined as an address, it will only process notification from ethereum channel and wont process notifications coming from alias

    CHANNEL_ADDRESSES: [],
    /**
     *   Messaging related
     */
    messagingMaxAttempts: 5,
    messagingChunkMaxSize: 500,
    preserveStaleMessagesDays: 7,
    /**
     * apns related
     */
    apnsTopic: 'io.epns.epnsstaging',
}
