import {Container, Inject, Service} from 'typedi'
import io from 'socket.io-client'
import config from '../../config'
import log from '../../loaders/logger'
import DeliveryNode from "./deliveryNode";
import {MessageBlock} from "./messageBlock";
import {Logger} from "winston";
import PushTokensService from "../pushTokensService";
import PushMessageService from "../pushMessageService";

@Service()
export default class DeliverySocket {
  static RECONNECTION_DELAY_MAX = 10000;
  static RECONNECTION_DELAY = 5000;

  @Inject('logger')
  private log: Logger;

  @Inject()
  private pushTokenService: PushTokensService

  @Inject()
  private pushMessageService: PushMessageService;

  @Inject()
  private deliveryNode: DeliveryNode;


  public async postConstruct() {
    const socket = io.connect(config.PUSH_NODE_WEBSOCKET_URL, {
      reconnectionDelayMax: DeliverySocket.RECONNECTION_DELAY_MAX,
      reconnectionDelay: DeliverySocket.RECONNECTION_DELAY,
      query: {
        mode: 'MESSAGE_BLOCK', // todo protocol="DNODE1.0"
      },
    })

    socket.on('connect', async () => {
      this.log.info('CONNECTED TO VALIDATOR NODE');
    })

    socket.on('connect_error', async () => {
      this.log.error(
        '!!!! Unable to connect to the push node websocket!! Will reconnect after with in next %o seconds.',
        DeliverySocket.RECONNECTION_DELAY_MAX);
    });

    socket.on('disconnect', function () {
      this.log.error('Socket connection dropped!');
    });

    socket.on("messageBlockEvent", async (mb: MessageBlock) => {
      this.log.info('message block event: %o', mb);
      const res = this.deliveryNode.checkBlock(mb);
      if (!res.success) {
        log.error('error ' + res.err);
        return;
      }
      await this.deliveryNode.sendBlock(mb);
      this.log.info('message block successfully sent: ', mb);
    });
  }
}


