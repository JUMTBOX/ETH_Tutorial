const express = require("express");
const Blockchain = require("../blockchain/index");
const Block = require("../blockchain/block");

const app = express();
const blockchain = new Blockchain();

app.get("/blockchain", (request, response, next) => {
  const { chain } = blockchain;

  response.json({ chain });
});

app.get("/blockchain/mine", (request, response, next) => {
  const lastBlock = blockchain.chain[blockchain.chain.length - 1];
  const block = Block.mineBlock({ lastBlock });

  blockchain
    .addBlock({ block })
    .then(() => {
      response.json({ block });
    })
    .catch(next);
});

app.use(
  (/**@type {Error}*/ error, request, /**@type {Response}*/ response, next) => {
    console.error("Internal server error: ", error);

    response.status(500).json({ message: error.message });
  }
);

const PORT = 8080;
app.listen(PORT, () => {
  console.info(`EXPRESS SEVER LISTENING AT PORT ${PORT}...`);
});
