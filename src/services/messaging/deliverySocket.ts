import {Container, Inject, Service} from 'typedi'
import io from 'socket.io-client'
import config from '../../config'
import log from '../../loaders/logger'
import DeliveryNode from "./deliveryNode";
import {MessageBlock} from "./messageBlock";
import {Logger} from "winston";
import PushTokensService from "../pushTokensService";
import PushMessageService from "../pushMessageService";
import {NodeInfo, NodeType, ValidatorContract} from "./validatorContract";


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

  @Inject()
  private validatorContract: ValidatorContract;

  private validatorSocketMap: Map<string, ValidatorSocket> = new Map<string, ValidatorSocket>();

  public async postConstruct() {
    for (const ni of this.validatorContract.getAllValidators()) {
      if (NodeInfo.isValidValidator(ni)) {
        await this.connect(ni);
      }
    }
  }

  public async connect(ni: NodeInfo) {
    this.log.info(`connecting to validator ${ni.nodeId} , url: ${ni.url}`);
    const socket = io.connect(ni.url, {
      reconnectionDelayMax: DeliverySocket.RECONNECTION_DELAY_MAX,
      reconnectionDelay: DeliverySocket.RECONNECTION_DELAY,
      query: {
        mode: 'MESSAGE_BLOCK',
        clientType: NodeType.DNode, // todo handle
        clientVer: "1.0"            // todo handle
      },
    });
    let validatorSocket = new ValidatorSocket();
    validatorSocket.socket = socket;
    validatorSocket.nodeId = ni.nodeId;
    this.validatorSocketMap.set(ni.nodeId, validatorSocket)

    socket.on('connect', async () => {
      this.log.info(`>connected to validator ${ni.nodeId} , url: ${ni.url}`);

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

class ValidatorSocket {
  socket: any;
  nodeId: string;
}

