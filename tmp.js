const Trie = require("./store/trie");
const { keccakHash } = require("./util/index");

const trie = new Trie();
const accountData = { balance: 1000 };
const transaction = { data: accountData };

trie.put({ key: "foo", value: transaction });

const retrievedTransaction = trie.get({ key: "foo" });
const hash1 = keccakHash(retrievedTransaction);

console.info("hash1 ", hash1, "\n", retrievedTransaction);

accountData.balance += 50;

const hash2 = keccakHash(retrievedTransaction);

console.info("hash2 ", hash2, "\n", retrievedTransaction);
