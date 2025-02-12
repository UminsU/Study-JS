document.addEventListener("DOMContentLoaded", function () {
    // 1. 모든 박스 가져오기
    let boxes = document.querySelectorAll(".animal-box");

    // 2. 랜덤으로 펭귄 위치 정하기 (1~5 중 하나)
    let penguinPosition = Math.floor(Math.random() * 5);

    // 3. 사용자 입력 받기
    let userInput = prompt("펭귄이 숨어있는 박스 번호 (1~5)를 입력하세요!");
    console.log(`${userInput}번 상자를 선택하였습니다!`);

    // 4. 입력값과 정답 비교
    if (parseInt(userInput) - 1 === penguinPosition) {
        console.log("정답입니다! 펭귄을 찾았어요! 🐧");
    } else {
        console.log(`틀렸습니다! 펭귄은 ${penguinPosition + 1}번 상자에 있었습니다!`);
    }
    // 5. 정답 박스에 펭귄 표시
    boxes[penguinPosition].textContent = "🐧";
});
