const { v4: uuid } = require("uuid");
const Account = require("../account");
const State = require("../store/state");
const { MINING_REWARD } = require("../config");

/**
 * @readonly
 * @enum {string}
 */
const TRANSACTION_TYPE_MAP = {
  CREATE_ACCOUNT: "CREATE_ACCOUNT",
  TRANSACT: "TRANSACT",
  MINING_REWARD: "MINING_REWARD",
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
 * @property {string} beneficiary
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
  static createTransaction({ account, to, value, beneficiary }) {
    if (!!beneficiary) {
      return new Transaction({
        to: beneficiary,
        value: MINING_REWARD,
        data: { type: TRANSACTION_TYPE_MAP.MINING_REWARD },
      });
    }

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
  /** @param {{transaction: Transaction, state: State}} */
  static validateStandardTransaction({ transaction, state }) {
    return new Promise((res, rej) => {
      const { id, from, to, signature, value } = transaction;
      const transactionData = { ...transaction };

      delete transactionData.signature;
      if (
        !Account.verifySignature({
          publicKey: from,
          data: transactionData,
          signature,
        })
      ) {
        return rej(new Error(`Transaction: ${id} signature is invalid`));
      }

      const { balance: fromBalance } = state.getAccount({ address: from });

      if (value > fromBalance) {
        return rej(
          new Error(
            `Transaction value: ${value} exceeds balance: ${fromBalance}`
          )
        );
      }

      const toAccount = state.getAccount({ address: to });
      if (!toAccount) {
        return rej(new Error(`The to field: ${to} does not exist`));
      }
      return res();
    });
  }
  /** @param {{transaction: Transaction}} */
  static validateMiningRewardTransaction({ transaction }) {
    return new Promise((res, rej) => {
      const { value } = transaction;

      if (value !== MINING_REWARD) {
        return rej(
          new Error(
            `The provided mining reward value : ${value} does not equal` +
              `the official value: ${MINING_REWARD}`
          )
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

  /** @param {{transactionSeries: Transaction [], state: State}} */
  static validateTransactionSeries({ transactionSeries, state }) {
    return new Promise(async (res, rej) => {
      for (let transaction of transactionSeries) {
        try {
          switch (transaction.data.type) {
            case TRANSACTION_TYPE_MAP.CREATE_ACCOUNT:
              await Transaction.validateCreateAccountTransaction({
                transaction,
                state,
              });
              break;
            case TRANSACTION_TYPE_MAP.TRANSACT:
              await Transaction.validateStandardTransaction({
                transaction,
                state,
              });
              break;
            case TRANSACTION_TYPE_MAP.MINING_REWARD:
              await Transaction.validateMiningRewardTransaction({
                transaction,
                state,
              });
              break;
            default:
              break;
          }
        } catch (e) {
          return rej(e);
        }
      }

      return res();
    });
  }

  /** @param {{transaction: Transaction, state: State}}  */
  static runTransaction({ transaction, state }) {
    switch (transaction.data.type) {
      case TRANSACTION_TYPE_MAP.TRANSACT: {
        Transaction.runStandardTransaction({ transaction, state });
        console.info(
          " -- Updated account data to reflect the standard transaction"
        );
        break;
      }
      case TRANSACTION_TYPE_MAP.CREATE_ACCOUNT: {
        Transaction.runCreateAccountTransaction({ transaction, state });
        console.info("-- Stored the account data");
        break;
      }
      case TRANSACTION_TYPE_MAP.MINING_REWARD: {
        Transaction.runMiningRewardTransaction({ transaction, state });
        console.info(" -- Updated account data to reflect the mining reward");
        break;
      }
      default:
        break;
    }
  }

  /** @param {{transaction: Transaction, state: State}}  */
  static runStandardTransaction({ transaction, state }) {
    const { value, from, to } = transaction;
    const fromAccount = state.getAccount({ address: from });
    const toAccount = state.getAccount({ address: to });

    fromAccount.balance -= value;
    toAccount.balance += value;

    state.putAccout({ address: from, accountData: fromAccount });
    state.putAccout({ address: to, accountData: toAccount });
  }

  /** @param {{transaction: Transaction, state: State}}  */
  static runCreateAccountTransaction({ transaction, state }) {
    const {
      data: { accountData },
    } = transaction;
    const { address } = accountData;

    state.putAccout({ address, accountData });
  }

  /** @param {{transaction: Transaction, state: State}}  */
  static runMiningRewardTransaction({ transaction, state }) {
    const { to, value } = transaction;
    const accountData = state.getAccount({ address: to });

    accountData.balance += value;

    state.putAccout({ address: to, accountData });
  }
}

module.exports = Transaction;
