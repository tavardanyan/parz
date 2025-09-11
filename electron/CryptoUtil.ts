// @ts-nocheck

import Cryptr from 'cryptr';


export class CryptoUtil {
  cryptr: any;

  constructor(secret: string) {
    this.cryptr = new Cryptr(secret);
  }

  encrypt(text: string): string {
    console.log(this.cryptr.encrypt(text))
    return this.cryptr.encrypt(text);
  }

  decrypt(encryptedText: string): string {
    return this.cryptr.decrypt(encryptedText);
  }
}
// Usage
// const secret = 'mySuperSecretKey123!';
// const cryptoUtil = new CryptoUtil(secret);

// const encrypted = cryptoUtil.encrypt('Hello World!');
// console.log('Encrypted:', encrypted);

// const decrypted = cryptoUtil.decrypt(encrypted);
// console.log('Decrypted:', decrypted);
