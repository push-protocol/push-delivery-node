import {EventEmitter} from "events";

import IdUtil from "./idUtil";

export class WaitNotify {
    ee: EventEmitter;
    waitMsgIDs = [];

    constructor() {
        this.ee = new EventEmitter();
        this.waitMsgIDs = [];
    }

    async wait(timeout:number = 0) {
        return new Promise<void>((resolve, reject) => {
            const msgID = IdUtil.getUuidV4();
            this.waitMsgIDs.push(msgID);
            let timeoutId;
            this.ee.once(msgID, () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                resolve();
            });
            if (timeout) {
                timeoutId = setTimeout(() => {
                    const delIndex = this.waitMsgIDs.indexOf(msgID);
                    if (delIndex !== -1) {
                        this.waitMsgIDs.splice(delIndex, 1);
                        reject(new Error('wait timeout'));
                    }
                }, timeout);
            }
        });
    }

    notify() {
        this.notifyAll();
    }

    notifyAll() {
        while (this.waitMsgIDs.length > 0) {
            this.ee.emit(this.waitMsgIDs.shift());
        }
    }

    notifyOne() {
        this.ee.emit(this.waitMsgIDs.shift());
    }
}