import {
    Container
} from 'typedi';
const io = require("socket.io-client");
import feedProcessorService from '../services/feedProcessorService';
import config from '../config';
import logger from '../loaders/logger';

const LIVE_FEED_EVENT = "liveFeeds";
const HISTORICAL_FEED_EVENT = "historicalFeeds";

export default async () => {
    const feedProcessor = Container.get(feedProcessorService);
    const socket = io.connect(config.PUSH_NODE_WEBSOCKET_URL);
    socket.on(LIVE_FEED_EVENT, (feed) => {
        feedProcessor.processFeed(feed);
    });

    var feedsRequest = {
        "startTime": 1,
        "endTime": 1664342399,
        "page": 1,
        "pageSize": 10
    }

    var feedsCount = 0
    socket.emit(HISTORICAL_FEED_EVENT, feedsRequest);
    socket.on(HISTORICAL_FEED_EVENT, (data) => {
        feedsCount += data['count']
        if (data['count'] == 0) {
            logger.info("Done with historical feeds")
            logger.info("Total :: %o historical feeds are received between :: %o and :: %o.", feedsCount, feedsRequest.startTime, feedsRequest.endTime)
            logger.info("Disconnecting the historicalFeeds socket.")
            socket.disconnect();
            logger.info("Disconnected the historicalFeeds socket.")
        } else {
            logger.info("Received :: %o feeds, current iteration page size :: %o and :: page number :: %o ", data['count'], feedsRequest.page, feedsRequest.pageSize)
            for (let i = 0; i < data['feeds'].length; i++) {
                feedProcessor.processFeed(data['feeds'][i])
            }
            feedsRequest.page += 1
            socket.emit(HISTORICAL_FEED_EVENT, feedsRequest);
        }
    });
}