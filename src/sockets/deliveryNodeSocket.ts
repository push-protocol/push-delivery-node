import {Container} from 'typedi'
import io from 'socket.io-client'
import feedProcessorService from '../services/feedProcessorService'
import config from '../config'
import log from '../loaders/logger'
import {client} from '../loaders/redis'
import DeliveryNode, {MessageBlock} from "../services/DeliveryNode";

const MESSAGE_BLOCK_EVENT = "messageBlockEvent";
const feedProcessor = Container.get(feedProcessorService);
const deliveryNode = Container.get(DeliveryNode);

let pushNodeUnreachableFrom;

const RECONNECTION_DELAY_MAX = 10000;
export default async () => {
  // More Details: https://socket.io/docs/v4/client-options/#reconnectiondelay
  const socket = io.connect(config.PUSH_NODE_WEBSOCKET_URL, {
    reconnectionDelayMax: RECONNECTION_DELAY_MAX,
    reconnectionDelay: 5000,
    query: {
      mode: 'MESSAGE_BLOCK',
    },
  })

  socket.on('connect', async () => {
    log.info('CONNECTED TO VALIDATOR NODE');
  })

  socket.on('connect_error', async () => {
    log.error(
      '!!!! Unable to connect to the push node websocket!! Will reconnect after with in next %o seconds. Push node unreachable from :: %o !!!!',
      RECONNECTION_DELAY_MAX,
      new Date(Number(pushNodeUnreachableFrom))
    );
  })

  socket.on('disconnect', function () {
    log.error('!!!! Push node socket connection dropped. !!!!')
  })

  socket.on(MESSAGE_BLOCK_EVENT, async (mb: MessageBlock) => {
    const res = deliveryNode.checkBlock(mb);
    if (!res.success) {
      log.error('error ' + res.err);
      return;
    }
    await deliveryNode.sendBlock(mb);
    log.info('message block successfully sent: ', mb)
  })

}


