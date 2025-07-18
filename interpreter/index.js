const INSTRUCTIONS = {
  STOP: "STOP",
  ADD: "ADD",
  PUSH: "PUSH",
  SUB: "SUB",
  MUL: "MUL",
  DIV: "DIV",
  LT: "LT",
  GT: "GT",
  EQ: "EQ",
  AND: "AND",
  OR: "OR",
  JUMP: "JUMP",
  JUMPI: "JUMPI",
};

const ERROR_CODE = {
  EXECUTION_COMPLETE: "Execution complete",
  EXECUTION_LIMIT: 10000,
};

/**
 * @description
 * switch 문 전체가 하나의 블록 스코프를 형성 즉, 각 case 가 독립적인 스코프를 가지지 않음
 * break 없이 다음 case 로 흐르게 되는 fall-through 발생 시 앞선 case 에서 선언된 변수에 접근 가능
 *
 * var 키워드로 선언한 변수의 스코프 -> 함수 스코프
 * let/const 키워드로 선언한 변수의 스코프 -> 블록 스코프
 *
 * @example
 * ===========================================================================
 *    switch (someValue) {
 *       case 1:
 *         let foo = 1, bar = 2;
 *         break;
 *       case 2:
 *         let foo = 3, bar = 4;
 *         break;
 *       default:
 *         break;
 *    }
 *   //  ============> SyntaxError: Identifier 'foo' has already been declared
 * ===========================================================================
 * @argument
 *  그렇다면 어떻게 ? --> 각 case 에서 독립적인 스코프가 필요하다면 case 문을 중괄호({}) 로 감싸면 case 마다 독립적인 스코프를 가질 수 있다.
 * */

class InterPreter {
  static INSTRUCTIONS = INSTRUCTIONS;
  static ERROR_CODE = ERROR_CODE;

  constructor() {
    this.state = {
      programCounter: 0,
      executionCount: 0,
      stack: [],
      code: [],
    };
  }

  jump() {
    const destination = this.state.stack.pop();

    if (destination < 0 || destination > this.state.code.length) {
      throw new Error(
        `========== Invalid destination > ${destination} ==========`
      );
    }

    this.state.programCounter = destination;
    this.state.programCounter--;
  }

  runCode(code) {
    this.state.code = code;

    while (this.state.programCounter < this.state.code.length) {
      this.state.executionCount++;

      if (this.state.executionCount > ERROR_CODE.EXECUTION_LIMIT) {
        throw new Error(
          `========== Check for an infinite loop. Execution limit of ${ERROR_CODE.EXECUTION_LIMIT} exceeded ==========`
        );
      }

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
      } = INSTRUCTIONS;
      const operationCode = this.state.code[this.state.programCounter];

      try {
        switch (operationCode) {
          case STOP:
            throw new Error(ERROR_CODE.EXECUTION_COMPLETE);
          case PUSH:
            this.state.programCounter++;

            if (this.state.programCounter === this.state.code.length) {
              throw new Error(
                `========== The 'PUSH' instruction cannot be last ==========`
              );
            }

            const value = this.state.code[this.state.programCounter];
            this.state.stack.push(value);
            break;

          case ADD:
          case SUB:
          case MUL:
          case DIV:
          case LT:
          case GT:
          case EQ:
          case AND:
          case OR:
            const a = this.state.stack.pop(),
              b = this.state.stack.pop();

            let result;
            if (operationCode === ADD) result = a + b;
            if (operationCode === SUB) result = a - b;
            if (operationCode === MUL) result = a * b;
            if (operationCode === DIV) result = a / b;
            if (operationCode === LT) result = a < b ? 1 : 0;
            if (operationCode === GT) result = a > b ? 1 : 0;
            if (operationCode === EQ) result = a === b ? 1 : 0;
            if (operationCode === AND) result = a && b;
            if (operationCode === OR) result = a || b;

            this.state.stack.push(result);
            break;
          case JUMP:
            this.jump();
            break;
          case JUMPI:
            const condition = this.state.stack.pop();
            if (condition === 1) this.jump();
            break;
          default:
            break;
        }
      } catch (error) {
        if (error?.message.includes(ERROR_CODE.EXECUTION_COMPLETE)) {
          return this.state.stack[this.state.stack.length - 1];
        }
        throw error;
      }
      this.state.programCounter++;
    }
  }
}

module.exports = InterPreter;

/** @param {Array<number|string>[]} arr */
function logger(arr) {
  arr.forEach((code) => {
    const operatorOrOperand = code.filter((c) => PUSH !== c && STOP !== c);
    const operator = operatorOrOperand.find((c) => c in INSTRUCTIONS);
    const [operand2, operand1] = operatorOrOperand.filter(
      (c) => typeof c === "number"
    );

    const result = new InterPreter().runCode(code);

    const logMessage = operator.includes(JUMP)
      ? `===================| RESULT of (${operator}) : ${result} |===================`
      : `===================| RESULT of (${operand1} ${operator} ${operand2}) : ${result} |===================`;

    console.info(logMessage);
  });
}
