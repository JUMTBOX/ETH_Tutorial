const Transaction = require("./index");

class TransactionQueue {
  /** @type {{[key:string]: Transaction}} */
  transactionMap;

  constructor() {
    this.transactionMap = {};
  }

  /** @param {Transaction} transaction */
  add(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  getTransactionSeries() {
    return Object.values(this.transactionMap);
  }
  /** @param {{transactionSeries: Transaction[]}} */
  clearBlockTransactions({ transactionSeries }) {
    for (let transaction of transactionSeries) {
      delete this.transactionMap[transaction.id];
    }
  }
}

module.exports = TransactionQueue;
