const { v4: uuid } = require("uuid");
const Account = require("../account");

/**
 * @readonly
 * @enum {string}
 */
const TRANSACTION_TYPE_MAP = {
  CREATE_ACCOUNT: "CREATE_ACCOUNT",
  TRANSACT: "TRANSACT",
};

/**
 * @typedef  {Object} TransactionFields
 * @property {string|undefined} id
 * @property {string|undefined} from
 * @property {string|undefined} to
 * @property {number|undefined} value
 * @property {{type: TRANSACTION_TYPE_MAP, accountData: Partial<Account> | undefined}} data
 * @property {string|undefined} signature
 */

/**
 * @typedef {Object} CTParam
 * @property {Account} account
 * @property {string} to
 * @property {number} value
 */

class Transaction {
  /**@type {string} */
  id;
  /**@type {string} */
  from;
  /**@type {string} */
  to;
  /**@type {number} */
  value;
  /**@type {string} */
  signature;
  data;

  /** @param {TransactionFields} */
  constructor({ id, from, to, value, data, signature }) {
    this.id = id || uuid();
    this.from = from || "-";
    this.to = to || "-";
    this.value = value || 0;
    this.data = data || "-";
    this.signature = signature || "-";
  }

  /** @param {CTParam}*/
  static createTransaction({ account, to, value }) {
    if (!!to) {
      const transactionData = {
        id: uuid(),
        from: account.address,
        to,
        value,
        data: { type: TRANSACTION_TYPE_MAP.TRANSACT },
      };

      return new Transaction({
        ...transactionData,
        signature: account.sign(transactionData),
      });
    }

    return new Transaction({
      data: {
        type: TRANSACTION_TYPE_MAP.CREATE_ACCOUNT,
        accountData: account.toJSON(),
      },
    });
  }
  /** @param {{transaction: Transaction}} */
  static validateStandardTransaction({ transaction }) {
    return new Promise((res, rej) => {
      const { from, signature } = transaction;
      const transactionData = { ...transaction };

      delete transactionData.signature;
      if (
        !Account.verifySignature({
          publicKey: from,
          data: transactionData,
          signature,
        })
      ) {
        return rej(
          new Error(`Transaction: ${transaction.id} signature is invalid`)
        );
      }

      return res();
    });
  }
  /** @param {{transaction: Transaction}} */
  static validateCreateAccountTransaction({ transaction }) {
    return new Promise((res, rej) => {
      const expectedAccountDataFields = Object.keys(new Account().toJSON());
      const fields = Object.keys(transaction.data.accountData);

      if (fields.length !== expectedAccountDataFields.length) {
        return rej(
          new Error(
            "The transaction account data has an incorrect number of fields"
          )
        );
      }

      fields.forEach((field) => {
        if (!expectedAccountDataFields.includes(field)) {
          return rej(
            new Error(`The field: ${field}, is unexpected for account data`)
          );
        }
      });
      return res();
    });
  }
}

module.exports = Transaction;
