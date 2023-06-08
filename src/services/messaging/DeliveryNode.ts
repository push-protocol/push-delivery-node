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
import {FeedItemSig, MessageBlock, NetworkRole} from "./messageBlock";

@Service()
export default class DeliveryNode {

  @Inject()
  private contract: ValidatorContractState;

  @Inject('logger')
  private log: Logger;

  @Inject()
  private pushTokenService: PushTokensService

  @Inject()
  private pushMessageService: PushMessageService

  public checkBlock(block: MessageBlock): CheckResult {
    if (block.requests.length != block.responses.length) {
      return CheckResult.failWithText(`message block has incorrect length ${block.requests.length}!=${block.responses.length}`);
    }
    let blockValidatorNodeId = null;
    let item0sig0 = block.responsesSignatures[0][0];
    if (item0sig0?.nodeMeta.role != NetworkRole.VALIDATOR
      || StrUtil.isEmpty(item0sig0?.nodeMeta.nodeId)) {
      return CheckResult.failWithText('first signature is not performed by a validator');
    }
    let result: FeedItemSig[] = [];
    for (let i = 0; i < block.responses.length; i++) {
      let payloadItem = block.requests[i];
      let feedItem = block.responses[i];
      // check signatures
      let feedItemSignatures = block.responsesSignatures[i];
      for (let j = 0; j < feedItemSignatures.length; j++) {
        let fiSig = feedItemSignatures[j];
        if (j == 0) {
          if (fiSig.nodeMeta.role != NetworkRole.VALIDATOR) {
            return CheckResult.failWithText(`First signature on a feed item should be  ${NetworkRole.VALIDATOR}`);
          }
        } else {
          if (fiSig.nodeMeta.role != NetworkRole.ATTESTER) {
            return CheckResult.failWithText(`2+ signature on a feed item should be  ${NetworkRole.ATTESTER}`);
          }
        }
        const valid = EthSig.check(fiSig.signature, fiSig.nodeMeta.nodeId, fiSig.nodeMeta, feedItem);
        if (!valid) {
          return CheckResult.failWithText(`signature is not valid`);
        } else {
          this.log.debug('valid signature %o', fiSig);
        }
        const validNodeId = this.contract.isActiveValidator(fiSig.nodeMeta.nodeId);
        if (!validNodeId) {
          return CheckResult.failWithText(`${fiSig.nodeMeta.nodeId} is not a valid nodeId from a contract`);
        } else {
          this.log.debug('valid nodeId %o', fiSig.nodeMeta.nodeId);
        }
      }
    }
    return CheckResult.ok();
  }

  // sends the block contents (internal messages from every response)
  // to every recipient specified in the header
  public async sendBlock(mb: MessageBlock) {
    for (const fi of mb.responses) {
      let header = fi.header;
      let payload = fi.payload;
      let targetWallets = header.recipients;
      const deviceLookup = await this.pushTokenService.getDeviceTokens(targetWallets)
      const devices = deviceLookup.devices;
      if (devices.length == 0) {
        continue;
      }
      let count = 0;
      const msgPayload = utils.generateMessagingPayloadFromFeed(payload)
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
