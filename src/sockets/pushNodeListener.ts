import {
    Container
} from 'typedi';
const io = require("socket.io-client");
import feedProcessorService from '../services/feedProcessorService';
import config from '../config';
import logger from '../loaders/logger';
var artwork = require('../helpers/artwork');

const LIVE_FEED_EVENT = "liveFeeds";
const HISTORICAL_FEED_EVENT = "historicalFeeds";

export default async () => {

    var fetchHistoryFrom = global.PREVIOUS_INSTANCE_LATEST_UPTIME;

    // If previous instance uptime is not found (which is rare) fetch last one hour feeds.
    if (!fetchHistoryFrom) {
        var date = new Date();
        date.getHours() - 1;
        fetchHistoryFrom = date.getTime().toString();
    }
    const fetchHistoryUntil = Date.now().toString();

    var feedsRequest = {
        "startTime": global.PREVIOUS_INSTANCE_LATEST_UPTIME,
        "endTime": fetchHistoryUntil,
        "page": 1,
        "pageSize": 50
    }

    const feedProcessor = Container.get(feedProcessorService);
    var feedsCount = 0
    const RECONNECTION_DELAY_MAX = 10000;

    // More Details: https://socket.io/docs/v4/client-options/#reconnectiondelay
    const socket = io.connect(config.PUSH_NODE_WEBSOCKET_URL, {
        reconnectionDelayMax: RECONNECTION_DELAY_MAX,
        reconnectionDelay: 5000,
        query: {
            "isDeliveryNode": "true"
        }
    });

    socket.on("connect", () => {
        logger.info(artwork.getPushNodeConnectionArtWork())
    });

    socket.on("connect_error", () => {
        logger.error("Unable to connect to the push node websocket!! Will reconnect after with in next %o seconds !!! ", RECONNECTION_DELAY_MAX)
    });

    socket.emit(HISTORICAL_FEED_EVENT, feedsRequest);

    // This is to handle scenarios like delivery node down time etc
    logger.info("-- 🛵 Initiating history feed fetcher with request body :: %o, requesting feeds between :: %o and :: %o.", JSON.stringify(feedsRequest), new Date(Number(feedsRequest.startTime)), new Date(Number(feedsRequest.endTime)))

    socket.on(HISTORICAL_FEED_EVENT, (data) => {
        feedsCount += data['count']
        if (data['count'] == 0) {
            logger.info("Done with historical feeds")
            logger.info("Total :: %o historical feeds are received between :: %o and :: %o.", feedsCount, new Date(Number(feedsRequest.startTime)), new Date(Number(feedsRequest.endTime)))
        } else {
            logger.info("Received :: %o feeds, current iteration page size :: %o and :: page number :: %o ", data['count'], feedsRequest.page, feedsRequest.pageSize)
            for (let i = 0; i < data['feeds'].length; i++) {
                feedProcessor.processFeed(data['feeds'][i])
            }
            feedsRequest.page += 1
            socket.emit(HISTORICAL_FEED_EVENT, feedsRequest);
        }
    });

    socket.on(LIVE_FEED_EVENT, (feed) => {
        feedProcessor.processFeed(feed);
    });

    socket.on('disconnect', function() {
        logger.error("!!!! Push node socket connection dropped. !!!!")
    })
}