const PubNub = require("pubnub");
const Block = require("../blockchain/block");
const Blockchain = require("../blockchain");
const Transaction = require("../transaction/index");
const TransactionQueue = require("../transaction/transaction-queue");
require("dotenv").config();

const {
  PUB_NUB_PUBLISH_KEY,
  PUB_NUB_SUBSCRIBE_KEY,
  PUB_NUB_SECRET_KEY,
  PUB_NUB_USER_ID,
} = process.env;

const credentials = {
  publishKey: PUB_NUB_PUBLISH_KEY,
  subscribeKey: PUB_NUB_SUBSCRIBE_KEY,
  secretKey: PUB_NUB_SECRET_KEY,
  userId: PUB_NUB_USER_ID,
};

/**
 * @readonly
 * @enum {string}
 */
const CHANNELS_MAP = {
  TEST: "TEST",
  BLOCK: "BLOCK",
  TRANSACTION: "TRANSACTION",
};

class PubSub {
  /** @type {PubNub} */
  pubnub;
  /** @type {Blockchain} */
  blockchain;
  /** @type {TransactionQueue} */
  transactionQueue;

  /** @param {{blockchain:Blockchain}} */
  constructor({ blockchain, transactionQueue }) {
    this.pubnub = new PubNub(credentials);
    this.blockchain = blockchain;
    this.transactionQueue = transactionQueue;
    this.subscribeToChannels();
    this.listen();
  }

  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: Object.values(CHANNELS_MAP),
    });
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message });
  }

  listen() {
    this.pubnub.addListener({
      message: (messageObject) => {
        const { channel, message } = messageObject;

        console.log("Message received. Channel: ", channel);
        /**@type {Block | Partial<Transaction>} */
        const parsedMessage = JSON.parse(message);
        switch (channel) {
          case CHANNELS_MAP.BLOCK:
            console.log("block message :", message);
            this.blockchain
              .addBlock({ block: parsedMessage })
              .then(() => console.log("New block accepted"))
              .catch((e) => console.error("New block rejected: ", e.message));
            break;
          case CHANNELS_MAP.TRANSACTION:
            console.log(`Received transaction: ${parsedMessage.id}`);
            this.transactionQueue.add(new Transaction(parsedMessage));
            break;
          default:
            return;
        }
      },
    });
  }
  /** @param {Block} */
  broadcastBlock(block) {
    this.publish({
      channel: CHANNELS_MAP.BLOCK,
      message: JSON.stringify(block),
    });
  }
  /** @param {Transaction} */
  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS_MAP.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = PubSub;
