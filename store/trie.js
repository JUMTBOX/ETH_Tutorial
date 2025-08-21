const { keccakHash } = require("../util/index");
const _ = require("lodash");

class Node {
  constructor() {
    this.value = null;
    this.childMap = {};
  }
}

class Trie {
  /**@type {string} */
  rootHash;
  /**@type {Node} */
  head;

  constructor() {
    this.head = new Node();
    this.generateRootHash();
  }

  generateRootHash() {
    this.rootHash = keccakHash(this.head);
  }

  /** @param {{key: string}} */
  get({ key }) {
    let node = this.head;

    for (let char of key) {
      if (!node.childMap[char]) {
        return null;
      } else {
        node = node.childMap[char];
      }
    }

    return _.cloneDeep(node.value);
  }

  /** @param {{key: string, value: object}} */
  put({ key, value }) {
    let node = this.head;

    for (let char of key) {
      if (!node.childMap[char]) {
        node.childMap[char] = new Node();
      }

      node = node.childMap[char];
    }

    node.value = value;
    this.generateRootHash();
  }
}

module.exports = Trie;
