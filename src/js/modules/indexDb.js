export let DB = null;
export let keySet = null;
export let keySetLoaded = false;



export  async function initIndexDb() {
    try {
        DB = await openImageUrlDB();
        await loadKeySet(DB);
        console.log("db로드완료");
    }
    catch (e) {
        console.log("서비스워커 초기화 - db 로드 및 키셋 로드 중에 에러 발생:" + e);
        throw new Error("error while loading db or keyset ");
    }
    return true;
}


/*
resolve(value)
: 작업이 성공했을 때 Promise의 상태를 '이행(fulfilled)' 상태로 전환시키고, 결과를 value로 전달합니다. 해당 값은
.then()의 첫 번째 콜백, 비동기적으로 실행
reject(reason)
: 작업이 실패했을 때 Promise의 상태를 '거부(rejected)' 상태로 전환시키고, 에러(이유)를 reason으로 전달합니다.
해당 값은 .catch() 또는 .then(, ) 두 번째 콜백, 비동기적으로 실행
*/
export function openImageUrlDB() {
    return new Promise((resolve, reject) => {
        //imageUrlDB는 db이름. 만약 존재하지 않으면 생성, 존재하면 해당 db를 열음 
        //두번째 인자인 1은 데이터 베이스 버전. 만약에 db가 이 값보다 버전이 낮다면 업그레이드 이벤트가 발생됨.(onupgradeneeded)
        const request = indexedDB.open('imageUrlDB', 1);
        //업그레이드가 발생할 경우 이벤트 핸들러에서 실행할 콜백 함수 정의
        request.onupgradeneeded = (event) => {
            // open 요청으로 열리거나 생성된 데이터베이스(IDBDatabase) 객체. 
            //이 객체로 objectStore(테이블 같은 개념)를 만들거나 삭제하는 등 데이터베이스의 스키마를 조작할 수 있음
            // objectStore은 일종의 "테이블" 개념이며 관계형DB의 테이블보다 자유로운 형태로, 자바스크립트 객체 단위로 
            //데이터를 저장할 수 있음
            //keyPath는 저장하는 각 객체에서 기본키로 사용할 속성 이름
            const db = event.target.result;
            // images objectStore 생성, keyPath는 canonicalUrl로!

            if (!db.objectStoreNames.contains('imgURL')) {

                db.createObjectStore('imgURL', { keyPath: 'url' });
            }
        };
        request.onsuccess = (event) => {

            resolve(event.target.result); // promise value에 db 인스턴스 반환값 저장
        };

        request.onerror = (event) => {

            reject(event.target.error); // promise reason에 event.target.error 저장
        };
    });
}


export function getAllKeysPromise(store) {
    return new Promise((resolve, reject) => {
        const req = store.getAllKeys();
        req.onsuccess = (e) => resolve(e.target.result); // 배열 반환!
        req.onerror = (e) => reject(e.target.error);
    });
}


export async function loadKeySet() {
    const tx = DB.transaction('imgURL', 'readonly');
    const store = tx.objectStore('imgURL');
    // 이미 저장된 모든 canonicalUrl을 한번에 조회 (대량 처리 시 효율적)
    const existingKeys = await getAllKeysPromise(store);
    // 이미 존재하는지 Set으로 관리(검색 빠름)
    keySet = new Set(existingKeys);
    console.log(keySet.size);
    keySetLoaded = true;
}

/**ㄸ
 * 
 * @param {Object} tableMethodResult table에 get,put 등 비동기 요청의 반환값  
 */

export function reqTablePromise(tableMethodResult) {
    return new Promise((resolve, reject) => {
        tableMethodResult.onsuccess = (event) => {
            resolve(event.target.result);
        }
        tableMethodResult.onerror = (event) => {
            reject(event.target.error);
        }
    });
}



export async function updateDB(responseData) {
    const tx = DB.transaction('imgURL', 'readwrite');
    const store = tx.objectStore('imgURL');

    for (const [url, imgResData] of responseData) {
        let dbValue = await reqTablePromise(store.get(url)).then(result => {
            console.log("table에서 key 조회하고 value 가져오기 성공");
            return result;
        }).catch(error => {
            console.error("table에서 key 조회하고 value 가져오는 중에 Error 발생:", error);
        });
        dbValue.response = imgResData.response;
        dbValue.status = imgResData.status;
        dbValue.harmful = imgResData.harmful;
        await reqTablePromise(store.put(dbValue));
    }

    //tx 완료 기달릴 필요 x?...

}
