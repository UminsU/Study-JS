let db;  // 데이터베이스 객체
window.setCurrentDB = (newDB) => {
    db = newDB;
}
window.getCurrentDB = () => {
    return db;
}
const DB_FILE_URL = "sample-db.sqlite";  // 초기화할 DB 파일 경로
import {loadDatabaseFromIndexedDB} from "./indexedDB.js";

// SQLite 환경 초기화
async function initDatabase() {
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
    });

    // 1) 브라우저 IndexedDB 를 통한 초기화
    const savedDb = await loadDatabaseFromIndexedDB();
    if (savedDb) {
        db = new SQL.Database(new Uint8Array(savedDb));
        console.log("✅ 브라우저 IndexedDB 에서 데이터 초기화 완료!");
        displayUsers();
        return;
    }
    // 2) 로컬 파일 DB 를 통한 초기화
    const response = await fetch(DB_FILE_URL);
    if (response.ok) {
        const data = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(data));
        console.log("✅ 로컬 DB 파일에서 초기화 완료!");
        displayUsers();
        return;
    }
    // 3) 새로 데이터베이스 생성
    db = new SQL.Database();
    // 3-1) 테이블 초기화
    db.run(`
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL
        );
    `);
    console.warn("⚠️ 새로 브라우저 DB 생성 (빈 스키마 초기화)");
    displayUsers();
}
window.initDatabase = initDatabase;

// 회원 추가
document.getElementById("userForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;

    db.run("INSERT INTO user (name, email) VALUES (?, ?)", [name, email]);
    await displayUsers();
    document.getElementById("userForm").reset();
});

// 회원 정보 수정
function updateUser(id) {
    const newName = document.getElementById(`name-${id}`).value;
    const newEmail = document.getElementById(`email-${id}`).value;

    db.run("UPDATE user SET name = ?, email = ? WHERE id = ?", [newName, newEmail, id]);
    displayUsers();
}
window.updateUser = updateUser;  // module 내부에 선언된 함수를 글로벌 스코프에 등록

// 회원 삭제
function deleteUser(id) {
    if (confirm("정말 삭제하시겠습니까?")) {
        db.run("DELETE FROM user WHERE id = ?", [id]);
        displayUsers();
    }
}
window.deleteUser = deleteUser;  // module 내부에 선언된 함수를 글로벌 스코프에 등록

// 회원 목록 표시
function displayUsers() {
    const result = db.exec("SELECT * FROM user");
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
window.displayUsers = displayUsers;

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
const $dbSaveBtn = document.getElementById('saveDB')
$dbSaveBtn.addEventListener('click', saveDatabase)

// 데이터베이스 파일 불러오기
async function loadDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";
    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` });
        db = new SQL.Database(data);
        console.log("📂 파일로부터 데이터베이스 로드 완료.");
        await displayUsers();
    };
    reader.readAsArrayBuffer(file);
}
const $dbLoadBtn = document.getElementById('loadDB')
$dbLoadBtn.addEventListener('change', loadDatabase)

// 페이지 로딩 시 DB 초기화
window.onload = initDatabase;