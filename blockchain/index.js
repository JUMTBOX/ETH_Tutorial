const State = require("../store/state");
const TransactionQueue = require("../transaction/transaction-queue");
const Block = require("./block");

class Blockchain {
  /** @type {Array<Block>}  */
  chain;
  /** @type {State} */
  state;

  /** @param {{state: State}} */
  constructor({ state }) {
    this.chain = [Block.genesis()];
    this.state = state;
  }

  /** @param {{block: Block, transactionQueue: TransactionQueue}} */
  addBlock({ block, transactionQueue }) {
    return new Promise((res, rej) => {
      Block.validateBlock({
        lastBlock: this.chain[this.chain.length - 1],
        block,
      })
        .then(() => {
          this.chain.push(block);

          Block.runBlock({ block, state: this.state });

          transactionQueue.clearBlockTransactions({
            transactionSeries: block.transactionSeries,
          });
          return res();
        })
        .catch(rej);
    });
  }

  /**@param {{chain:Block[]}} */
  replaceChain({ chain }) {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < chain.length; i++) {
        const block = chain[i];
        const lastBlockIdx = i - 1;
        const lastBlock = lastBlockIdx >= 0 ? chain[i - 1] : null;

        try {
          await Block.validateBlock({ lastBlock, block });
          Block.runBlock({ block, state: this.state });
        } catch (e) {
          return reject(e);
        }

        console.log(`*-- Validated block number: ${block.blockHeaders.number}`);
      }

      this.chain = chain;

      return resolve();
    });
  }
}

module.exports = Blockchain;
