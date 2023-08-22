import {Wallet} from "ethers";
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
        const ethMessage = ObjectHasher.hashToSha256IgnoreSig(object);
        const sig = await wallet.signMessage(ethMessage);
        return sig;
    }

    public static check(sig: string, targetWallet: string, ...object: any[]): boolean {
        const ethMessage = ObjectHasher.hashToSha256IgnoreSig(object);
        const verificationAddress = verifyMessage(ethMessage, sig);
        if (targetWallet !== verificationAddress) {
            return false;
        }
        return true;
    }

    public static isEthZero(addr: string) {
        return '0x0000000000000000000000000000000000000000' === addr
    }
}

export function Signed(target: Function) {
}