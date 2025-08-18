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

postTransact({})
  .then((body) => {
    console.log("FIRST RESPOSNE >>> ", body);
    const toAccountData = body.transaction.data.accountData;
    return postTransact({ to: toAccountData.address, value: 20 });
  })
  .then((secondBody) => {
    console.log("SECOND RESPOSNE >>> ", secondBody);

    return getMine();
  })
  .then((res) => {
    console.info("MINE_BLOCK_RESPONSE >>> ", res);
  });
