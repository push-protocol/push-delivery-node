import EthCrypto from 'eth-crypto'
import { encrypt } from 'eccrypto'
import { publicKeyConvert } from 'secp256k1-v4'
const publicKeyToAddress = require('ethereum-public-key-to-address')

module.exports = {
    // To Form Encryted Secret, no more than 15 characters supported
    encryptWithECIES: async function (message, publicKey) {
        const compressedKey = EthCrypto.publicKey.compress(publicKey)
        const encryptedSecret = await this.encryptWithPublicKey(
            message,
            compressedKey
        )
        return encryptedSecret
    },
    // Encryption with public key
    encryptWithPublicKey: async function (message, publicKey) {
        // Convert compressed public key, starts with 03 or 04
        const pubKeyUint8Array = Uint8Array.from(new Buffer(publicKey, 'hex'))
        const convertedKeyAsUint8Array = publicKeyConvert(
            pubKeyUint8Array,
            false
        )
        const convertedPublicKeyHex = new Buffer(convertedKeyAsUint8Array)
        const pubKey = new Buffer(convertedPublicKeyHex, 'hex')

        return encrypt(pubKey, Buffer(message)).then((encryptedBuffers) => {
            const cipher = {
                iv: encryptedBuffers.iv.toString('hex'),
                ephemPublicKey: encryptedBuffers.ephemPublicKey.toString('hex'),
                ciphertext: encryptedBuffers.ciphertext.toString('hex'),
                mac: encryptedBuffers.mac.toString('hex'),
            }
            // use compressed key because it's smaller
            // const compressedKey = new Buffer.from(publicKeyConvert(Web3Helper.getUint8ArrayFromHexStr(cipher.ephemPublicKey), true)).toString('hex')
            const input = Uint8Array.from(
                new Buffer(cipher.ephemPublicKey, 'hex')
            )
            const keyConvert = publicKeyConvert(input, true)
            const keyConvertBuffer = new Buffer(keyConvert)
            const compressedKey = keyConvertBuffer.toString('hex')
            const ret = Buffer.concat([
                new Buffer(cipher.iv, 'hex'), // 16bit
                new Buffer(compressedKey, 'hex'), // 33bit
                new Buffer(cipher.mac, 'hex'), // 32bit
                new Buffer(cipher.ciphertext, 'hex'), // var bit
            ]).toString('hex')
            return ret
        })
    },

    // Get Public Key from Private Key
    getWalletFromUncompressedPublicKey: function (publicKey) {
        const compressedKey = EthCrypto.publicKey.compress(publicKey)
        return publicKeyToAddress(compressedKey)
    },
}
