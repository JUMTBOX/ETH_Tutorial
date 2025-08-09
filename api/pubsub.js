const PubNub = require("pubnub");
const Block = require("../blockchain/block");
const Blockchain = require("../blockchain");
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

const CHANNELS_MAP = {
  TEST: "TEST",
  BLOCK: "BLOCK",
};

class PubSub {
  /** @type {PubNub} */
  pubnub;
  /** @type {Blockchain} */
  blockchain;

  /** @param {{blockchain:Blockchain}} */
  constructor({ blockchain }) {
    this.pubnub = new PubNub(credentials);
    this.blockchain = blockchain;
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

        const parsedMessage = JSON.parse(message);
        switch (channel) {
          case CHANNELS_MAP.BLOCK:
            console.log("block message :", message);
            this.blockchain
              .addBlock({ block: parsedMessage })
              .then(() => console.log("New block accepted"))
              .catch((e) => console.error("New block rejected: ", e.message));
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
}

module.exports = PubSub;
