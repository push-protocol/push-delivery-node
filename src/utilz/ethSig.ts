import {Wallet} from "ethers";
import {Logger} from "winston";
import {Container} from "typedi";
import {verifyMessage} from "ethers/lib/utils";
import {ObjectHasher} from "./objectHasher";

/**
 * Utitily class that allows
 * - to sign objects with an eth private key
 * - to check that signature later
 *
 * Ignores 'signature' properties
 */
export class EthSig {

    public static async create(wallet: Wallet, ...object: any[]): Promise<string> {
        let ethMessage = ObjectHasher.hashToSha256IgnoreSig(object);
        let sig = await wallet.signMessage(ethMessage);
        return sig;
    }

    public static check(sig: string, targetWallet: string, ...object: any[]): boolean {
        let ethMessage = ObjectHasher.hashToSha256IgnoreSig(object);
        let verificationAddress = verifyMessage(ethMessage, sig);
        if (targetWallet !== verificationAddress) {
            return false;
        }
        return true;
    }
}

export function Signed(target: Function) {
}