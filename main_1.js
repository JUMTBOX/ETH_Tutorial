const INSTRUCTIONS = {
  STOP: "STOP",
  ADD: "ADD",
  PUSH: "PUSH",
  SUB: "SUB",
  MUL: "MUL",
  DIV: "DIV",
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
  constructor() {
    this.state = {
      programCounter: 0,
      stack: [],
      code: [],
    };
  }

  runCode(code) {
    this.state.code = code;

    while (this.state.programCounter < this.state.code.length) {
      const { STOP, PUSH, ADD, SUB, MUL, DIV } = INSTRUCTIONS;
      const operationCode = this.state.code[this.state.programCounter];

      try {
        switch (operationCode) {
          case STOP:
            throw new Error("Execution complete");
          case PUSH:
            this.state.programCounter++;
            const value = this.state.code[this.state.programCounter];
            this.state.stack.push(value);
            break;

          case ADD:
          case SUB:
          case MUL:
          case DIV:
            const a = this.state.stack.pop(),
              b = this.state.stack.pop();

            let result;
            if (operationCode === ADD) result = a + b;
            if (operationCode === SUB) result = a - b;
            if (operationCode === MUL) result = a * b;
            if (operationCode === DIV) result = a / b;

            this.state.stack.push(result);
            break;

          default:
            break;
        }
      } catch (error) {
        return this.state.stack[this.state.stack.length - 1];
      }
      this.state.programCounter++;
    }
  }
}

const { PUSH, ADD, STOP, SUB, MUL, DIV } = INSTRUCTIONS;

const codeArr = [
  [PUSH, 2, PUSH, 3, ADD, STOP],
  [PUSH, 2, PUSH, 3, SUB, STOP],
  [PUSH, 2, PUSH, 3, MUL, STOP],
  [PUSH, 2, PUSH, 3, DIV, STOP],
];

codeArr.forEach((code) => {
  const result = new InterPreter().runCode(code);
  const [, num1, , num2, ops] = code;

  console.info(
    `===================| RESULT of (${num1} ${ops} ${num2}) : ${result} |===================`
  );
});
