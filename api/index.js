const express = require("express");
const request = require("request");
const Account = require("../account/index");
const Blockchain = require("../blockchain/index");
const Block = require("../blockchain/block");
const PubSub = require("./pubsub");
const Transaction = require("../transaction/index");
const TransactionQueue = require("../transaction/transaction-queue");

const app = express();
const blockchain = new Blockchain();
const transactionQueue = new TransactionQueue();
const pubsub = new PubSub({ blockchain, transactionQueue });
const account = new Account();
const transaction = Transaction.createTransaction({ account });

setTimeout(() => {
  pubsub.broadcastTransaction(transaction);
}, 500);

/** Using JSON body parsing  */
app.use(express.json());

app.get("/blockchain", (request, response, next) => {
  const { chain } = blockchain;

  response.json({ chain });
});

app.get("/blockchain/mine", (request, response, next) => {
  const lastBlock = blockchain.chain[blockchain.chain.length - 1];
  const block = Block.mineBlock({
    lastBlock,
    beneficiary: account.address,
    transactionSeries: transactionQueue.getTransactionSeries(),
  });

  blockchain
    .addBlock({ block, transactionQueue })
    .then(() => {
      pubsub.broadcastBlock(block);

      response.json({ block });
    })
    .catch(next);
});

app.post("/account/transact", (req, res, next) => {
  const { to, value } = req.body;
  const transaction = Transaction.createTransaction({
    account: !to ? new Account() : account,
    to,
    value,
  });

  transactionQueue.add(transaction);
  pubsub.broadcastTransaction(transaction);

  res.json({ transaction });
});

app.use(
  (/**@type {Error}*/ error, request, /**@type {Response}*/ response, next) => {
    console.error("Internal server error: ", error);

    response.status(500).json({ message: error.message });
  }
);

const peer = process.argv.includes("--peer");

const PORT = peer ? Math.floor(2000 + Math.random() * 1000) : 3000;

if (peer) {
  request("http://localhost:3000/blockchain", (error, response, body) => {
    const { chain } = JSON.parse(body);

    blockchain
      .replaceChain({ chain })
      .then(() => console.log("Synchronized blockchain with the root node"))
      .catch((e) => console.error("Synchronization error: ", e.message));
  });
}

app.listen(PORT, () => {
  console.info(`EXPRESS SEVER LISTENING AT PORT ${PORT}...`);
});
