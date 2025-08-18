const Transaction = require("./index");

class TransactionQueue {
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
}

module.exports = TransactionQueue;
