import {Service, Container, Inject} from 'typedi'
import config from '../../config'
import PushTokensService from '../pushTokensService'
import PushMessageService from '../pushMessageService'
import StrUtil from "../../utilz/strUtil";
import {EthSig} from "../../utilz/ethSig";
import {ValidatorContractState} from "./validatorContractState";
import {Logger} from "winston";
import utils from "../../helpers/utilsHelper";
import logger from "../../loaders/logger";
import {FeedItemSig, MessageBlock, MessageBlockUtil, NetworkRole} from "../messaging-common/messageBlock";
import {QueueClient} from "../messaging-dset/queueClient";
import {Consumer, QItem} from "../messaging-dset/queueTypes";
import {BlockStorage} from "./BlockStorage";
import {MySqlUtil} from "../../utilz/mySqlUtil";
import * as dbHelper from '../../database/dbHelper'
import {QueueInitializerDelivery} from "./queueInitializerDelivery";
import {CollectionUtil} from "../../utilz/collectionUtil";
import {Check} from "../../utilz/check";
/*
todo Delete data older than 6months!
todo Listen to every contract change, not on startup
 */
@Service()
export default class DeliveryNode implements Consumer<QItem> {

  @Inject()
  private contract: ValidatorContractState;

  @Inject('logger')
  private log: Logger;

  @Inject()
  private pushTokenService: PushTokensService

  @Inject()
  private pushMessageService: PushMessageService;

  @Inject(type => QueueInitializerDelivery)
  private queueInitializer: QueueInitializerDelivery;

  @Inject()
  private blockStorage: BlockStorage;

  private client: QueueClient;

  public async postConstruct() {
    MySqlUtil.init(dbHelper.pool);
    await this.blockStorage.postConstruct();
    await this.contract.postConstruct();
    await this.queueInitializer.postConstruct();
  }

  // remote queue handler
  async accept(item: QItem): Promise<boolean> {
    // check hash
    let mb = <MessageBlock>item.object;
    Check.notEmpty(mb.id, 'message block has no id');
    let calculatedHash = MessageBlockUtil.calculateHash(mb);
    if (calculatedHash !== item.object_hash) {
      this.log.error('received item hash=%s , ' +
        'which differs from calculatedHash=%s, ' +
        'ignoring the block because producer calculated the hash incorrectly',
        item.object_hash, calculatedHash);
      return false;
    }
    // check contents
    // since this check is not for historical data, but for realtime data,
    // so we do not care about old blocked validators which might occur in the historical queue
    let activeValidators = CollectionUtil.arrayToFields(this.contract.getActiveValidators(), 'nodeId');
    let check1 = MessageBlockUtil.checkBlock(mb, activeValidators);
    if (!check1.success) {
      this.log.error('item validation failed: ', check1.err);
      return false;
    }
    // check database
    let isNew = await this.blockStorage.accept(item);
    if(!isNew) {
      // this is not an error, because we read duplicates from every validator
      this.log.debug('block %s already exists ', mb.id);
      return false;
    }
    // send block
    await this.sendBlock(mb);
  }

  // sends the block contents (internal messages from every response)
  // to every recipient specified in the header
  public async sendBlock(mb: Readonly<MessageBlock>) {
    this.log.debug('sendBlock() messageBlock: %s', mb.id)
    for (let i = 0; i < mb.responses.length; i++) {
      const fi = mb.responses[i];
      let header = fi.header;
      let payload = fi.payload;
      let targetWallets = MessageBlockUtil.calculateRecipients(mb, i);
      this.log.debug('sendBlock() messageBlock: %s -> feedItem: %s to recipients [%o]',
        mb.id, fi?.payload?.data?.sid, targetWallets)
      const deviceLookup = await this.pushTokenService.getDeviceTokens(targetWallets)
      const devices = deviceLookup.devices;
      if (devices.length == 0) {
        continue;
      }
      let count = 0;
      const msgPayload = utils.generateMessagingPayloadFromFeed(payload);
      this.log.debug('Sending', msgPayload);
      while (devices.length) {
        const deviceChunk = devices.splice(0, config.messagingChunkMaxSize);
        const loopId = payload.data.sid + '_' + count
        const isDuplicate = await this.pushMessageService.isLoopIdDuplicate(loopId)
        if (isDuplicate) {
          this.log.debug('Loop id :: %o already exists in DB, hence skipping', loopId)
          continue;
        }
        await this.pushMessageService.addMessage(loopId, deviceChunk, msgPayload);
        count = count + 1;
      }
    }
  }

}


class CheckResult {
  success: boolean;
  err: string;


  static failWithText(err: string): CheckResult {
    return {success: false, err: err}
  }

  static ok(): CheckResult {
    return {success: true, err: ''}
  }

}
