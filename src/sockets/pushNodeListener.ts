import {
    Container
} from 'typedi';
const io = require("socket.io-client");
import feedProcessorService from '../services/feedProcessorService';
import config from '../config';
import logger from '../loaders/logger';
import {
    client
} from '../loaders/redis';

var artwork = require('../helpers/artwork');

const LIVE_FEED_EVENT = "liveFeeds";
const HISTORICAL_FEED_EVENT = "historicalFeeds";
const UNPROCESSED_HISTORICAL_FEEDS_REDIS_KEY = process.env.DELIVERY_NODES_NET + "_UNPROCESSED_HISTORICAL_FEEDS";
const PUSH_NODE_UNREACHABLE_FROM_REDIS_KEY = process.env.DELIVERY_NODES_NET + "_PUSH_NODE_UNREACHABLE_FROM";
var feedsRequest;
var pushNodeUnreachableFrom;
var fetchHistoryFrom;
var ranges;
const FEED_REQUEST_PAGE_SIZE = 50;
const RECONNECTION_DELAY_MAX = 10000;

export default async () => {

    // More Details: https://socket.io/docs/v4/client-options/#reconnectiondelay
    const socket = io.connect(config.PUSH_NODE_WEBSOCKET_URL, {
        reconnectionDelayMax: RECONNECTION_DELAY_MAX,
        reconnectionDelay: 5000,
        query: {
            "isDeliveryNode": "true"
        }
    });

    socket.on("connect", async () => {

        logger.info(artwork.getPushNodeConnectionArtWork());

        pushNodeUnreachableFrom = await client.get(PUSH_NODE_UNREACHABLE_FROM_REDIS_KEY);

        if (pushNodeUnreachableFrom != null) {
            logger.info("!!!! Push node unreachable from time captured :: %o !!!!", new Date(Number(pushNodeUnreachableFrom)));
        }
        client.del(PUSH_NODE_UNREACHABLE_FROM_REDIS_KEY)

        // Below code is to handle delivery node down time

        fetchHistoryFrom = global.PREVIOUS_INSTANCE_LATEST_UPTIME;

        // If previous instance uptime is not found (which is rare) fetch last one hour feeds.
        if (!fetchHistoryFrom) {
            var date = new Date();
            date.getHours() - 1;
            fetchHistoryFrom = date.getTime().toString();
        }
        const fetchHistoryUntil = Date.now().toString();

        ranges = await client.get(UNPROCESSED_HISTORICAL_FEEDS_REDIS_KEY)
        ranges = (ranges == null) ? [] : JSON.parse(ranges);

        pushNodeUnreachableFrom = await client.get(PUSH_NODE_UNREACHABLE_FROM_REDIS_KEY);

        if (pushNodeUnreachableFrom != null && pushNodeUnreachableFrom < global.PREVIOUS_INSTANCE_LATEST_UPTIME) {
            logger.info("!!!! Adding Push node unreachable from time to the range set!!!!")
            ranges.push({
                "startTime": pushNodeUnreachableFrom,
                "endTime": fetchHistoryUntil
            });
        } else {
            logger.info("!!!! Adding previous delivery instance uptime to the range set!!!!")
            ranges.push({
                "startTime": global.PREVIOUS_INSTANCE_LATEST_UPTIME,
                "endTime": fetchHistoryUntil
            });
        }

        await client.set(UNPROCESSED_HISTORICAL_FEEDS_REDIS_KEY, JSON.stringify(ranges));
        ranges = JSON.parse(await client.get(UNPROCESSED_HISTORICAL_FEEDS_REDIS_KEY));

        logger.info("-- 🛵 Total historical ranges found :: %o", ranges.length)

        feedsRequest = {
            "startTime": ranges[0].startTime,
            "endTime": ranges[0].endTime,
            "page": 1,
            "pageSize": FEED_REQUEST_PAGE_SIZE
        }

        initiateFeedRequest(socket, feedsRequest);
    });

    socket.on("connect_error", async () => {

        pushNodeUnreachableFrom = await client.get(PUSH_NODE_UNREACHABLE_FROM_REDIS_KEY)

        if (pushNodeUnreachableFrom == null) {
            pushNodeUnreachableFrom = Date.now().toString();
            await client.set(PUSH_NODE_UNREACHABLE_FROM_REDIS_KEY, pushNodeUnreachableFrom);
        }

        logger.error("!!!! Unable to connect to the push node websocket!! Will reconnect after with in next %o seconds. Push node unreachable from :: %o !!!!", RECONNECTION_DELAY_MAX, new Date(Number(pushNodeUnreachableFrom)))
    });

    socket.on(LIVE_FEED_EVENT, (feed) => {
        feedProcessor.processFeed(feed);
    });

    socket.on('disconnect', function() {
        logger.error("!!!! Push node socket connection dropped. !!!!")
    })

    const feedProcessor = Container.get(feedProcessorService);
    var feedsPerRangeCount = 0
    var totalFeedsCount = 0

    socket.on(HISTORICAL_FEED_EVENT, async (data) => {

        totalFeedsCount += data['count']
        feedsPerRangeCount += data['count']

        if (data['count'] == 0) {

            // Reinitializing this counter
            feedsPerRangeCount = 0;

            logger.info("!!!! Done with one historical feed range !!!!")
            logger.info("!!!! Total :: %o historical feeds are received between :: %o and :: %o. !!!!", feedsPerRangeCount, new Date(Number(feedsRequest.startTime)), new Date(Number(feedsRequest.endTime)))

            ranges = JSON.parse(await client.get(UNPROCESSED_HISTORICAL_FEEDS_REDIS_KEY))

            // Remove this finished range and update the redis
            ranges = ranges.filter(each => {
                return each.startTime !== feedsRequest.startTime && each.endTime !== feedsRequest.endTime;
            });

            await client.set(UNPROCESSED_HISTORICAL_FEEDS_REDIS_KEY, JSON.stringify(ranges));

            if (ranges == 0) {
                logger.info("!!!! Done with all historical feed ranges Total feeds processed :: %o !!!!", totalFeedsCount)
            } else {
                feedsRequest = {
                    "startTime": ranges[0].startTime,
                    "endTime": ranges[0].endTime,
                    "page": 1,
                    "pageSize": FEED_REQUEST_PAGE_SIZE
                }

                initiateFeedRequest(socket, feedsRequest);
            }
        } else {
            logger.info("!!!! Received :: %o feeds, current iteration page size :: %o and :: page number :: %o !!!!", data['count'], feedsRequest.page, feedsRequest.pageSize)

            for (let i = 0; i < data['feeds'].length; i++) {
                feedProcessor.processFeed(data['feeds'][i])
            }

            feedsRequest.page += 1
            initiateFeedRequest(socket, feedsRequest);
        }
    });
}

// This is to handle scenarios like delivery or push node down time
async function initiateFeedRequest(socket, feedsRequest) {
    logger.info("-- 🛵 Initiating history feed fetcher with request body :: %o, requesting feeds between :: %o and :: %o, page :: %o and pagenumber :: %o.", JSON.stringify(feedsRequest), new Date(Number(feedsRequest.startTime)), new Date(Number(feedsRequest.endTime)), feedsRequest.page, feedsRequest.pageSize)
    socket.emit(HISTORICAL_FEED_EVENT, feedsRequest);
}