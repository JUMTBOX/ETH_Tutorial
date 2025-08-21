const { GENESIS_DATA, MINE_RATE } = require("../config");
const State = require("../store/state");
const Trie = require("../store/trie");
const Transaction = require("../transaction");
const { keccakHash } = require("../util/index");

const HASH_LENGTH = 64;
const MAX_HASH_VALUE = parseInt("f".repeat(HASH_LENGTH), 16);
const MAX_NONCE_VALUE = 2 ** 64;

/**
 * @typedef BlockHeader
 * @property {number|undefined} difficulty
 * @property {number|undefined} timestamp
 * @property {number|undefined} number
 * @property {string|undefined} parentHash
 * @property {number|undefined} nonce
 * @property {object|undefined} beneficiary
 * @property {string} transactionRoot
 * @property {string} stateRoot
 */
class Block {
  /** @type {BlockHeader} */
  blockHeaders;
  /** @type {Transaction[]} */
  transactionSeries;

  /** @param {{blockHeaders: BlockHeader, transactionSeries: Transaction[]}} */
  constructor({ blockHeaders, transactionSeries }) {
    this.blockHeaders = blockHeaders;
    this.transactionSeries = transactionSeries;
  }

  /** @param {{lastBlock:Block}} */
  static calculateBlockTargetHash({ lastBlock }) {
    const value = (MAX_HASH_VALUE / lastBlock.blockHeaders.difficulty).toString(
      16
    );
    if (value.length > HASH_LENGTH) {
      return "f".repeat(HASH_LENGTH);
    }

    return "0".repeat(HASH_LENGTH - value.length) + value;
  }

  /** @param {{lastBlock:Block, timestamp:number }}  */
  static adjustDifficulty({ lastBlock, timestamp }) {
    const { difficulty } = lastBlock.blockHeaders;

    if (timestamp - lastBlock.blockHeaders.timestamp > MINE_RATE) {
      return difficulty - 1;
    }

    if (difficulty < 1) {
      return 1;
    }

    return difficulty + 1;
  }

  /** @param {{lastBlock:Block, beneficiary: object, transactionSeries: Transaction[], stateRoot:string}} */
  static mineBlock({ lastBlock, beneficiary, transactionSeries, stateRoot }) {
    const target = Block.calculateBlockTargetHash({ lastBlock });

    const miningRewardTransaction = Transaction.createTransaction({
      beneficiary,
    });
    transactionSeries.push(miningRewardTransaction);

    const transactionTrie = Trie.buildTrie({ items: transactionSeries });
    let timestamp, truncatedBlockHeaders, header, nonce, underTargetHash;

    do {
      timestamp = Date.now();
      truncatedBlockHeaders = {
        parentHash: keccakHash(lastBlock.blockHeaders),
        beneficiary,
        difficulty: Block.adjustDifficulty({ lastBlock, timestamp }),
        number: lastBlock.blockHeaders.number + 1,
        timestamp,
        transactionRoot: transactionTrie.rootHash,
        stateRoot,
      };

      header = keccakHash(truncatedBlockHeaders);
      nonce = Math.floor(Math.random() * MAX_NONCE_VALUE);

      underTargetHash = keccakHash(header + nonce);
    } while (underTargetHash > target);

    return new this({
      blockHeaders: { ...truncatedBlockHeaders, nonce },
      transactionSeries,
    });
  }

  static genesis() {
    return new this(GENESIS_DATA);
  }

  /** @param {{lastBlock: Block, block: Block, state:State}} */
  static validateBlock({ lastBlock, block, state }) {
    return new Promise((res, rej) => {
      if (keccakHash(block) === keccakHash(Block.genesis())) {
        return res();
      }

      if (
        keccakHash(lastBlock.blockHeaders) !== block.blockHeaders.parentHash
      ) {
        return rej(
          new Error(
            "the parent hash must be a hash of the last block's headers"
          )
        );
      }

      if (block.blockHeaders.number !== lastBlock.blockHeaders.number + 1) {
        return rej(new Error("The block must increment the number by 1"));
      }

      if (
        Math.abs(
          lastBlock.blockHeaders.difficulty - block.blockHeaders.difficulty
        ) > 1
      ) {
        return rej(new Error("The difficulty must only adjust by 1"));
      }

      const rebuiltTransactionTrie = Trie.buildTrie({
        items: block.transactionSeries,
      });

      if (
        rebuiltTransactionTrie.rootHash !== block.blockHeaders.transactionRoot
      ) {
        return rej(
          new Error(
            `The rebuilt transactions root does not match the block's` +
              `transactions root: ${block.blockHeaders.transactionRoot}`
          )
        );
      }

      const target = Block.calculateBlockTargetHash({ lastBlock });
      const { blockHeaders } = block;
      const { nonce } = blockHeaders;
      const truncatedBlockHeaders = { ...blockHeaders };
      delete truncatedBlockHeaders.nonce;
      const header = keccakHash(truncatedBlockHeaders);
      const underTargetHash = keccakHash(header + nonce);

      if (underTargetHash > target) {
        return rej(
          new Error("The block does not meet the proof of work requirement")
        );
      }

      Transaction.validateTransactionSeries({
        state,
        transactionSeries: block.transactionSeries,
      })
        .then(res)
        .catch(rej);

      return res();
    });
  }

  /** @param {{block: Block, state: State}} */
  static runBlock({ block, state }) {
    for (let transaction of block.transactionSeries) {
      Transaction.runTransaction({ transaction, state });
    }
  }
}

module.exports = Block;
