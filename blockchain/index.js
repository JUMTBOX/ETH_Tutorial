const Block = require("./block");

class Blockchain {
  /** @type {Array<Block>}  */
  chain;
  constructor() {
    this.chain = [Block.genesis()];
  }

  /** @param {{block: Block}} */
  addBlock({ block }) {
    this.chain.push(block);
  }
}

module.exports = Blockchain;
