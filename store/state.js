const Trie = require("./trie");
const Account = require("../account");

class State {
  /**@type {Trie} */
  stateTrie;
  /**@type {{[key:string]: Trie}} */
  storageTrieMap;
  constructor() {
    this.stateTrie = new Trie();
    this.storageTrieMap = {};
  }

  /** @param {{address: string, accountData: Account}} */
  putAccout({ address, accountData }) {
    if (!this.storageTrieMap[address]) {
      this.storageTrieMap[address] = new Trie();
    }

    this.stateTrie.put({
      key: address,
      value: {
        ...accountData,
        storageRoot: this.storageTrieMap[address].rootHash,
      },
    });
  }
  /**
   * @param {{address: string}}
   * @returns {Account}
   * */
  getAccount({ address }) {
    return this.stateTrie.get({ key: address });
  }

  getStateRoot() {
    return this.stateTrie.rootHash;
  }
}

module.exports = State;
