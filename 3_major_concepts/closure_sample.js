// 클로저를 반환하는 외부함수 선언
function outerFunc() {
    let outerLexVar = "외부함수 스코프를 참조합니다!";

    function innerFunc() {
        console.log(outerLexVar);
    }

    return innerFunc;
}

var innerFunc = outerFunc(); // outerFunc가 innerFunc(클로저) 반환

innerFunc(); // 출력: 외부함수 스코프를 참조합니다! (outerFunc 렉시컬 스코프 참조 유지)