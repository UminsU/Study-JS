// 스코프 밖 변수 존재
var a = 10;
{
    // 렉시컬 스코프 안에 있는 변수를 참조하는 함수 선언
    let a = 1;

    function b() {
        console.log(a)
    }

    a = 2;
}
// 함수 호출 위치는 스코프 밖이지만 함수는 렉시컬 스코프를 계속 참조
b(); // 1