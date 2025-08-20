const Account = require("./account");
const Transaction = require("./transaction");

const BASE_URL = "http://localhost:3000";

const postTransact = async ({ to, value }) => {
  const response = await fetch(`${BASE_URL}/account/transact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, value }),
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
postTransact({})
  .then((body) => {
    console.log("FIRST RESPOSNE >>> ", body);

    toAccountData = body.transaction.data.accountData;

    return getMine();
  })
  .then((mineResponse2) => {
    console.log("mineResponse >>> ", mineResponse2);
    return postTransact({ to: toAccountData.address, value: 20 });
  })
  .then((secondBody) => {
    console.log("SECOND RESPOSNE >>> ", secondBody);

    return getMine();
  })
  .then((res) => {
    console.info("MINE_BLOCK_RESPONSE >>> ", res);

    return getAccountBalance();
  })
  .then((balance) => {
    console.info("getAccountBalanceResponse1 >>> ", balance);

    return getAccountBalance({ address: toAccountData.address });
  })
  .then((balance) => {
    console.info("getAccountBalanceResponse2 >>> ", balance);
  });
