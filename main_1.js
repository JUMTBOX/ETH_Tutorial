const INSTRUCTIONS = {
  STOP: "STOP",
  ADD: "ADD",
  PUSH: "PUSH",
};

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
      const { STOP, PUSH, ADD } = INSTRUCTIONS;
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
            const a = this.state.stack.pop(),
              b = this.state.stack.pop();
            this.state.stack.push(a + b);
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

const result = new InterPreter().runCode([
  INSTRUCTIONS.PUSH,
  2,
  INSTRUCTIONS.PUSH,
  3,
  INSTRUCTIONS.ADD,
  INSTRUCTIONS.STOP,
]);

console.info(`=================== RESULT : ${result} ===================`);
