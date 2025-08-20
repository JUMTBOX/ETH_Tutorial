const Trie = require("./trie");
const Account = require("../account");

class State {
  /**@type {Trie} */
  stateTrie;

  constructor() {
    this.stateTrie = new Trie();
  }

  /** @param {{address: string, accountData: Account}} */
  putAccout({ address, accountData }) {
    this.stateTrie.put({ key: address, value: accountData });
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
