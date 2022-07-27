import {
    Container
} from 'typedi';
const io = require("socket.io-client");
import feedProcessorService from '../services/feedProcessorService';
import config from '../config';
import logger from '../loaders/logger'

export default async () => {
  const feedProcessor = Container.get(feedProcessorService);
  const socket = io.connect(config.PUSH_NODE_WEBSOCKET_URL);
  socket.on("liveFeeds", (feed) => {
      feedProcessor.processFeed(feed)
  });

  var historicalFeedsRequest = {
      "startTime": 1,
      "endTime": 1664342399,
      "page": 1,
      "pageSize": 10
  }

  var count = 0
  socket.emit("historicalFeeds", historicalFeedsRequest);
  socket.on("historicalFeeds", (data) => {
      count += data['count']
      if (data['count'] == 0) {
          logger.info("Received all the historical data between %o and %o. Total feeds received :: %o. Disconnecting the historicalFeeds socket",  historicalFeedsRequest.startTime, historicalFeedsRequest.endTime, count)
          socket.disconnect();
      } else {
          for(let i = 0; i < data['feeds'].length; i++) {
            feedProcessor.processFeed(data['feeds'][i])
          }
          historicalFeedsRequest.page += 1
          socket.emit("historicalFeeds", historicalFeedsRequest);
      }
  });
}