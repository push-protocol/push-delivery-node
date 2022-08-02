
var CryptoJS = require('crypto-js');

import EthCrypto from 'eth-crypto';
import { encrypt, decrypt } from 'eccrypto';
import { publicKeyConvert } from 'secp256k1-v4';

const publicKeyToAddress = require('ethereum-public-key-to-address');

module.exports = {

  // To Form Encryted Secret, no more than 15 characters supported
  encryptWithECIES: async function(message, publicKey) {
    const compressedKey = EthCrypto.publicKey.compress(publicKey);

    const encryptedSecret = await this.encryptWithPublicKey(message, compressedKey);

    // Not using it since sqlite2 has some error with this
    // const compressedEncryptedSecret = EthCrypto.hex.compress(encryptedSecret);

    return encryptedSecret;
  },
  // To Form Decrypted Secret, no more than 15 characters supported
  decryptWithECIES: async function(message, privateKey) {
    // Message is always compressed, not using because sqlite2 has some error with this
    //const uncompressedMessage = EthCrypto.hex.decompress(message).substr(2); // to remove 0x

    return await this.decryptWithPrivateKey(message, privateKey);
  },
  // Encryption with public key
  encryptWithPublicKey: async function(message, publicKey) {
    // Convert compressed public key, starts with 03 or 04
    const pubKeyUint8Array = Uint8Array.from(new Buffer(publicKey, 'hex'));
    //console.log("[ENCRYPTION] Public Key Uint8Array: " + pubKeyUint8Array);

    const convertedKeyAsUint8Array = publicKeyConvert(pubKeyUint8Array, false);
    //console.log("[ENCRYPTION] Public Key Converted: " + convertedKeyAsUint8Array);

    const convertedPublicKeyHex = new Buffer(convertedKeyAsUint8Array);
    //console.log("[ENCRYPTION] Converted Public Key Buffer: " + convertedPublicKeyHex);

    const pubKey = new Buffer(convertedPublicKeyHex, 'hex');
    //console.log("[ENCRYPTION] pubkey getting sentout for encrypt: " + pubKey);

    return encrypt(pubKey, Buffer(message)).then(encryptedBuffers => {
      const cipher = {
        iv: encryptedBuffers.iv.toString('hex'),
        ephemPublicKey: encryptedBuffers.ephemPublicKey.toString('hex'),
        ciphertext: encryptedBuffers.ciphertext.toString('hex'),
        mac: encryptedBuffers.mac.toString('hex')
      };
      // use compressed key because it's smaller
      // const compressedKey = new Buffer.from(publicKeyConvert(Web3Helper.getUint8ArrayFromHexStr(cipher.ephemPublicKey), true)).toString('hex')
      const input = Uint8Array.from(new Buffer(cipher.ephemPublicKey, 'hex'));
      const keyConvert = publicKeyConvert(input, true);
      // console.log("[ENCRYPTION] Coverted key: " + keyConvert);

      const keyConvertBuffer = new Buffer(keyConvert);
      // console.log("[ENCRYPTION] Coverted key in buffer : " + keyConvertBuffer);
      // console.log(keyConvertBuffer);

      //console.log(keyConvert);
      const compressedKey = keyConvertBuffer.toString('hex');
      // console.log("[ENCRYPTION] Compressed key in buffer : ");
      // console.log(compressedKey);

      const ret = Buffer.concat([
        new Buffer(cipher.iv, 'hex'), // 16bit
        new Buffer(compressedKey, 'hex'), // 33bit
        new Buffer(cipher.mac, 'hex'), // 32bit
        new Buffer(cipher.ciphertext, 'hex') // var bit
      ]).toString('hex');

      return ret;
    });
  },
  
  // Get Public Key from Private Key
  getWalletFromUncompressedPublicKey: function(publicKey) {
    const compressedKey = EthCrypto.publicKey.compress(publicKey);
    return publicKeyToAddress(compressedKey);
  }
};
