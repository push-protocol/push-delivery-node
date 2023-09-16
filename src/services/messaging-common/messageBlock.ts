/**
 block
 1 inputs --
 2 outputs --
 message1 { source: wallet100, target: broadcast, signatures: [ { w100, 0x5} ] }
 messageM { source: wallet200, target: [wallet1, ..., walletN], signatures: [ { w200, 0x6} ] }
 3 output signatures --
 signatures: [ { v1, 0xA}, { v2, 0xB}, { v3, 0xC},
 { s1, 0xD}, { s2, 0xE}, { s3, 0xF},
 { d1, 0x1}, { d2, 0x2}, { d3, 0x3} ]
 */
import {Coll} from '../../utilz/coll'
import StrUtil from '../../utilz/strUtil'
import {EthSig} from '../../utilz/ethSig'
import {Logger} from 'winston'
import {WinstonUtil} from '../../utilz/winstonUtil'
import {ObjectHasher} from '../../utilz/objectHasher'
import {EthUtil} from '../../utilz/EthUtil'
import {Check} from '../../utilz/check'
import {NumUtil} from "../../utilz/numUtil";

/*
ex:
{
    "requests": [
        {
            "senderType": 0,
            "id": "6294189a-03d6-4412-8458-971bef18969c",
            "verificationProof": "eip712v2:0x37ba76d10dceff2c4675d186a17b0e0ffe6020eef42ba170a2436192051996ad3daf835bb660bbad587f44a4e153bd9285fe0a166b35abd978453942f0b325ec1c::uid::1675756031",
            "sender": "eip155:5:0xD8634C39BBFd4033c0d3289C4515275102423681",
            "recipient": "eip155:0xD8634C39BBFd4033c0d3289C4515275102423681",
            "source": "ETH_TEST_GOERLI",
            "identityBytes": "0+1+EPNS x LISCON+Dropping test directly on push nodes at LISCON 2021.",
            "validatorToken": "eyJub2RlcyI6W3sibm9kZUlkIjoiMHg4ZTEyZEUxMkMzNWVBQmYzNWI1NmIwNEU1M0M0RTQ2OGU0NjcyN0U4IiwidHNNaWxsaXMiOjE2OTIyNzk1MTAwNTEsInJhbmRvbUhleCI6IjA5ZWFmOWE0YmE4ZDA3OTNkOTZjZmQ2OGYzNmE5ZDAwMDMzY2FlNGUiLCJwaW5nUmVzdWx0cyI6W3sibm9kZUlkIjoiMHhmREFFYWY3YWZDRmJiNGU0ZDE2REM2NmJEMjAzOWZkNjAwNENGY2U4IiwidHNNaWxsaXMiOjE2OTIyNzk1MTAwMjgsInN0YXR1cyI6MX1dLCJzaWduYXR1cmUiOiIweDAwYmYwMjNiYWExMTI0ZTEzYzI2MDg5ZWY1MjVmNWE2YjhmZGY4OWJhODA1YzRjNjU3OTJiMmY2M2I2ZmI3MDY1MWNlYjM1YTEzODM2MjZhODdmYzU4OGExNjQ1NDViMDE0NDk5NWFkM2Q5ODRlMGM2MDcwOWZmZWM1MDcxNThjMWMifSx7Im5vZGVJZCI6IjB4ZkRBRWFmN2FmQ0ZiYjRlNGQxNkRDNjZiRDIwMzlmZDYwMDRDRmNlOCIsInRzTWlsbGlzIjoxNjkyMjc5NTEwMDU1LCJyYW5kb21IZXgiOiIxN2RlZTc1NDcwYjQ0NWFiNDgzN2U4YTdhNDIxNmIwMjhkMzA4MTMyIiwicGluZ1Jlc3VsdHMiOlt7Im5vZGVJZCI6IjB4OGUxMmRFMTJDMzVlQUJmMzViNTZiMDRFNTNDNEU0NjhlNDY3MjdFOCIsInRzTWlsbGlzIjoxNjkyMjc5NTEwMDM3LCJzdGF0dXMiOjF9XSwic2lnbmF0dXJlIjoiMHgzYjJhOTVkMTBlNDdkZjY2MGRmMzM2NzcxNTA2MWZlOWE3ZDZhYTUzZGZmMGE2NzI2YzI0MjI0OWU2NDUyNTFiNjQ4MWQwMWNiMmViMWJiMDRkMmI1ZjI3ZjA1ODFkZTc5ZTFiNjdjMzRiZTBkNTMyOWE1YWViZWZiMGJjYjE0YTFiIn1dfQ=="
        }
    ],
    "responses": [
        {
            "header": {
                "sender": "eip155:5:0xD8634C39BBFd4033c0d3289C4515275102423681",
                "recipientsResolved": [
                    {
                        "addr": "eip155:0x5ac9E6205eACA2bBbA6eF716FD9AabD76326EEee",
                        "ts": 1664871012
                    },
                    {
                        "addr": "eip155:0x69e666767Ba3a661369e1e2F572EdE7ADC926029",
                        "ts": 1666268868
                    },
                    {
                        "addr": "eip155:0xD8634C39BBFd4033c0d3289C4515275102423681",
                        "ts": 1692295692
                    }
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
                    "type": 1,
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
                    "silent": "0",
                    "additionalMeta": null,
                    "sid": "6294189a-03d6-4412-8458-971bef18969c"
                },
                "recipients": "eip155:0xd8634c39bbfd4033c0d3289c4515275102423681",
                "verificationProof": "eip712v2:0x37ba76d10dceff2c4675d186a17b0e0ffe6020eef42ba170a2436192051996ad3daf835bb660bbad587f44a4e153bd9285fe0a166b35abd978453942f0b325ec1c::uid::1675756031"
            }
        }
    ],
    "responsesSignatures": [
        [
            {
                "data": null,
                "nodeMeta": {
                    "nodeId": "0x8e12dE12C35eABf35b56b04E53C4E468e46727E8",
                    "role": "V",
                    "tsMillis": 1692281453978
                },
                "signature": "0xb95379d016b20161756c32a756eaa1b1fee7817874a55c26ae8f339bcbeb4ae172bcdcecd64c773559a4198dcd67b8bb78e5ed6d4370d9a016a08c46cca417111c"
            },
            {
                "data": {
                    "recipientsMissing": {
                        "recipients": [
                            {
                                "addr": "eip155:0xD8634C39BBFd4033c0d3289C4515275102423681"
                            }
                        ],
                        "sid": "6294189a-03d6-4412-8458-971bef18969c"
                    }
                },
                "nodeMeta": {
                    "nodeId": "0xfDAEaf7afCFbb4e4d16DC66bD2039fd6004CFce8",
                    "role": "A",
                    "tsMillis": 1692281454034
                },
                "signature": "0x51a7216a97e180876c0da7a74ab2e3e2ea2d3484a29d1488853eb1f76540f078470d421386664adc26a57959f72df2a62e173ed4a678560c8167cf89d9d417ba1c"
            }
        ]
    ],
    "attestToken": "eyJub2RlcyI6W3sibm9kZUlkIjoiMHhmREFFYWY3YWZDRmJiNGU0ZDE2REM2NmJEMjAzOWZkNjAwNENGY2U4IiwidHNNaWxsaXMiOjE2OTIyODE0MzAwMjcsInJhbmRvbUhleCI6ImQ0OWM1NjY3MGVkNzIwZDQ1MDFkMjYzNmQ0YWY2MWI2OGEwNzJkZGMiLCJwaW5nUmVzdWx0cyI6W3sibm9kZUlkIjoiMHg4ZTEyZEUxMkMzNWVBQmYzNWI1NmIwNEU1M0M0RTQ2OGU0NjcyN0U4IiwidHNNaWxsaXMiOjE2OTIyODE0MDAwMzQsInN0YXR1cyI6MX1dLCJzaWduYXR1cmUiOiIweDlhNTFkNDU3MjM4ZGMzODM3MDgxNWM5Yzc0ZTdhZGMwNjE1YjdkMTc0OTU5YmViNmJlMDI1NTc5MzM0YmQyOTg1MDE1MGFjMjY0YTEyZGVhYzIxMmVjODc2ZjkyMjNmYTJkZmU3Y2MyOTE3ZDZjN2E5MjQ3MThkZDNhMjM1ZGNmMWIifSx7Im5vZGVJZCI6IjB4OGUxMmRFMTJDMzVlQUJmMzViNTZiMDRFNTNDNEU0NjhlNDY3MjdFOCIsInRzTWlsbGlzIjoxNjkyMjgxNDMwMDM1LCJyYW5kb21IZXgiOiIwOWNkYTI3ZTdmNzE2MmNhYmM4YzRiY2NiZDc2NjNhZGEyNTg0YzBkIiwicGluZ1Jlc3VsdHMiOlt7Im5vZGVJZCI6IjB4ZkRBRWFmN2FmQ0ZiYjRlNGQxNkRDNjZiRDIwMzlmZDYwMDRDRmNlOCIsInRzTWlsbGlzIjoxNjkyMjgxNDMwMDIwLCJzdGF0dXMiOjF9XSwic2lnbmF0dXJlIjoiMHgwOWRhNjg3NGMyNmVhNzAxODZlY2U4NWJiMWM1OWU0YjA5MjUxYTcwZTY5MmJlYjJlNmNkM2FjMDMyMmViN2ZhNDM2MmM3ZTRhZWY2ZmVmMzQyMDJjNGQ3ZmRkYjRjMTQ0ZWJjMGFkMWE5NmZlZGYwMzViNTVjMDg4MDM3MWI2ODFiIn1dfQ=="
}
 */
export class MessageBlock {
  id: string
  // input (filled by NetworkRole.VALIDATOR)
  requests: PayloadItem[] = []
  // output (filled by NetworkRole.VALIDATOR)
  attestToken: string
  // output (filled by NetworkRole.VALIDATOR)
  responses: FeedItem[] = [] // [feedItem]
  // output (filled by NetworkRole.VALIDATOR at [0], NetworkRole.ATTESTER at [1+])
  responsesSignatures: FeedItemSig[][] = [] // [feedItem] [signatures]

  // stages
  // randao: any;                          // todo secure random vector, which defines applied validators
  // blockValidatorSig: VSignature[];       // first validator who produced that block
  // blockStorageSig: VSignature[];         // snodes which store that block
}

export class MessageBlockSignatures {
  id: string
  responsesSignatures: FeedItemSig[][] = []
}

export enum NetworkRole {
  VALIDATOR = 'V',
  ATTESTER = 'A',
  STORAGE = 'S',
  DELIVERY = 'D'
}

export class NodeMeta {
  nodeId: string // uniq node id, this is eth wallet, ex: 0xAAAAAAA
  role: NetworkRole // validator, attester               ex: "V"
  tsMillis: number // timestamp, ms                     ex: 1999999
}

/*
ex:
{
    "nodeMeta": {
        "nodeId": "0xfDAEaf7afCFbb4e4d16DC66bD2039fd6004CFce8",
        "role": "A",
        "tsMillis": 1692199658713
    },
    "data": {
        "recipientsMissing" : [{
            "sid" : "e9fd5df5-d782-4196-9072-f912053bf96c",
            "recipients": [
                {"addr" : "eip155:0xd8634c39bbfd4033c0d3289c4515275102423681"}
            ],
        }]
    },
    "signature": "0xf46f12e12c8b1a7b15a38702f01db62a081c6906fd0839cef077f567e8bbb0b4603b51ca004b43714d9cb4032aefc6ef63646d0fa1fdb8281ff5f824efe4959c1c"
}
 */
export class FeedItemSig {
  data: FISData | null
  nodeMeta: NodeMeta // empty, until signed
  signature: string // empty, until signed

  constructor(data: FISData, nodeMeta: NodeMeta, signature: string) {
    this.data = data
    this.nodeMeta = nodeMeta
    this.signature = signature
  }
}

export class FISData {
  recipientsMissing?: RecipientsMissing
}

export class RecipientsMissing {
  sid: string
  recipients: RecipientMissing[] = []
}

export class RecipientMissing {
  addr: string
}

// see MySql:feeds
export class FeedItem {
  header: FHeader
  payload: FPayload
}

export class FHeader {
  sender: string // ex: eip155:1:0x6500
  recipientsResolved: Recipient[] // ex: eip155:1:0x0700 or a list of recipients
  senderType: number // ex: #SenderType.CHANNEL
  source: string // ex: ETH_MAINNET
  // verification: string;   // ex: eip712v2:0xFO00::uid::3F // todo Check that this is not needed
  // subscribed:boolean;    //,         ex: true
  // isSpam:boolean;        //,             ex: true
}

export class Recipient {
  addr: string
  ts: number
}

export class FNotification {
  title: string
  body: string
}

export enum SenderType {
  CHANNEL = 0,
  W2W = 1,
  PUSH_VIDEO = 2,
  PUSH_SPACE = 3
}

export class FPayload {
  data: FData
  notification: FNotification
  sectype: string
  recipients: any
  verificationProof: any
}

export class FData {
  app: string
  sid: string
  url: string
  acta: string
  aimg: string
  amsg: string
  asub: string
  icon: string
  type: number
  epoch: string
  etime: string
  sectype: string
  hidden: string // 0 or 1
  videoMeta: any
}

// see PayloadService.addExternalPayload
export class PayloadItem {
  // ex: AAAZZ-AAAAA-BBBB
  id: string
  // ex: eip712v2:0xFO00::uid::3F
  verificationProof: string
  // ex: eip155:1:0x6500
  sender: string
  // ex: #SenderType.CHANNEL
  senderType: number = SenderType.CHANNEL
  // ex: eip155:1:0x0700
  recipient: string
  // ex: ETH_MAINNET
  source: string
  // ex: 2+{"title":"test", "body":"test2", "data":{"acta":"", "aimg":"","amsg":""}}
  identityBytes: any

  validatorToken: string

  public constructor(
    payloadId: string,
    verificationProof: string,
    sender: string,
    senderType: number = SenderType.CHANNEL,
    recipient: string,
    source: string,
    identityBytes: any,
    validatorToken?: string
  ) {
    this.id = payloadId
    this.verificationProof = verificationProof
    this.sender = sender
    this.senderType = senderType
    this.recipient = recipient
    this.source = source
    this.identityBytes = identityBytes
    this.validatorToken = validatorToken
  }
}

export class MessageBlockUtil {
  public static log: Logger = WinstonUtil.newLog(MessageBlockUtil)

  /**
   * Calculates which addresses will receive messages
   * as a result of processing this block.request[requestOffset]
   * by a delivery node
   *
   * @param block
   * @param requestOffset search by an offset
   * @param requestSid OR search by sid
   */
  static calculateRecipients(
    block: Readonly<MessageBlock>,
    requestOffset: number,
    requestSid?: string
  ): string[] {
    if (requestOffset == null) {
      requestOffset = block.requests.findIndex((value) => value.id === requestSid)
    }
    Check.isTrue(requestOffset >= 0, 'requestOffset not found')
    const recipientsV = block.responses[requestOffset].header.recipientsResolved
    const signaturesA = block.responsesSignatures[requestOffset]
    const allRecipients = Coll.arrayToMap(recipientsV, 'addr')
    for (const signatureA of signaturesA) {
      const recipientsMissing = signatureA.data.recipientsMissing
      if (recipientsMissing != null) {
        for (const itemToRemove of recipientsMissing.recipients) {
          allRecipients.delete(itemToRemove.addr)
        }
      }
    }
    return Array.from(allRecipients.keys())
  }

  static calculateHash(block: Readonly<MessageBlock>) {
    return ObjectHasher.hashToSha256(block)
  }

  /**
   * Evaluates all messageBlock target recipients (normally these are addresses)
   * for every included packet
   *
   * And for every recipient finds which shard will host this address
   *
   * @param block
   * @param shardCount total amount of shards; see smart contract for this value
   * @returns a set of shard ids
   */
  static calculateAffectedShards(block: Readonly<MessageBlock>, shardCount: number): Set<number> {
    const shards = new Set<number>()
    for (const fi of block.responses) {
      for (const recipient of fi.header.recipientsResolved) {
        let shardId = this.calculateAffectedShard(recipient.addr, shardCount);
        if (shardId == null) {
          this.log.error('cannot calculate shardId for recipient %o in %o', recipient, fi);
          continue;
        }
        shards.add(shardId)
      }
    }
    return shards
  }

  // 1) try to get first byte from caip address
  // eip155:5:0xD8634C39BBFd4033c0d3289C4515275102423681 -> d8 -> 216
  // and use it as shard
  // 2) take sha256(addr) ->
  // shard count is a smart contract constant; normally it should never change
  // lets read this value from a contract
  public static calculateAffectedShard(recipientAddr: string, shardCount: number): number | null {
    if (StrUtil.isEmpty(recipientAddr)) {
      return null;
    }
    let shardId: number = null
    const addrObj = EthUtil.parseCaipAddress(recipientAddr)
    if (addrObj != null
      && !StrUtil.isEmpty(addrObj.addr)
      && addrObj.addr.startsWith('0x')
      && addrObj.addr.length > 4) {
      const firstByteAsHex = addrObj.addr.substring(2, 4).toLowerCase();
      shardId = Number.parseInt(firstByteAsHex, 16);
    }
    // 2) try to get sha256 otherwise
    if (shardId == null) {
      const firstByteAsHex = ObjectHasher.hashToSha256(recipientAddr).toLowerCase().substring(0, 2);
      shardId = Number.parseInt(firstByteAsHex, 16);
    }
    Check.notNull(shardId);
    Check.isTrue(shardId >= 0 && shardId <= 255 && NumUtil.isRoundedInteger(shardId));
    Check.isTrue(shardCount >= 1);
    return shardId % shardCount;
  }

  public static checkBlock(block: MessageBlock, validatorsFromContract: Set<string>): CheckResult {
    if (block.requests.length != block.responses.length) {
      return CheckResult.failWithText(
        `message block has incorrect length ${block.requests.length}!=${block.responses.length}`
      )
    }
    const blockValidatorNodeId = null
    const item0sig0 = block.responsesSignatures[0][0]
    if (
      item0sig0?.nodeMeta.role != NetworkRole.VALIDATOR ||
      StrUtil.isEmpty(item0sig0?.nodeMeta.nodeId)
    ) {
      return CheckResult.failWithText('first signature is not performed by a validator')
    }
    const result: FeedItemSig[] = []
    for (let i = 0; i < block.responses.length; i++) {
      const payloadItem = block.requests[i]
      const fi = block.responses[i]
      // check signatures
      const feedItemSignatures = block.responsesSignatures[i]
      for (let j = 0; j < feedItemSignatures.length; j++) {
        const fiSig = feedItemSignatures[j]
        if (j == 0) {
          if (fiSig.nodeMeta.role != NetworkRole.VALIDATOR) {
            return CheckResult.failWithText(
              `First signature on a feed item should be  ${NetworkRole.VALIDATOR}`
            )
          }
        } else {
          if (fiSig.nodeMeta.role != NetworkRole.ATTESTER) {
            return CheckResult.failWithText(
              `2+ signature on a feed item should be  ${NetworkRole.ATTESTER}`
            )
          }
        }
        const valid = EthSig.check(
          fiSig.signature,
          fiSig.nodeMeta.nodeId,
          fi,
          fiSig.data,
          fiSig.nodeMeta
        )
        if (!valid) {
          return CheckResult.failWithText(
            `signature is not valid: replyOffset ${i} sigOffset ${j} :   ${JSON.stringify(fiSig)} `
          )
        } else {
          this.log.debug('valid signature %o', fiSig)
        }
        const validNodeId = validatorsFromContract.has(fiSig.nodeMeta.nodeId)
        if (!validNodeId) {
          return CheckResult.failWithText(
            `${fiSig.nodeMeta.nodeId} is not a valid nodeId from a contract`
          )
        } else {
          this.log.debug('valid nodeId %o', fiSig.nodeMeta.nodeId)
        }
      }
    }
    return CheckResult.ok()
  }
}

export class CheckResult {
  success: boolean
  err: string

  static failWithText(err: string): CheckResult {
    return {success: false, err: err}
  }

  static ok(): CheckResult {
    return {success: true, err: ''}
  }
}
