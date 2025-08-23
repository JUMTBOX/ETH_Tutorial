## 7. Smart Contracts in the Decentralized Computer

## SUMMARY

### 1. Smart Contract Account

```jsx
class Account {
  /**@type {ec.keyPair} */
  keyPair;
  /**@type {string} */
  address;
  /**@type {number} */
  balance;
  /**@type {string[]} */
  code;
  /**@type {string} */
  codeHash;

  constructor({ code } = {}) {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic().encode("hex");
    this.balance = STARTING_BALANCE;
    this.code = code || [];
    this.generateCodeHash(); // <-
  }

  generateCodeHash() {
    this.codeHash =
      this.code.length > 0 ? keccakHash(this.address + this.code) : null;
  }
}
```

### 2. Transaction.runCreateAccountTransaction 수정

```jsx
  /** @param {{transaction: Transaction, state: State}}  */
  static runCreateAccountTransaction({ transaction, state }) {
    const {
      data: { accountData },
    } = transaction;
    const { address, codeHash } = accountData;

    state.putAccout({ address: !!codeHash ? codeHash : address, accountData });
  }
```

### 3. Transaction.runStandardAccountTransaction 수정

```jsx
  /** @param {{transaction: Transaction, state: State}}  */
  static runStandardTransaction({ transaction, state }) {
    const { value, from, to, gasLimit } = transaction;
    const fromAccount = state.getAccount({ address: from });
    const toAccount = state.getAccount({ address: to });

    let gasUsed = 0,
      result;

    if (!!toAccount.codeHash) {
      ({ result, gasUsed } = new InterPreter({
        storageTrie: state.storageTrieMap[toAccount.codeHash],
      }).runCode(toAccount.code));
      console.info(
        ` -*- Smart contract execution: ${transaction.id} - RESULT: ${result}`
      );
    }

    const refund = gasLimit - gasUsed;

    fromAccount.balance -= value;
    fromAccount.balance -= gasLimit;
    fromAccount.balance += refund;
    toAccount.balance += value;
    toAccount.balance += gasUsed;

    state.putAccout({ address: from, accountData: fromAccount });
    state.putAccout({ address: to, accountData: toAccount });
  }
```

### 4. GasLimit , GasUsed , (STORE | LOAD) 연산을 위한 개별 저장소 추가

```jsx
class Transaction {
  /**@type {string} */
  id;
  /**@type {string} */
  from;
  /**@type {string} */
  to;
  /**@type {number} */
  value;
  /**@type {string} */
  signature;
  data;
  /**@type {number} */
  gasLimit;

  /** @param {TransactionFields} */
  constructor({ id, from, to, value, data, signature, gasLimit }) {
    this.id = id || uuid();
    this.from = from || "-";
    this.to = to || "-";
    this.value = value || 0;
    this.data = data || "-";
    this.signature = signature || "-";
    this.gasLimit = gasLimit || 0;
  }
}
```

```jsx
  /** @param {{transaction: Transaction, state: State}}  */
  static runStandardTransaction({ transaction, state }) {
    const { value, from, to, gasLimit } = transaction;
    const fromAccount = state.getAccount({ address: from });
    const toAccount = state.getAccount({ address: to });

    let gasUsed = 0,
      result;

    if (!!toAccount.codeHash) {
      ({ result, gasUsed } = new InterPreter({
        storageTrie: state.storageTrieMap[toAccount.codeHash],
      }).runCode(toAccount.code));
      console.info(
        ` -*- Smart contract execution: ${transaction.id} - RESULT: ${result}`
      );
    }

    const refund = gasLimit - gasUsed;

    fromAccount.balance -= value;
    fromAccount.balance -= gasLimit;
    fromAccount.balance += refund;
    toAccount.balance += value;
    toAccount.balance += gasUsed;

    state.putAccout({ address: from, accountData: fromAccount });
    state.putAccout({ address: to, accountData: toAccount });
  }
```

```jsx
class InterPreter {
  /**@type {Trie} */
  storageTrie;

  /** @param {{storageTrie: Trie} | {}} */
  constructor({ storageTrie } = {}) {
    this.state = {
      programCounter: 0,
      executionCount: 0,
      stack: [],
      code: [],
    };
    this.storageTrie = storageTrie;
  }

  //... 중략
  /**
   * @param {Array<Partial<INSTRUCTIONS> | number>} code
   * @returns {{result: number | string, gasUsed:number}}
   * */
  runCode(code) {
    const operationCode = this.state.code[this.state.programCounter];
    gasUsed += OPCODE_GAS_MAP[operationCode];

    switch (operationCode) {
      case STORE: {
        const key = this.state.stack.pop();
        const value = this.state.stack.pop();

        this.storageTrie.put({ key, value });
        break;
      }
      case LOAD: {
        const key = this.state.stack.pop();
        const value = this.storageTrie.get({ key });

        this.state.stack.push(value);

        break;
      }
      default:
        break;
    }
  }
}
```

### smart contract 실행 과정... (api-test 기준)

```jsx

1. postTransact() api call 하여 Transaction.createTransaction 에 code 만 전달하여 실행
  -> CREATE_ACCOUNT 타입의 transaction 생성 -> transactionQueue 에 추가
  -> getMine() api call 하여 smart contract 계정 생성

2. postTransact() api call 하여 Transaction.createTransaction 실행 */

    postTransact({
      to: smartContractAccountData.codeHash,
      value: 0,
      gasLimit: 100,
    });

   -> TRANSACT 타입의 transaction 생성 -> transactionQueue 에 추가

3. getMine() api call 하여 BlockChain.prototype.addBlock
  -> 추가할 block 과 체인의 State 전달

4. Block.runBlock
  -> 인수로 전달 받은 block 안의 transactionSeries 를 순회하며 각 transaction 실행
  -> Transaction.runTransaction 에 단일 transaction 과 체인의 State 를 전달

5. Transaction.runTransaction
  -> transaction type 에 따라서 달리 실행 현재는 Transaction.runStandardTransaction
  -> param 은 상동

6. Transaction.runStandardTransaction
  -> 인수로 전달 받은 transaction 내에 codeHash 필드 값이 존재하면 체인의 State.storageTrieMap 에서 codeHash(=address)를 key 로 개별 저장소를 가져와서 Interpreter 생성자 함수에 인수로 전달하면서 instantiate
  -> Interpreter.prototype.runCode 에 code 전달하며 실행

7. gasLimit 에서 code 를 실행한 후 gasUsed 차감 후 refund..
   smart contract 실행 결과 json response
```

## 💥 Ethereum 두 가지 종류의 지갑

1. Externally Owned Account (EOA, 외부 소유 계정)

   - 우리가 흔히 “지갑 주소”라고 부르는 것
   - 개인 키(private key)로 제어
   - 코드(스마트 컨트랙트)를 전혀 가지지 않음
   - 단순히 ETH나 토큰 잔액만 가짐 (Ex: 메타마스크 지갑 주소)

2. Contract Account (스마트 컨트랙트 계정)
   - 배포된 스마트 컨트랙트가 담긴 계정
   - 코드(바이트코드) 를 가지고 있음
   - 외부에서 트랜잭션이 들어올 때 코드가 실행됨
   - 개인 키로 제어할 수 없고, 코드 로직이 곧 그 계정의 “행동 규칙”

### EOA 와 Contract Account 는 어떻게 구별하는가?

- 모든 계정은 20바이트 주소를 가짐

#### 1. 클라이언트 요청 구성

- 클라이언트(프론트) or 서버(백)에서 JSON-RPC 페이로드 생성

```json
{
  "jsonrpc": "2.0",
  "method": "eth_getCode",
  "params": ["0x주소", "latest"], // 또는 블록 번호 "0xNN", "finalized", "safe", "pending"
  "id": 1
}
```

- HTTP(S) POST 혹은 WebSocket으로 RPC 엔드포인트(직접 노드, Alchemy 등)에 전송

#### 2. 노드에서의 요청 파싱·검증

- JSON 스키마 검사: method/params 형식, 주소 길이·체크섬(필수는 아님), 블록 태그 유효성 점검

- 블록 태그 해석: "latest"/"finalized"/"safe"/"pending" 또는 특정 블록 번호("0x…")를 실제 블록 번호로 정합니다. 이때 해당 블록의 stateRoot를 확정

#### 3. 상태 트라이(Trie) 접근 (머클-패트리샤 트라이, MPT)

- 노드는 지정된 블록의 블록 헤더 안에 있는 stateRoot로부터 상태 DB 조회
- ( 해싱된 truncated blockHeaders )

```jsx
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

  //...etc
}
```

- 주소의 Keccak-256 해시를 키로 하여 상태 트라이를 탐색하고, 해당 계정 객체를 로드 ( =강의 getAccount 메서드 )

```jsx
class State {
  /**@type {Trie} */
  stateTrie;

  /**@type {{[key:string]: Trie}} */
  storageTrieMap;

  constructor() {
    this.stateTrie = new Trie();
    this.storageTrieMap = {};
  }

  /**
   * @param {{address: string}}
   * @returns {Account}
   * */
  getAccount({ address }) {
    return this.stateTrie.get({ key: address });
  }
}
```

- 계정 객체는 (nonce, balance, storageRoot, codeHash) 4가지를 포함

#### 4. 코드 존재 여부 판단

- 계정이 상태 트라이에 없거나, codeHash가 “빈 코드의 해시(keccak256(빈바이트))”인 경우 <br>
  → 스마트 컨트랙트 코드가 없다고 간주

- 코드가 있다면 codeHash를 키로 코드 저장소에서 바이트코드를 읽음 (코드는 내용주소화되어 별도로 저장)

#### 5. 응답 직렬화

- 코드 있음: 런타임 바이트코드가 16진수 문자열(0x 접두)로 반환 ( \*하단 참조 )

- 코드 없음: 결과는 "0x"(빈 바이트열)로 반환

#### 6. 최종적으로 JSON-RPC 응답을 반환

```json
// 코드 없음(EOA 또는 미존재 계정)
{ "jsonrpc":"2.0", "id":1, "result":"0x" }

// 코드 있음(스마트 컨트랙트 계정)
{ "jsonrpc":"2.0", "id":1, "result":"0x60806040..." }
```

##

```


























```

##

## 💥 RPC (Remote Procedure Call) 이란?

- 네트워크 요청을 통해 다른 프로세스(보통은 원격 서버)에 있는 함수를 호출 하는 것
- Ethereum 네트워크에서 노드를 실행하고 있는 엔티티에게 요청..!
- JSON-RPC 요청을 처리하는 노드 내부 RPC 핸들러에서 이 메서드를 구현

```text
1️⃣ REST식 접근 (리소스 중심)

REST라면, Ethereum 상태를 리소스로 간주해야 합니다.

잔액: GET /account/0x1234/balance

코드: GET /account/0x1234/code

스마트 컨트랙트 함수 호출: ??? (REST로 표현하기 어려움)

문제점:

스마트 컨트랙트 호출마다 URL 설계 필요 → 수천, 수만 개 함수 대응 불가

상태 조회가 동적 → 단순 URL로는 “즉시 계산된 결과” 제공이 어려움

여러 클라이언트 구현체마다 URL 설계 통일 어려움
2️⃣ JSON-RPC식 접근 (함수 호출 중심)

JSON-RPC라면, 함수 호출 + 파라미터로 바로 표현 가능:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "0xTokenContract",
    "data": "0x70a082310000000000000000000000001234..."
  }, "latest"],
  "id": 1
}

여기서 eth_call = 함수 이름, params = 입력 값

클라이언트와 노드 모두 같은 방식으로 함수 호출 가능

새로운 스마트 컨트랙트가 배포되어도, API 설계 변경 필요 없음

🔑 핵심 포인트

Ethereum은 상태가 동적이고 스마트 컨트랙트가 다양 → REST처럼 URL 중심 설계가 번거로움

RPC는 **“함수 호출 + 파라미터”**라는 추상화로, 어떤 상태든 일관되게 조회 가능

여러 클라이언트 구현체(Geth, Besu 등)와 호환성 유지가 용이

즉, JSON-RPC는 “함수 호출 관점으로 상태를 조회하고 조작할 수 있도록 한 표준화된 창구”라고 보면 돼요.

REST도 기술적으로 가능하긴 하지만, Ethereum 특성상 RPC가 훨씬 자연스러운 설계입니다.
```

## 💥 RLP 인코딩 ( Recursive Length Prefix )

- 왜?

  - Ethereum의 많은 데이터 구조(예: 트랜잭션, 블록 헤더, 상태 노드)는 구조화된 데이터이고 이것을 그냥 해시할 수 없음..
  - 왜냐하면 구조체(필드 여러 개)가 그대로는 바이트 배열이 아니기 때문

- 어떻게?

  - 숫자, 주소, 리스트 등을 바이트 시퀀스로 직렬화
  - 리스트 구조도 RLP가 계층적으로 직렬화해줌
  - 즉, 데이터 → (RLP) → 바이트 시퀀스

- 순서
  - 1.  노드가 Transaction 의 필드들을 hex 바이트 배열로 변환
  - 2.  RLP 직렬화하여 상태 Trie 에 저장..
  - 3. 상태 Trie (MPT)는 노드가 key-value 구조 (key - 계정 주소 해시, value - RLP 직렬화된 정보 )

#### RLP 규칙

- 0x00 ~ 0x7f (0 ~ 127) 의 단일 바이트 값 -> 그대로 사용
- 짧은 문자열 (<= 55byte) -> (0x80 + length) + 데이터
- 긴 문자열 (> 55byte) -> (0xb7 + length_of_length) + length + 데이터
- 리스트 -> 0xc0 + length + 내용

```jsx
{
  // 계정의 트랜잭션 카운터
  nonce: 9,
  // 가스 가격
  gasPrice: "20000000000",
  // 가스 한도
  gasLimit: "21000",
  // 수신자 주소 (없으면 contract creation) 16진수 주소 문자열
  to: "0x3535353535353535353535353535353535353535",
  // 송금할 ETH 값
  value: "1000000000000000000",
  // 입력 데이터 (보통 contract call data)
  data: "0x",
}
```

<br>

- 노드에서 필드 값들을 바이트 시퀀스로 바꿈

```jsx
nonce => 0x09
gasPrice => 0x04a817c800 // -> Byte[]  [04 a8 17 c8 00]
gasLimit => 0x5208 // -> Byte []  [52 08]
to => 이미 20 바이트 주소
value => 0x0de0b6b3a7640000 // -> Byte []  [0d e0 b6 b3 a7 64 00 00]
data => 0x // -> Byte []  []
```

<br>

- 직렬화 결과

```jsx
nonce => 0x09 (1byte)
=> 단일 바이트이므로 그대로 | 09 | len: 1

gasPrice => 0x04a817c800 (5byte)
=> 55byte 보다 작으므로 ((0x80 + 0x5) + 값) 형식인 | 85 04 a8 17 c8 00 | len: 6

gasLimit => 0x5208 (2byte)
=> 55byte 보다 작으므로 ((0x80 + 0x2) + 값) 형식인 | 82 52 08 | len: 3

to => 이미 20 바이트 주소
=> 55byte 보다 작으므로 ((0x80 + 0x14) + 값) 형식인 | 94 ...주소 | len: 21

value => 0x0de0b6b3a7640000 (8byte)
=> 55byte 보다 작으므로 ((0x80 + 0x08) + 값) 형식인 | 88 0d e0 b6 b3 a7 64 00 00 | len: 9

data => 0x => 빈값

/** 서명 관련된 값들... */
v => 1byte => | 25 |  len: 1
r => 32byte => ((0x80 + 0x20) + 값) 형식인 | a0 ...32byte 값들 |  len: 33
s => 32byte => ((0x80 + 0x20) + 값) 형식인 | a0 ...32byte 값들 |  len: 33
```

- 이후 이 모든 byte 시퀀스를 리스트로 감싼다
- 리스트 전체 길이를 계산한 뒤, 리스트를 의미하는 prefix 붙인다.
- 위의 예제가 전체 payload 라고 한다면...
  - 전체 payload = 107 byte
  - (0xc0 + 0x6B) + 리스트 값 저장
- 메모리에서는 그냥 바이트 스트림일뿐

- 이렇게 RLP로 직렬화 된 바이트 스트림을 해쉬 함수에 전달하여 transaction hash 생성 (=txHash)

```
 < txHash가 쓰이는 곳 >

트랜잭션 식별자

txHash = Keccak256(RLP(serializedTx))

블록에 들어간 트랜잭션을 고유하게 식별

머클 트리 구성

블록 내 트랜잭션들을 RLP 직렬화 → 머클 트리 구성

블록 헤더에 트랜잭션 루트 해시(transactionRoot) 저장

따라서 상태 트리와는 별개지만, 블록 헤더에서 트랜잭션 존재 증명 가능

txHash는 상태 트리에 들어가지 않고, 블록 내 머클 트리 구조에서 사용됨
```

##

```
### 중요 포인트 ###

EOA & 미존재 주소: 둘 다 eth_getCode는 "0x"를 반환할 수 있습니다. 구분하려면 eth_getBalance, eth_getTransactionCount 등을 함께 조회합니다. 다만 잔액·논스가 모두 0이면 실질적으로 “미존재와 동일”하게 취급됩니다.

과거 블록 상태: params 두 번째 인자로 과거 블록을 넣으면 해당 시점의 코드가 필요합니다. 대부분의 풀노드는 오래된 상태를 “가지치기(prune)”하므로, 과거 상태 조회는 아카이브 노드가 필요합니다. 아카이브가 아니면 “missing trie node”류 오류가 나거나 처리 불가일 수 있습니다.

가스 비용: RPC 조회는 노드가 로컬 DB에서 읽어 반환하므로 온체인 가스는 들지 않습니다(읽기 전용).
```
