import {Service, Container, Inject} from 'typedi'
import config from '../config'
import log from '../loaders/logger'

import PushTokensService from './pushTokensService'
import PushMessageService from './pushMessageService'
import StrUtil from "../utilz/strUtil";
import {EthSig} from "../utilz/ethSig";
import {ValidatorContractState} from "./validatorContractState";
import {Logger} from "winston";
import utils, {generateRandomWord2} from "../helpers/utilsHelper";
import logger from "../loaders/logger";
import {DNFeedItem} from "./feedProcessorService";

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

/*
MessageBlock example:

{
    "requests": [
        {
            "senderType": 0,
            "id": "f23f8149-329b-4b83-afe6-f4bfc860f53e",
            "verificationProof": "eip712v2:0x37ba76d10dceff2c4675d186a17b0e0ffe6020eef42ba170a2436192051996ad3daf835bb660bbad587f44a4e153bd9285fe0a166b35abd978453942f0b325ec1c::uid::1675756031",
            "sender": "eip155:5:0xD8634C39BBFd4033c0d3289C4515275102423681",
            "recipient": "eip155:0xD8634C39BBFd4033c0d3289C4515275102423681",
            "source": "ETH_TEST_GOERLI",
            "identityBytes": "0+3+EPNS x LISCON+Dropping test directly on push nodes at LISCON 2021.",
            "validatorToken": "eyJub2RlcyI6W3sibm9kZUlkIjoiMHg4ZTEyZEUxMkMzNWVBQmYzNWI1NmIwNEU1M0M0RTQ2OGU0NjcyN0U4IiwidHNNaWxsaXMiOjE2NzcwMTUwMzAwMTgsInJhbmRvbUhleCI6ImU4NzA5MWQyYmY2YjYwMzNlNGE4ZWQzNTViMDY5ZjUyMTE1MDY0MzQiLCJwaW5nUmVzdWx0cyI6W3sibm9kZUlkIjoiMHg4ZTEyZEUxMkMzNWVBQmYzNWI1NmIwNEU1M0M0RTQ2OGU0NjcyN0U4IiwidHNNaWxsaXMiOjE2NzcwMTUwMjAwNDAsInN0YXR1cyI6MX0seyJub2RlSWQiOiIweGZEQUVhZjdhZkNGYmI0ZTRkMTZEQzY2YkQyMDM5ZmQ2MDA0Q0ZjZTgiLCJ0c01pbGxpcyI6MTY3NzAxNTAyMDAzOCwic3RhdHVzIjoxfSx7Im5vZGVJZCI6IjB4OThGOUQ5MTBBZWY5QjNCOUE0NTEzN2FmMUNBNzY3NWVEOTBhNTM1NSIsInRzTWlsbGlzIjoxNjc3MDE1MDIwMDQ4LCJzdGF0dXMiOjF9XSwic2lnbmF0dXJlIjoiMHg2MjY3ZDNkOTU2NGE1NjgzODZkNzViZjkzYjFiMjZmZmU4MTFhM2QwOGVjYjA2MTZiNjZkNGZjNjk0MzQxMTllNDcyMzY3NzViMWE0ZmU1NmM0M2ZhMmRjMzlkNjZhZGZkNGY4ZmU5YzMyYmEwMTI2MjBkMjc3YjRjMDNkYzNhMjFiIn0seyJub2RlSWQiOiIweGZEQUVhZjdhZkNGYmI0ZTRkMTZEQzY2YkQyMDM5ZmQ2MDA0Q0ZjZTgiLCJ0c01pbGxpcyI6MTY3NzAxNTAzMDAxNywicmFuZG9tSGV4IjoiYmE0ODI4OGZkOWQxNTFiYmYzNDExOTdmZjQzNTNkM2YwOWJmMzQ5ZCIsInBpbmdSZXN1bHRzIjpbeyJub2RlSWQiOiIweGZEQUVhZjdhZkNGYmI0ZTRkMTZEQzY2YkQyMDM5ZmQ2MDA0Q0ZjZTgiLCJ0c01pbGxpcyI6MTY3NzAxNTAyMDAzOSwic3RhdHVzIjoxfSx7Im5vZGVJZCI6IjB4OThGOUQ5MTBBZWY5QjNCOUE0NTEzN2FmMUNBNzY3NWVEOTBhNTM1NSIsInRzTWlsbGlzIjoxNjc3MDE1MDIwMDQ3LCJzdGF0dXMiOjF9LHsibm9kZUlkIjoiMHg4ZTEyZEUxMkMzNWVBQmYzNWI1NmIwNEU1M0M0RTQ2OGU0NjcyN0U4IiwidHNNaWxsaXMiOjE2NzcwMTUwMjAwNDAsInN0YXR1cyI6MX1dLCJzaWduYXR1cmUiOiIweGU1MTY1NWUyMzcxZDc2NzBhOGRiYWM0ZmE0ZDg2ODg1NjBhZWZjOTRiNjFhOWRmNzgzNzEzZTEzZDJlMTdiZDMyMGFlNDE5YzUwNzg5MTFlMTU4NTVmNGM0ZjkyNWU0ZDhkNTZjNTYwODQ5NWZmMTJiYjQzZWQyNDEzODA2ZjBhMWMifSx7Im5vZGVJZCI6IjB4OThGOUQ5MTBBZWY5QjNCOUE0NTEzN2FmMUNBNzY3NWVEOTBhNTM1NSIsInRzTWlsbGlzIjoxNjc3MDE1MDMwMDE4LCJyYW5kb21IZXgiOiJkZDIwOWM2NjAzZmIwNzk0YjVkMjhkZWFjMmFhMmQzZWIwY2FjZTQ2IiwicGluZ1Jlc3VsdHMiOlt7Im5vZGVJZCI6IjB4ZkRBRWFmN2FmQ0ZiYjRlNGQxNkRDNjZiRDIwMzlmZDYwMDRDRmNlOCIsInRzTWlsbGlzIjoxNjc3MDE1MDIwMDQ4LCJzdGF0dXMiOjF9LHsibm9kZUlkIjoiMHg5OEY5RDkxMEFlZjlCM0I5QTQ1MTM3YWYxQ0E3Njc1ZUQ5MGE1MzU1IiwidHNNaWxsaXMiOjE2NzcwMTUwMjAwNDksInN0YXR1cyI6MX0seyJub2RlSWQiOiIweDhlMTJkRTEyQzM1ZUFCZjM1YjU2YjA0RTUzQzRFNDY4ZTQ2NzI3RTgiLCJ0c01pbGxpcyI6MTY3NzAxNTAyMDA1NCwic3RhdHVzIjoxfV0sInNpZ25hdHVyZSI6IjB4NGU0NWJjOWUxNzM0ZmUzZjhhMjVlMGJlZGYwZGI3ZGE2NWE4OWQ4ZTcxZmI5YTRmYjdmZWVmOGVmOWRiMGQ5NzcxZjRjOTZiNzBmNmE0MDg3ZDBjZGNlOWE1NDFjNjgyMDdiYzY1MjA4NThhODI4YjM3MGU3MDQ0ZDJkMjI3ZmExYyJ9XX0="
        }
    ],
    "responses": [
        {
            "header": {
                "sender": "eip155:5:0xD8634C39BBFd4033c0d3289C4515275102423681",
                "recipients": [
                    "eip155:0xd8634c39bbfd4033c0d3289c4515275102423681"
                ],
                "senderType": 0,
                "source": "ETH_TEST_GOERLI"
            },
            "payload": {
                "notification": {
                    "title": "testing goerli - EPNS x LISCON",
                    "body": "Dropping test directly on push nodes at LISCON 2021."
                },
                "data": {
                    "type": 3,
                    "app": "testing goerli",
                    "icon": "https://gateway.ipfs.io/ipfs/bafybeidkt3qrlcplntabfazs7nnzlxdzu36mmieth2ocyphm2kp4sh333a/QmTX8zZjzuKpiLZmn4ShNzyKDakNdbBQfwi449TBw7wgoK",
                    "url": "https://dev.push.org/",
                    "sectype": null,
                    "asub": "EPNS x LISCON",
                    "amsg": "Dropping test directly on push nodes at LISCON 2021.",
                    "acta": "",
                    "aimg": "",
                    "etime": null,
                    "hidden": "0",
                    "sid": "f23f8149-329b-4b83-afe6-f4bfc860f53e"
                },
                "recipients": {
                    "eip155:0xd8634c39bbfd4033c0d3289c4515275102423681": null
                },
                "verificationProof": "eip712v2:0x37ba76d10dceff2c4675d186a17b0e0ffe6020eef42ba170a2436192051996ad3daf835bb660bbad587f44a4e153bd9285fe0a166b35abd978453942f0b325ec1c::uid::1675756031"
            }
        }
    ],
    "responsesSignatures": [
        [
            {
                "nodeMeta": {
                    "nodeId": "0x98F9D910Aef9B3B9A45137af1CA7675eD90a5355",
                    "role": "V",
                    "tsMillis": 1677015557603
                },
                "signature": "0xcea6d1db3e5f0de2ab5ccdc2f02f0e8745131ae0264d7254151a2443288dd2e30028f3072482fc740a4918836fa6da4a467dc1ffe256994e2756494471ef9c221c"
            },
            {
                "nodeMeta": {
                    "nodeId": "0x8e12dE12C35eABf35b56b04E53C4E468e46727E8",
                    "role": "A",
                    "tsMillis": 1677015561592
                },
                "signature": "0x19354a9957061dad63648cd04de0ec55df21901c44d9a6eec112017941ebe07351f0851a31920f5290f83fb8f882230a9c40004f91359085b77c7bcfa01723bb1b"
            }
        ]
    ],
    "attestToken": "eyJub2Rlcy"
}
 */
export class MessageBlock {
  requests: PayloadItem[] = [];
  attestToken: string;
  responses: FeedItem[] = [];                // [feedItem]
  responsesSignatures: FeedItemSig[][] = []; // [feedItem] [signatures]
}

export class PayloadItem {
  // ex: AAAZZ-AAAAA-BBBB
  id: string;
  // ex: eip712v2:0xFO00::uid::3F
  verificationProof: string;
  // ex: eip155:1:0x6500
  sender: string;
  // ex: #SenderType.CHANNEL
  senderType: number = SenderType.CHANNEL;
  // ex: eip155:1:0x0700
  recipient: string;
  // ex: ETH_MAINNET
  source: string;
  // ex: 2+{"title":"test", "body":"test2", "data":{"acta":"", "aimg":"","amsg":""}}
  identityBytes: any;

  validatorToken: string;

  public constructor(payloadId: string, verificationProof: string, sender: string,
                     senderType: number = SenderType.CHANNEL,
                     recipient: string, source: string, identityBytes: any,
                     validatorToken?: string) {
    this.id = payloadId;
    this.verificationProof = verificationProof;
    this.sender = sender;
    this.senderType = senderType;
    this.recipient = recipient;
    this.source = source;
    this.identityBytes = identityBytes;
    this.validatorToken = validatorToken;
  }
}

export class FeedItem {
  header: FHeader;
  payload: FPayload;
}


export class FHeader {
  sender: string;         // ex: eip155:1:0x6500
  recipients: string[];    // ex: eip155:1:0x0700 or a list of recipients
  senderType: number;     // ex: #SenderType.CHANNEL
  source: string;         // ex: ETH_MAINNET
}

export class FPayload {
  data: FData;
  notification: FNotification;
  sectype: string;
  recipients: any;
  verificationProof: any;
}

export class FData {
  app: string;
  sid: string;
  url: string;
  acta: string;
  aimg: string;
  amsg: string;
  asub: string;
  icon: string;
  type: number;
  epoch: string;
  etime: string;
  sectype: string;
  hidden: string; // 0 or 1
  videoMeta: any;
}

export class FNotification {
  title: string;
  body: string;
}

export enum SenderType {
  CHANNEL = 0,
  W2W = 1,
  PUSH_VIDEO = 2
}

export class FeedItemSig {
  nodeMeta: NodeMeta; // empty, until signed
  signature: string;  // empty, until signed


  constructor(nodeMeta: NodeMeta, signature: string) {
    this.nodeMeta = nodeMeta;
    this.signature = signature;
  }
}

export class NodeMeta {
  nodeId: string;
  role: NetworkRole;
  tsMillis: number;
}

export enum NetworkRole {
  VALIDATOR = "V",
  ATTESTER = "A",
  STORAGE = "S",
  DELIVERY = "D"
}
