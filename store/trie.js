class Node {
  constructor() {
    this.value = null;
    this.childMap = {};
  }
}
class Trie {
  constructor() {
    this.head = new Node();
  }

  get({ key }) {}

  put({ key, value }) {}
}

module.exports = Trie;
