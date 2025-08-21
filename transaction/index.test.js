const Transaction = require("./index");
const Account = require("../account");
const State = require("../store/state");

describe("Transaction", () => {
  /** @type {Account} */
  let account,
    /** @type {Transaction} */
    standardTransaction,
    /** @type {Transaction} */
    createAccountTransaction,
    /** @type {Transaction} */
    miningRewardTransaction,
    /** @type {State} */
    state,
    /** @type {Account} */
    toAccount;

  beforeEach(() => {
    account = new Account();
    toAccount = new Account();
    state = new State();

    state.putAccout({ address: account.address, accountData: account });
    state.putAccout({ address: toAccount.address, accountData: toAccount });

    standardTransaction = Transaction.createTransaction({
      account,
      to: toAccount.address,
      value: 50,
    });

    createAccountTransaction = Transaction.createTransaction({
      account,
    });

    miningRewardTransaction = Transaction.createTransaction({
      beneficiary: account.address,
    });
  });

  describe("validateStandardTransaction", () => {
    it("validates a valid transaction", () => {
      expect(
        Transaction.validateStandardTransaction({
          transaction: standardTransaction,
          state,
        })
      ).resolves;
    });

    it("does not validate a malformed transaction", () => {
      standardTransaction.to = "different-recipient";
      expect(
        Transaction.validateStandardTransaction({
          transaction: standardTransaction,
          state,
        })
      ).rejects.toMatchObject({ message: /invalid/ });
    });

    it("does not validate when the value exceeds the balance", () => {
      standardTransaction = Transaction.createTransaction({
        account,
        to: toAccount.address,
        value: 9001,
      });
      expect(
        Transaction.validateStandardTransaction({
          transaction: standardTransaction,
          state,
        })
      ).rejects.toMatchObject({ message: /exceeds/ });
    });

    it("does not validate when the 'to' address not exist", () => {
      standardTransaction = Transaction.createTransaction({
        account,
        to: "",
        value: 50,
      });
      expect(
        Transaction.validateStandardTransaction({
          transaction: standardTransaction,
          state,
        })
      ).rejects.toMatchObject({ message: /not exist/ });
    });
  });

  describe("validateCreateAccountTransaction", () => {
    it("validates a create account transaction", () => {
      expect(
        Transaction.validateCreateAccountTransaction({
          transaction: createAccountTransaction,
        })
      ).resolves;
    });
    it("does not validate a none create account transaction", () => {
      standardTransaction.to = "different-recipient";
      expect(
        Transaction.validateCreateAccountTransaction({
          transaction: standardTransaction,
        })
      ).rejects.toMatchObject({ message: /incorrect/ });
    });
  });

  describe("validateMiningRewardTransaction", () => {
    it("validates a mining reward transaction", () => {
      expect(
        Transaction.validateMiningRewardTransaction({
          transaction: miningRewardTransaction,
        })
      ).resolves;
    });

    it("does not validate a tampered with mining reward transaction", () => {
      miningRewardTransaction.value = 9001;
      expect(
        Transaction.validateMiningRewardTransaction({
          transaction: miningRewardTransaction,
        })
      ).rejects.toMatchObject({ message: /does not equal the official/ });
    });
  });
});
