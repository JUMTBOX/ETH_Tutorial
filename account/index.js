const { ec, keccakHash } = require("../util/index");
const { STARTING_BALANCE } = require("../config");

class Account {
  /**@type {ec.keyPair} */
  keyPair;
  /**@type {string} */
  address;
  /**@type {number} */
  balance;
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic().encode("hex");
    this.balance = STARTING_BALANCE;
  }

  sign(data) {
    return this.keyPair.sign(keccakHash(data));
  }

  toJSON() {
    const { address, balance } = this;
    return {
      address,
      balance,
    };
  }

  static verifySignature({ publicKey, data, signature }) {
    const keyFromPublic = ec.keyFromPublic(publicKey, "hex");

    return keyFromPublic.verify(keccakHash(data), signature);
  }
}

module.exports = Account;
