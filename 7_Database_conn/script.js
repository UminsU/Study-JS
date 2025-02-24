let db;  // 데이터베이스 객체

// SQLite 환경 초기화
async function initDatabase() {
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
    });

    // DB 없으면 새로 생성
    db = new SQL.Database();

    // users 테이블 생성
    db.run(
        `CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(30) NOT NULL,
            email VARCHAR(30) NOT NULL
        );`
    );
    displayUsers();
}

// 회원 추가
document.getElementById("userForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;

    db.run("INSERT INTO users (name, email) VALUES (?, ?)", [name, email]);
    displayUsers();
    document.getElementById("userForm").reset();
});

// 회원 목록 표시
function displayUsers() {
    const result = db.exec("SELECT * FROM users");
    const tableBody = document.querySelector("#userTable tbody");
    tableBody.innerHTML = "";

    if (result.length > 0) {
        const rows = result[0].values;
        rows.forEach(row => {
            const [id, name, email] = row;
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${id}</td>
                <td><input type="text" value="${name}" id="name-${id}"></td>
                <td><input type="email" value="${email}" id="email-${id}"></td>
                <td><button onclick="updateUser(${id})">수정</button></td>
                <td><button onclick="deleteUser(${id})">삭제</button></td>
            `;

            tableBody.appendChild(tr);
        });
    }
}

// 회원 정보 수정
function updateUser(id) {
    const newName = document.getElementById(`name-${id}`).value;
    const newEmail = document.getElementById(`email-${id}`).value;

    db.run("UPDATE users SET name = ?, email = ? WHERE id = ?", [newName, newEmail, id]);
    displayUsers();
}

// 회원 삭제
function deleteUser(id) {
    if (confirm("정말 삭제하시겠습니까?")) {
        db.run("DELETE FROM users WHERE id = ?", [id]);
        displayUsers();
    }
}

// 데이터베이스 파일 저장
function saveDatabase() {
    const data = db.export();
    const blob = new Blob([data], { type: "application/octet-stream" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "database.sqlite";
    link.click();
    alert("데이터베이스가 저장되었습니다.");
}
const dbSaveBtn = document.getElementById('saveDB')
dbSaveBtn.addEventListener('click', saveDatabase)

// 데이터베이스 파일 불러오기
async function loadDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` });
        db = new SQL.Database(data);

        alert("데이터베이스가 불러와졌습니다.");
        displayUsers();
    };
    reader.readAsArrayBuffer(file);
}
const dbLoadBtn = document.getElementById('loadDB')
dbLoadBtn.addEventListener('change', loadDatabase)

// 페이지 로딩 시 DB 초기화
window.onload = initDatabase;
