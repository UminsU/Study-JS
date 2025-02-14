const $runningman = document.querySelector('#runningman');
const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
const characterLocation = {
    x: 0, y: 0 // 실제 효과가 아닌 데이터지만, 초기 지점에 싱크가 됨
    // 반응형 및 스크린 사이즈와 결합해서 사용하면 실제 좌표처럼 활용 가능
}

/*
setTimeout(() => {
  $runningman.classList.remove('pause-running');
  $runningman.classList.add('play-running');
}, 4000)

setTimeout(() => {
  $runningman.classList.remove('play-running');
  $runningman.classList.add('pause-running');
}, 2000)
*/

document.addEventListener('keydown', (evt) => {
    if (!allowedKeys.includes(evt.key)) {
        return;
    }
    $runningman.classList.remove('pause-running');
    $runningman.classList.add('play-running');
    // 키 내용 해석 및 좌표 수정 (translate 로 이동 가능)
    switch (evt.key) {
        case 'ArrowUp':
            characterLocation.y -= 10;
            // 좌표 수정
            break;
        case 'ArrowDown':
            characterLocation.y += 10;
            // 좌표 수정
            break;
        case 'ArrowLeft':
            characterLocation.x -= 10;
            // 좌표 수정
            break;
        case 'ArrowRight':
            characterLocation.x += 10;
            // 좌표 수정
            break;
        default:
            break;
    }
    // 2) 실제 좌표 수정
    $runningman.setAttribute('style', `transform: translate(${characterLocation.x}px,${characterLocation.y}px)`);
})

document.addEventListener('keyup', (evt) => {
    if (allowedKeys.includes(evt.key)) {
        return;
    }
    $runningman.classList.remove('play-running');
    $runningman.classList.add('pause-running');
})

