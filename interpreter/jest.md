## 기본 테스트 구조

### describe

- 테스트 suite 를 그룹화 하는 메서드
- 관련된 테스트들을 하나로 묶어서 구조화 할 수 있음
- 첫 번째 파라미터는 테스트에 대한 설명을 기입할 수 있는 string 타입
- 두 번째 파라미터는 개별 테스트들을 포함하는 callback function

### test , it

- 개별 테스트 케이스를 정의, 동일한 기능을 하며 it 이 더 BDD(Behavior-Driven Development) 스타일에 가깝다고 한다
- 첫 번째 파라미터는 테스트 설명 (string 타입)
- 두 번째는 실제 테스트 로직을 담은 함수

## Assertion 메서드

- Assertion은 프로그래밍에서 "이 값은 반드시 이래야 한다"라고 주장하는 것

### expect

- Jest의 핵심 메서드로, 테스트할 값을 받아서 매처(matcher)와 함께 사용
- **모든 어설션은 expect()로 시작**

```javascript
function add(num1, num2) {
  return num1 + num2;
}

describe("example", () => {
  test("adds 1 + 2 to equal 3", () => {
    expect(add(1, 2)).toBe(3);
    // or
    expect(add(1, 2)).toEqual(3);
  });
});
```

### toBe

- 원시 값의 정확한 일치를 확인
- Object.is 를 사용하여 비교하므로 참조 타입에서는 같은 객체인지 확인 (정확하게는 같은 주소인지 확인)

### toEqual

- 객체나 배열의 깊은 비교를 수행합니다. 값이 같다면 서로 다른 객체여도 통과합니다.

### toBeTruthy, toBeFalsy

- boolean 컨텍스트에서의 참/거짓을 확인합니다.
- toBeTruthy는 if문에서 true로 평가되는 값들, toBeFalsy는 false로 평가되는 값들을 확인

### toBeNull, toBeUndefined, toBeDefined

- null, undefined, 정의된 값인지 확인

### toContain

- 배열이나 문자열에 특정 항목이 포함되어 있는지 확인

### toThrow

- 함수가 에러를 발생시키는지 확인
- 특정 에러 메시지나 에러 타입도 확인 가능

## 숫자 비교 메서드

### toBeGreaterThan, toBeGreaterThanOrEqual, toBeLessThan, toBeLessThanOrEqual

### toBeCloseTo

- 부동소수점 숫자의 근사값을 비교할 때 사용, 부동소수점 연산의 정밀도 문제를 해결함

## 문자열 매치 메서드

### toMatch

- 정규표현식이나 문자열 패턴과 일치하는지 확인

## 배열과 객체 매치 메서드

### toHaveLength

- 배열이나 문자열의 길이를 확인

### toHaveProperty

- 객체가 특정 프로퍼티를 가지고 있는지, 그리고 그 값이 예상과 일치하는지 확인

### toMatchObject

- 객체가 다른 객체의 프로퍼티들을 포함하고 있는지 확인

## 비동기 테스트 메서드

### resolves, rejects

- Promise 테스트 시 사용, resolve 되거나 reject 되는지 확인

```javascript
// resolves
test("should success", async () => {
  await expect(somePromise()).resolves.toBe(value);
});

// rejects
test("should fail", async () => {
  await expect(somePromise()).rejects.toThrow("Error");
});
```

## Mocking 메서드

### jest.fn

- Mock 함수를 생성
- 함수가 호출되었는지, 어떤 매개변수로 호출되었는지 등을 추적 가능

### jset.mock

- 모듈 전체를 모킹
- 외부 라이브러리나 다른 모듈의 동작을 가짜로 대체 가능

### jest.spyOn

- 기존 객체의 메서드를 감시하거나 모킹 ( Proxy ?? )

## 생명주기 메서드

### beforeEach, afterEach

- 각 테스트 전후에 실행
- 테스트 환경을 초기화하거나 정리 할 때 사용

### beforeAll, afterAll

- 모든 테스트 전후에 한 번씩 실행
- 데이터베이스 연결 설정이나 서버 시작/종료 같은 작업에 사용

## 테스트 제어 메서드

### skip , test.skip

- 특정 테스트를 건너뛸 때 사용

### only, test.only

- 해당 테스트만 실행할 때 사용

### timeout

- 테스트의 타임아웃 시간을 설정

## 💥 BDD (Behavior-Driven Development) 란 무엇?

- "행동 주도 개발" , 소프트웨어가 어떻게 동작해야 하는지에 초첨을 맞춘 개발 방법론
- TDD 에서 발전한 개념으로 기술적인 테스트보다는 사용자의 관점에서 소프트웨어의 행동을 설명
- BDD 스타일은 코드를 읽는 사람이 무엇을 테스트하는지, 왜 테스트하는지를 쉽게 이해할 수 있게 해줌
- 특히 비개발자도 테스트 명세를 읽고 이해할 수 있어서, 요구사항과 실제 구현 사이의 간극을 줄이는 데 도움

- **BDD 스타일의 언어 구조**
- Given : 주어진 상황이나 조건
- When : 특정 행동이나 이벤트가 발생할 때
- Then : 기대되는 결과

- Jest에서 **it**을 사용하는 것이 BDD 스타일에 가깝다고 한 이유는, **it**이 더 자연스러운 문장 형태로 테스트를 설명하기 때문 ( 별로 와닿지는 않음.. )

```javascript
// TDD/ 일반적인 스타일
describe("Calculator", () => {
  test("adds 1 + 2 to equal 3", () => {
    expect(add(1, 2)).toBe(3);
  });
});

// BDD
describe("Calculator", () => {
  it("should return 3 when adding 1 and 2", () => {
    expect(add(1, 2)).toBe(3);
  });
});
// it should return 3 when adding 1 and 2 ...
```

### 더 구체적인 BDD 스타일 예문

```javascript
describe("User login", () => {
  describe("when user provides valid credentials", () => {
    it("should successfully log in", () => {
      // Given: 유효한 사용자 정보가 있고
      const user = { email: "test@example.com", password: "password123" };

      // When: 로그인을 시도하면
      const result = login(user);

      // Then: 성공적으로 로그인되어야 한다
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });
  });

  describe("when user provides invalid credentials", () => {
    it("should return an error message", () => {
      // Given: 잘못된 사용자 정보가 있고
      const user = { email: "test@example.com", password: "wrongpassword" };

      // When: 로그인을 시도하면
      const result = login(user);

      // Then: 에러 메시지가 반환되어야 한다
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
    });
  });
});
```
