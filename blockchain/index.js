const Block = require("./block");

class Blockchain {
  /** @type {Array<Block>}  */
  chain;
  constructor() {
    this.chain = [Block.genesis()];
  }

  /** @param {{block: Block}} */
  addBlock({ block }) {
    return new Promise((res, rej) => {
      Block.validateBlock({
        lastBlock: this.chain[this.chain.length - 1],
        block,
      })
        .then(() => {
          this.chain.push(block);
          return res();
        })
        .catch(rej);
    });
  }
}

module.exports = Blockchain;
