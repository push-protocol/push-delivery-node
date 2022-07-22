import {
    Service,
    Container
} from 'typedi';
const io = require("socket.io-client");
import feedProcessorService from '../services/feedProcessorService';
import config from '../config';

export default async () => {
  const feedProcessor = Container.get(feedProcessorService);
  const ioClient = io.connect(config.PUSH_NODE_WEBSOCKET_URL);
  ioClient.on("liveFeeds", (feed) => {
      console.info(feed);
      console.info(feed.users);
      console.info(feed.payload);
      console.info(feed.sid);
      feedProcessor.processFeed(feed)
  });
}