
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
export class MessageBlock {
    id: string;
    // input (filled by NetworkRole.VALIDATOR)
    requests: PayloadItem[] = [];
    // output (filled by NetworkRole.VALIDATOR)
    attestToken: string;
    // output (filled by NetworkRole.VALIDATOR)
    responses: FeedItem[] = [];                // [feedItem]
    // output (filled by NetworkRole.VALIDATOR at [0], NetworkRole.ATTESTER at [1+])
    responsesSignatures: FeedItemSig[][] = []; // [feedItem] [signatures]

    // stages
    // randao: any;                          // todo secure random vector, which defines applied validators
    // blockValidatorSig: VSignature[];       // first validator who produced that block
    // blockStorageSig: VSignature[];         // snodes which store that block
}

export enum NetworkRole {
    VALIDATOR = "V",
    ATTESTER = "A",
    STORAGE = "S",
    DELIVERY = "D"
}


export class NodeMeta {
    nodeId: string;       // uniq node id, this is eth wallet, ex: 0xAAAAAAA
    role: NetworkRole;    // validator, attester               ex: "V"
    tsMillis: number;     // timestamp, ms                     ex: 1999999
}


export class FeedItemSig {
    nodeMeta: NodeMeta; // empty, until signed
    signature: string;  // empty, until signed


    constructor(nodeMeta: NodeMeta, signature: string) {
        this.nodeMeta = nodeMeta;
        this.signature = signature;
    }
}

// see MySql:feeds
export class FeedItem {
    header: FHeader;
    payload: FPayload;
}

export class FHeader {
    sender: string;         // ex: eip155:1:0x6500
    recipients: string[];    // ex: eip155:1:0x0700 or a list of recipients
    senderType: number;     // ex: #SenderType.CHANNEL
    source: string;         // ex: ETH_MAINNET
    // verification: string;   // ex: eip712v2:0xFO00::uid::3F // todo Check that this is not needed
    // subscribed:boolean;    //,         ex: true
    // isSpam:boolean;        //,             ex: true

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

// see PayloadService.addExternalPayload
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
