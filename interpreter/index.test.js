const Trie = require("../store/trie");
const InterPreter = require("./index");

const {
  PUSH,
  ADD,
  STOP,
  SUB,
  MUL,
  DIV,
  LT,
  GT,
  EQ,
  AND,
  OR,
  JUMP,
  JUMPI,
  STORE,
  LOAD,
} = InterPreter.INSTRUCTIONS;

describe("Interperter", () => {
  describe("runCode()", () => {
    describe("and the code includes Add", () => {
      it("adds two values", () => {
        expect(
          new InterPreter().runCode([PUSH, 2, PUSH, 3, ADD, STOP]).result
        ).toEqual(5);
      });
    });
    describe("and the code includes SUB", () => {
      it("subtracts one value from another", () => {
        expect(
          new InterPreter().runCode([PUSH, 2, PUSH, 3, SUB, STOP]).result
        ).toEqual(1);
      });
    });
    describe("and the code includes MUL", () => {
      it("products two values", () => {
        expect(
          new InterPreter().runCode([PUSH, 2, PUSH, 3, MUL, STOP]).result
        ).toEqual(6);
      });
    });
    describe("and the code includes DIV", () => {
      it("divides one value from another", () => {
        expect(
          new InterPreter().runCode([PUSH, 2, PUSH, 3, DIV, STOP]).result
        ).toEqual(1.5);
      });
    });

    describe("and the code includes LT", () => {
      it("checks if one value is less than another", () => {
        expect(
          new InterPreter().runCode([PUSH, 2, PUSH, 3, LT, STOP]).result
        ).toEqual(0);
      });
    });
    describe("and the code includes GT", () => {
      it("checks if one value is greater than another", () => {
        expect(
          new InterPreter().runCode([PUSH, 2, PUSH, 3, GT, STOP]).result
        ).toEqual(1);
      });
    });
    describe("and the code includes EQ", () => {
      it("checks if one value is equal to another", () => {
        expect(
          new InterPreter().runCode([PUSH, 2, PUSH, 3, EQ, STOP]).result
        ).toEqual(0);
      });
    });

    describe("and the code includes AND", () => {
      it("ands two conditions", () => {
        expect(
          new InterPreter().runCode([PUSH, 1, PUSH, 0, AND, STOP]).result
        ).toEqual(0);
      });
    });
    describe("and the code includes OR", () => {
      it("ors two conditions", () => {
        expect(
          new InterPreter().runCode([PUSH, 1, PUSH, 0, OR, STOP]).result
        ).toEqual(1);
      });
    });

    describe("and the code includes JUMP", () => {
      it("jumps to a destination", () => {
        expect(
          new InterPreter().runCode([
            PUSH,
            6,
            JUMP,
            PUSH,
            0,
            JUMP,
            PUSH,
            "jump successful",
            STOP,
          ]).result
        ).toEqual("jump successful");
      });
    });
    describe("and the code includes JUMPI", () => {
      it("jumps to a destination", () => {
        expect(
          new InterPreter().runCode([
            PUSH,
            8,
            PUSH,
            1,
            JUMPI,
            PUSH,
            0,
            JUMP,
            PUSH,
            "jump successful",
            STOP,
          ]).result
        ).toEqual("jump successful");
      });
    });

    describe("and the code includes STORE", () => {
      const interpreter = new InterPreter({
        storageTrie: new Trie(),
      });

      const [key, value] = ["foo", "bar"];

      interpreter.runCode([PUSH, value, PUSH, key, STORE, STOP]);

      it("stores a value", () => {
        expect(interpreter.storageTrie.get({ key })).toEqual(value);
      });
    });

    describe("and the code includes LOAD", () => {
      const interpreter = new InterPreter({
        storageTrie: new Trie(),
      });

      const [key, value] = ["foo", "bar"];

      it("loads a stored value", () => {
        expect(
          interpreter.runCode([
            PUSH,
            value,
            PUSH,
            key,
            STORE,
            PUSH,
            key,
            LOAD,
            STOP,
          ]).result
        ).toEqual(value);
      });
    });

    describe("and the code includes an invalid JUMP destination", () => {
      it("throws an error", () => {
        expect(() =>
          new InterPreter().runCode([
            PUSH,
            99,
            JUMP,
            PUSH,
            0,
            JUMP,
            PUSH,
            "jump successful",
            STOP,
          ])
        ).toThrow("========== Invalid destination > 99 ==========");
      });
    });

    describe("and the code includes an invalid PUSH value", () => {
      it("throws an error", () => {
        expect(() => new InterPreter().runCode([PUSH, 0, PUSH])).toThrow(
          "========== The 'PUSH' instruction cannot be last =========="
        );
      });
    });

    describe("and the code includes an infinite loop", () => {
      it("throws an error", () => {
        expect(() => new InterPreter().runCode([PUSH, 0, JUMP, STOP])).toThrow(
          "========== Check for an infinite loop. Execution limit of 10000 exceeded =========="
        );
      });
    });
  });
});
