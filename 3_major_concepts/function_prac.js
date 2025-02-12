function greet(name) {
    console.log("Hi" + name);
}

greet("Minsu");

const greetFunObj = function (name) {
    // 함수는 일급 객체이므로 변수에 할당 가능
    console.log("Hi" + name);
}

console.log(greetFunObj);
console.log(typeof greetFunObj);
console.log(typeof [1, 2, 3]);

(function (name) {
    console.log("Hi" + name);
})(", Welcome");

function rollDice(dicePlanes = 6) {
    return Math.floor(Math.random() * dicePlanes) + 1;
}

console.log(rollDice(100));

function createMultiplier(factor) {
    // 내부에서 선언과 리턴을 동시에!
    return function (number) {
        return number * factor;
    };
}  // Factory Pattern 이 함수에 대해 적용되었다고 볼 수 있음

console.log(
    // currying 문법 ()() 간단한 예제
    createMultiplier(10)(20)
)

// 함수형 프로그래밍의 패턴
// 1) Input 외의 외부 상태에 의존하지 않는 로직 설계
// 2) 해당 로직을 수행하는 데 필요한 연산과정에 단계별 이름을 짓고 구획을 나눔
// 3) 각 이름에 해당하는 함수를 선언 (중첩형, 다음 단계 처리할 함수를 리턴)
// 4) Currying 방식으로 호출