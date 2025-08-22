const Account = require("./account");
const Transaction = require("./transaction");
const { INSTRUCTIONS, ERROR_CODE } = require("./interpreter/index");
const { STOP, ADD, PUSH, STORE, LOAD } = INSTRUCTIONS;

const BASE_URL = "http://localhost:3000";

const postTransact = async ({ code, to, value, gasLimit }) => {
  const response = await fetch(`${BASE_URL}/account/transact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, to, value, gasLimit }),
  });
  /** @type {{transaction: Transaction}} */
  const body = await response.json();
  return body;
};

const getMine = async () => {
  return await new Promise((resolve) => {
    setTimeout(() => {
      fetch(`${BASE_URL}/blockchain/mine`, {
        headers: { "Content-Type": "application/json" },
      }).then((response) => resolve(response.json()));
    }, 1000);
  });
};

const getAccountBalance = async ({ address } = {}) => {
  const response = await fetch(
    `${BASE_URL}/account/balance${!!address ? "?address=" + address : ""}`,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  const { balance } = await response.json();
  return balance;
};

/** @type {Partial<Account>} */
let toAccountData;
/** @type {Account} */
let smartContractAccountData;

postTransact({})
  .then((body) => {
    console.log("FIRST RESPOSNE >>> ", body);

    toAccountData = body.transaction.data.accountData;

    return getMine();
  })
  .then((mineResponse2) => {
    console.log("MINE_BLOCK_RESPONSE1 >>> ", mineResponse2);
    return postTransact({ to: toAccountData.address, value: 20 });
  })
  .then((secondBody) => {
    console.log("SECOND POST_Transact RESPOSNE >>> ", secondBody);

    const [key, value] = ["foo", "bar"];
    const code = [PUSH, value, PUSH, key, STORE, PUSH, key, LOAD, STOP];

    return postTransact({ code });
  })
  .then((thirdBody) => {
    console.log("THIRD POST_Transact RESPOSNE >>> ", thirdBody);

    smartContractAccountData = thirdBody.transaction.data.accountData;
    return getMine();
  })
  .then((res) => {
    console.info("MINE_BLOCK_RESPONSE2 >>> ", res);
    return postTransact({
      to: smartContractAccountData.codeHash,
      value: 0,
      gasLimit: 100,
    });
  })
  .then((res) => {
    console.log("FOURTH POST_Transact RESPOSNE >>> ", res);
    return getMine();
  })
  .then((res) => {
    console.info("MINE_BLOCK_RESPONSE3 >>> ", res);
    return getAccountBalance();
  })
  .then((balance) => {
    console.info("getAccountBalanceResponse1 >>> ", balance);

    return getAccountBalance({ address: toAccountData.address });
  })
  .then((balance) => {
    console.info("getAccountBalanceResponse2 >>> ", balance);
  });
