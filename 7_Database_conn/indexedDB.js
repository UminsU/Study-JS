// === 전역 상수 정의 ===
// 현재 호스트명을 통해 DB 이름을 동적으로 생성 (협업 시 환경별 충돌 방지)
const CURRENT_HOST = window.location.host;
// IndexedDB에 저장할 데이터베이스 이름 (호스트명을 포함하여 유니크하게 생성)
const DB_NAME = `sqliteDB@${CURRENT_HOST}`;
// IndexedDB 내에서 SQL 데이터베이스 덤프를 저장할 오브젝트 스토어의 키
const OBJECT_KEY = 'sqliteDump';

// -------------------------------------------------------------------------
// 헬퍼 함수: ensureObjectStore
// - onupgradeneeded 이벤트에서 오브젝트 스토어가 없으면 생성하도록 처리하여
//   중복되는 코드를 줄이고 유지보수를 용이하게 함
function ensureObjectStore(db) {
    // 오브젝트 스토어가 존재하지 않으면 생성
    if (!db.objectStoreNames.contains(OBJECT_KEY)) {
        db.createObjectStore(OBJECT_KEY);
        console.log(`Object Store '${OBJECT_KEY}'가 생성되었습니다.`);
    }
}

// -------------------------------------------------------------------------
// 헬퍼 함수: openDB
// - IndexedDB 열기를 Promise 로 래핑하여 async/await 문법과 자연스럽게 통합
// - onupgradeneeded 에서 ensureObjectStore 호출해 스키마 보장
function openDB(version = 1) {
    return new Promise((resolve, reject) => {
        // 데이터베이스 열기 시도 (버전 번호를 명시)
        const request = indexedDB.open(DB_NAME, version);
        // onupgradeneeded: DB가 최초 생성되거나 버전 업그레이드 시 실행됨
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // 헬퍼 함수를 호출하여 OBJECT_KEY 스토어 생성 보장
            ensureObjectStore(db);
        };
        // DB 열기 성공 시 Promise resolve
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        // DB 열기 실패 시 Promise reject
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// -------------------------------------------------------------------------
// [0] IndexedDB 및 오브젝트 스토어 생성 함수
// - DB가 존재하지 않거나, 스토어가 필요할 경우 사용
function createNewDatabaseAndObjectStore() {
    return new Promise((resolve, reject) => {
        // IndexedDB 지원 여부 확인 (지원하지 않으면 바로 reject)
        if (!window.indexedDB) {
            console.error("IndexedDB를 지원하지 않는 환경입니다.");
            reject("IndexedDB를 지원하지 않는 환경입니다.");
            return;
        }
        // 버전 1로 DB 열기 (최초 생성 시 onupgradeneeded 이벤트 발생)
        const request = indexedDB.open(DB_NAME, 1);
        console.log(request); // 디버깅용: 요청 객체 로그 출력

        // onupgradeneeded: DB 생성/업그레이드 시 OBJECT_KEY 스토어 생성
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // OBJECT_KEY 스토어가 없으면 생성
            if (!db.objectStoreNames.contains(OBJECT_KEY)) {
                db.createObjectStore(OBJECT_KEY);
                console.log(`Object Store '${OBJECT_KEY}'가 생성되었습니다.`);
            }
        };
        // onsuccess: DB 열기 성공 시, DB를 닫고 Promise resolve
        request.onsuccess = (event) => {
            console.log("새로운 데이터베이스와 오브젝트 스토어가 생성되었습니다.");
            event.target.result.close(); // 자원 해제를 위해 DB 닫기
            resolve();
        };
        // onerror: DB 열기 실패 시 에러 로그 출력 후 Promise reject
        request.onerror = (event) => {
            console.error("데이터베이스 생성에 실패했습니다.", event);
            reject("데이터베이스 생성에 실패했습니다.");
        };
    });
}

// -------------------------------------------------------------------------
// [1] IndexedDB에 데이터 저장 함수
// - SQL.js DB 데이터를 ArrayBuffer로 변환 후, IndexedDB에 저장
// - 기존 DB 삭제 후 저장하여 최신 상태 유지
export async function saveDBToIndexedDB() {
    // 현재 SQL.js 데이터베이스에서 데이터를 추출하고 ArrayBuffer로 변환
    const dbData = getCurrentDB().export();
    const buffer = dbData.buffer; // ArrayBuffer 추출

    // 기존 IndexedDB 삭제 (유효하지 않은 스토어가 있을 경우 대비)
    await deleteDatabase();

    // openDB 헬퍼를 사용하여 버전 1로 DB 열기
    openDB(1).then((db) => {
        // OBJECT_KEY 스토어가 존재하는지 확인
        if (!db.objectStoreNames.contains(OBJECT_KEY)) {
            console.log(`❌ '${OBJECT_KEY}' 오브젝트 스토어가 생성되지 않아 종료합니다.`);
            db.close();
            return;
        }
        // 읽기/쓰기 트랜잭션 생성 (스토어에 접근하여 데이터 저장)
        const transaction = db.transaction(OBJECT_KEY, "readwrite");
        const store = transaction.objectStore(OBJECT_KEY);
        // 'db' 키로 buffer 저장 (덮어쓰기 가능)
        const putRequest = store.put(buffer, "db");

        // 데이터 저장 성공 핸들러
        putRequest.onsuccess = () => {
            console.log("💾 데이터베이스가 IndexedDB에 안전하게 저장되었습니다.");
        };
        // 데이터 저장 실패 핸들러
        putRequest.onerror = (err) => {
            console.error("❌ IndexedDB 저장 실패:", err);
        };
        // 트랜잭션 완료 후 DB 닫기 및 로그 출력
        transaction.oncomplete = () => {
            console.log("✅ (DB 저장) IndexedDB 트랜잭션 완료");
            db.close();
        };
    }).catch((err) => {
        // DB 열기 실패 시 에러 출력
        console.error("❌ IndexedDB 열기 실패:", err);
    });
}

// 이벤트 리스너 등록: 'saveDB_browser' 버튼 클릭 시 saveDBToIndexedDB 실행
const $idxDBSaveBtn = document.getElementById('saveDB_browser');
$idxDBSaveBtn?.addEventListener('click', saveDBToIndexedDB);

// -------------------------------------------------------------------------
// [2] IndexedDB에서 데이터 로드 함수
// - 저장된 SQL.js 데이터베이스를 불러와 복원
// - OBJECT_KEY 스토어가 없으면 버전 업그레이드를 통해 생성 후 null 반환
export function loadDatabaseFromIndexedDB(version = 1) {
    return new Promise((resolve, reject) => {
        // IndexedDB 지원 여부 확인
        if (!window.indexedDB) {
            console.warn("IndexedDB가 지원되지 않습니다. 신규 생성합니다.");
            // 지원되지 않으면 신규 DB 및 스토어 생성 후 null 반환
            createNewDatabaseAndObjectStore().then(() => resolve(null)).catch(reject);
            return;
        }
        // openDB 헬퍼를 사용하여 지정된 버전으로 DB 열기
        openDB(version).then((db) => {
            // OBJECT_KEY 스토어가 없으면 버전 업그레이드 필요
            if (!db.objectStoreNames.contains(OBJECT_KEY)) {
                console.warn(`⚠️ '${OBJECT_KEY}' 오브젝트 스토어가 존재하지 않습니다. 버전을 증가시켜 추가합니다.`);
                db.close();
                // 현재 DB 버전 +1로 재시도하여 스토어 생성
                openDB(db.version + 1).then((upgradedDB) => {
                    upgradedDB.close();
                    resolve(null);
                }).catch((err) => {
                    reject("❌ IndexedDB 오브젝트 스토어 추가 실패: " + err);
                });
            } else {
                // OBJECT_KEY 스토어가 존재하면 데이터 로드 진행
                console.log('기존 IndexedDB가 존재합니다. 로드를 시작합니다.');
                const transaction = db.transaction(OBJECT_KEY, "readonly");
                const store = transaction.objectStore(OBJECT_KEY);
                // IDBRequest는 프로미스가 아니므로 await 제거하고 이벤트 핸들러 사용
                const getRequest = store.get("db");

                // 데이터 조회 성공 시 처리
                getRequest.onsuccess = () => {
                    if (!getRequest.result) {
                        console.log('IndexDB의 Obj Store에 저장된 sqlite 데이터가 없습니다.');
                        resolve(null);
                        return;
                    }
                    console.log('indexDB-ObjStore-sqliteDB를 로딩합니다.');
                    resolve(getRequest.result);
                };
                // 데이터 조회 실패 시 에러 처리
                getRequest.onerror = () => {
                    reject("❌ 데이터베이스 로딩 실패");
                };
                // 트랜잭션 완료 후 DB 닫기 및 로그 출력
                transaction.oncomplete = () => {
                    console.log("(DB 로드) IndexedDB 트랜잭션 종료");
                    db.close();
                };
            }
        }).catch((err) => {
            // 버전 오류 등 기타 오류 발생 시 처리
            if (err.name === 'VersionError') {
                // 에러 메시지 파싱을 통해 최신 버전 번호 획득 (원래 로직 유지)
                const versionStr = err.message.split('(')[2];
                const availableVersion = versionStr ? versionStr[0] : version;
                console.log(`최신버전 로드: ${availableVersion}`);
                // 재귀 호출을 통해 해당 버전으로 재시도
                loadDatabaseFromIndexedDB(availableVersion).then(resolve).catch(reject);
            } else {
                reject(`❌ IndexedDB 열기 실패 (${err.name || err})`);
            }
        });
    });
}

// 이벤트 리스너 등록: 'loadDB_browser' 버튼 클릭 시 loadDatabaseFromIndexedDB 실행
const $idxDBLoadBtn = document.getElementById('loadDB_browser');
$idxDBLoadBtn?.addEventListener('click', async () => {
    // initSqlJs 외부 함수로 SQL.js 초기화 (필요 시 모듈 import 고려)
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}`
    });
    // 저장된 데이터 로드 시도
    const savedDb = await loadDatabaseFromIndexedDB();
    if (savedDb) {
        // 불러온 데이터를 기반으로 SQL.js Database 생성
        const db = new SQL.Database(new Uint8Array(savedDb));
        setCurrentDB(db); // 전역 DB 상태 업데이트 (외부 함수)
        console.log("✅ 브라우저 IndexedDB에서 데이터 초기화 완료!");
        await displayUsers(); // 사용자 목록 갱신 (외부 함수)
    }
});


// -------------------------------------------------------------------------
// [3] IndexedDB 삭제 함수: deleteDatabase
// - force_delete 가 true 이면 강제 삭제, 아니면 OBJECT_KEY 존재 여부에 따라 삭제 결정
export async function deleteDatabase(force_delete = false) {
    // 삭제 필요 여부를 결정하는 변수 (초기값: force_delete)
    let deleteNeeded = force_delete;
    if (!force_delete) {
        // openDB를 통해 현재 DB를 열어 OBJECT_KEY 스토어 존재 여부 확인
        try {
            const db = await openDB(1);
            if (!db.objectStoreNames.contains(OBJECT_KEY)) {
                console.log(`❌ ${OBJECT_KEY} 오브젝트 스토어가 없는 DB는 사용할 수 없습니다.`);
                deleteNeeded = true;
            }
            db.close();
        } catch (err) {
            console.error("DB 열기 실패 시 삭제 조건 확인 에러:", err);
            deleteNeeded = true;
        }
    }
    // 삭제가 필요한 경우, Promise 로 감싸서 삭제 작업 수행
    if (deleteNeeded) {
        return new Promise((resolve, reject) => {
            // IndexedDB.deleteDatabase() 호출하여 DB 삭제 요청
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
            // 삭제 성공 시 처리: 알림 후 initDatabase() 호출하여 DB 재초기화
            deleteRequest.onsuccess = async () => {
                console.log("✅ IndexedDB 삭제 완료");
                alert("DB가 초기화되었습니다. 페이지를 새로고침 합니다.");
                await initDatabase(); // 외부 함수: DB 초기화
                resolve();
            };
            // 삭제 차단 시 로그 출력 (다른 탭에서 DB 사용 중일 경우)
            deleteRequest.onblocked = () => {
                console.warn("⚠️ 삭제가 차단되었습니다. 열린 DB 연결을 모두 닫아주세요.");
            };
            // 삭제 실패 시 에러 처리
            deleteRequest.onerror = (err) => {
                console.error("❌ IndexedDB 삭제 실패:", err);
                reject(err);
            };
        });
    }
}

// -------------------------------------------------------------------------
// [4] IndexedDB 삭제 실행 함수: clearIdxDB
// - DB가 존재하면 열어서 연결을 닫고, deleteDatabase() 호출하여 DB 삭제
export async function clearIdxDB() {
    console.log("🗑 IndexedDB 삭제 시작...");
    // indexedDB.databases()로 현재 DB 목록 확인 (비동기 API)
    const databases = await indexedDB.databases();
    // DB 목록에 DB_NAME이 존재하는지 확인
    const dbExists = databases.some(db => db.name === DB_NAME);
    if (!dbExists) {
        console.log("📂 IndexedDB가 존재하지 않음. 삭제 작업을 중단합니다.");
        return;  // DB가 없으면 함수 종료
    }
    console.log("🔒 열린 IndexedDB 닫기...");
    try {
        // openDB 헬퍼로 DB 열기 후 닫기
        const db = await openDB(1);
        db.close();
        console.log("✅ IndexedDB 연결 닫음. 삭제 시작...");
        // 강제 삭제를 위해 force_delete true 전달
        await deleteDatabase(true);
    } catch (err) {
        console.error("❌ DB 열기 실패:", err);
    }
}

// 이벤트 리스너 등록: 'clearDB_browser' 버튼 클릭 시 clearIdxDB 실행
const $idxDBClearBtn = document.getElementById('clearDB_browser');
$idxDBClearBtn?.addEventListener('click', clearIdxDB);
