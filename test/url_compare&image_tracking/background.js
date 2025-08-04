import * as URLJs from './utils/normalize-url-main/index.js'


// const batchMap = new Map();
// const eventTimer = new Map();
// const IDLE = 10000;

const batchForDB = [];
const batchForFetch = [];
const BATCH_LIMIT = 16;
const BATCH_LIMIT_FOR_FETCH = 16;
const IDLEForDB = 20;
const IDLEFORFETCH = 100;

let idleTForDB = null;
let idleTForFetch = null;
let currentTab = null;
let DB = null;
let keySet = null;
let keySetLoaded = false;
let flushPromise = null;
let fetchPromise = null;


/*
resolve(value)
: 작업이 성공했을 때 Promise의 상태를 '이행(fulfilled)' 상태로 전환시키고, 결과를 value로 전달합니다. 해당 값은
.then()의 첫 번째 콜백, 비동기적으로 실행
reject(reason)
: 작업이 실패했을 때 Promise의 상태를 '거부(rejected)' 상태로 전환시키고, 에러(이유)를 reason으로 전달합니다.
해당 값은 .catch() 또는 .then(, ) 두 번째 콜백, 비동기적으로 실행
*/


function openImageUrlDB() {
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
        db.createObjectStore('imgURL', { keyPath: 'canonicalUrl' });
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


function getAllKeysPromise(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAllKeys();
    req.onsuccess = (e) => resolve(e.target.result); // 배열 반환!
    req.onerror = (e) => reject(e.target.error);
  });
}

async function loadKeySet() {
  const tx = DB.transaction('imgURL', 'readonly');
  const store = tx.objectStore('imgURL'); 
  // 이미 저장된 모든 canonicalUrl을 한번에 조회 (대량 처리 시 효율적)
  const existingKeys = await getAllKeysPromise(store);
  // 이미 존재하는지 Set으로 관리(검색 빠름)
  keySet = new Set(existingKeys);
  console.log(keySet.size);
  keySetLoaded = true;
} 






//초기화 코드
//비동기 준비 작업이 완료되어야 다음 코드를 실행할 수 있는 프로마이스 객체(resolved가 반환되어야 함). 함수 자체는 바로 실행
let PromiseForInit = (async () => {
  try{
  DB = await openImageUrlDB();
  await loadKeySet(DB);
  }
  catch(e){
    console.log("서비스워커 초기화 중에 에러 발생:"+e);
  }
  return true;
})(); 



//이미지 url fetch







async function DBCheckAndAdd(batch) {
  if (!keySetLoaded) await loadKeySet(DB);
  if(!DB){
    console.error("error from DBCheckAndAdd:DB가 준비되지 않았음.");
    return;
  }

  const tx = DB.transaction('imgURL', 'readwrite');
  const store = tx.objectStore('imgURL');
  
  const laterToFetch = [];
  const firstToFetch = [];

  for (const item of batch) {
    if (!keySet.has(item.canonicalUrl)) { // fetch 대상(아직 없음)
      if(currentTab == item.tabId){
        firstToFetch.push(	{
          canonicalUrl:item.canonicalUrl,
          url:item.url,
          status: false,
          harmful:false});
          //console.log("firsttofetch!"+firstToFetch.length);
        }
      else{
        laterToFetch.push(	{
          canonicalUrl:item.canonicalUrl,
          url:item.url,
          status: false,
          harmful:false}); 
          //console.log("latertofetch!"+laterToFetch.length);
        }
      store.put({
        canonicalUrl:item.canonicalUrl,
        url: item.url,
        domain: (new URL(item.url)).hostname.replace(/^www\./, '') ,//수정예정,
        harmful: false,   // 기본값
        status: false,   // 검사완료
      });     // DB에 저장
      keySet.add(item.canonicalUrl); // 중복 방지
    }
    // 이미 있으면 아무것도 안 함(무시)
  }
  await tx.done?.(); // 일부 브라우저에선 필요 없음
  
  firstToFetch.unshift(...laterToFetch);
  //console.log("batch size:", batch.length);
  //console.log("fetchdata:"+firstToFetch.length);
  return firstToFetch;        
}



/*
sortQueryParameters: true	파라미터 키를 알파벳 순으로 정렬하여 일관된 비교 문자열 생성 
removeQueryParameters: [/^utm_/, /^fbclid$/]	utm_*, fbclid 등의 추적 파라미터 제거
stripHash: true	URL의 #fragment 전체 삭제
stripTextFragment: true	텍스트 해시 (#:~:text=)까지 제거
stripWWW: true	www. 접두사 제거로 www 유무 차이 무시
removeTrailingSlash: true	경로 끝의 / 제거하여 /img와 /img/ 통일
normalizeProtocol: true	http://와 https:// 일관성 유지(기본값)
*/
function isLikelyQueryString(url) {
  // path에만 '='이 있고, '?'가 없음
  const result = new URL(url);
  return !!result.search;
}
async function canonicalizeImageUrl(rawUrl) {
  if (isLikelyQueryString(rawUrl)) {
    return await URLJs.default(rawUrl, {
      sortQueryParameters: true,
      removeQueryParameters: [/^utm_/, /^fbclid$/],
      stripHash: true,
      stripTextFragment: true,
      stripWWW: true,
      removeTrailingSlash: true,
      normalizeProtocol: true,
    });
  } else {
    // 오타 수정: defaultl → default, url → rawUrl
    return await URLJs.default(rawUrl, {
      stripWWW: true,
      removeTrailingSlash: true,
      normalizeProtocol: true,
    });
  }
}


const eventListner = [];
const waiting = [];

const URlReloadTest = false;
if(URlReloadTest){
  setInterval(() => {
    console.log("재탐색합니다");
    waiting.forEach((item)=>{
      if(keySet.has(item)){
        console.log("재탐색 성공!: " +item);
      }
      else{
      console.log("재탐색하였으나 실패:"+ item);
      }
      if(eventListner.includes(item)){
        console.log("and 네트워크 감지 기록 있음: " + item );
      }
      else{
        console.log("and 네트워크 감지 기록 없음:" +item);
      }
    })
    
  }, 2000);
}

async function onlyCheck(batch) {
  if (!keySetLoaded) await loadKeySet(DB);
  if(!DB){
    console.error("error from DBCheckAndAdd:DB가 준비되지 않았음.");
    return;
  }
  const resolvedBatch = await Promise.all(
    batch.map(async (item) => {
      try {
        // console.log(item.url);
        //canonicalUrl = await canonicalizeImageUrl(item.url); 정규화 과정에서 지속적인 오류 발생으로 일단 제외
        // console.log("정규화url" + canonicalUrl);
        if(keySet.has(item.url)){
          //console.log("일치하는 url있음");
          return item;
        }
        else{
          const cachCheck = await caches.match(item.url);
          if(cachCheck){
            //console.log("cach 확인 결과, 일치하는 url있음");
          }
          else{
              //console.log("못찾음: " + item.url);
              waiting.push(item.url);
            }
          
        }
      } catch (e) {
        //console.log(item.url+" <-이미지 비교중 에러");
      }
    }).filter(item => item !== undefined)
  );
  //console.log(batch);
  //console.log(resolvedBatch);
  return resolvedBatch;
}


async function maybeDBFlush() {
  console.log("limit: "+BATCH_LIMIT+ " batch length: "+batchForDB.length);
  if (batchForDB.length >= BATCH_LIMIT) await flushBatch();
  clearTimeout(idleTForDB);
  idleTForDB = setTimeout(flushBatch, IDLEForDB);
}


async function beforefetchbatch(){
  console.log("timer에 의한 fetch");
  await fetchBatch();
}

async function maybeFetch() {
  console.log("maybefetch! |  현재 fetch 예정 data 수: "+batchForFetch.length);
  if(batchForFetch.length >=BATCH_LIMIT_FOR_FETCH) {
    await fetchBatch();
  }
  else {
    await fetchPromise;
  }
  console.log("프로미스 기다림 종료");
  clearTimeout(idleTForFetch);
  idleTForFetch = setTimeout(beforefetchbatch, IDLEFORFETCH);
}

  
async function  fetchBatch() {
  if(fetchPromise) return fetchPromise;

  fetchPromise = (async () =>{
    try {
      if(batchForFetch.length === 0) return [];
      const bodyData = JSON.stringify({ data:batchForFetch.splice(0,16)}); 
      const start = performance.now();
      console.log("fetch!");
      const res =  await fetch("https://image-interceptor-683857194699.asia-northeast3.run.app/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyData
      });

      if(!res.ok) throw new Error("서버 응답 오류");// catch로 이동
      //const responseBodyData = res.json();
       console.log(`response delaytime: ${(performance.now()-start)/1000}`);
    } catch(err){
       console.error(
        err instanceof SyntaxError
          ? `JSON parsing failed: ${err.message}`
          : `Request failed: ${err.message}`
      );
    } 
  })();

  try {
    await fetchPromise
  } finally {
    console.log("프로미스 종료");
    fetchPromise = null;
  }
  return fetchPromise;
}




async function flushBatch() {
  if(flushPromise) return flushPromise;

  flushPromise = (async () => {
    if(batchForDB.length === 0 ) return;
    // 모든 canonicalUrlPromise가 끝나기를 기다림
  
    const errorCount = 0;
    const snapshot = batchForDB.splice(0,batchForDB.length); //새로 push된 data를 잃어버리지 않기 위해 스냅샷 생성 후 이용
    const resolvedBatch = await Promise.all(
      snapshot.map(async (item) => {
        let canonicalUrl;
        // try {
        //   canonicalUrl = await item.canonicalUrlPromise;
        // } catch (e) {
        //   console.log(item.url+"<-정규화 에러");
        //   errorCount++;
        //   canonicalUrl = item.url; //일단은 고유 url 넣고 push
        // }
        return {
          canonicalUrl: item.url,   // 정규화 url, 인덱스/PK
          tabId: item.tabId,
          url: item.url           // 원본 url 
        };
      })
    ).catch(()=>{console.log("총 실패한 데이터 수:" + errorCount)});
    console.log("flush!");
    batchForFetch.push(...await DBCheckAndAdd(resolvedBatch));
    maybeFetch();
  
  })();

  try {
    await flushPromise
  } finally {
    flushPromise = null;
  }
}


async function storeImage(tabId,url) {
  batchForDB.push(
    {
    canonicalUrlPromise: canonicalizeImageUrl(url),
    tabId:tabId,
    url: url
    }
  );
  
  await maybeDBFlush();
}


chrome.tabs.onActivated.addListener(({ tabId }) => {
  currentTab = tabId;
});


/*webRequest로 이미지 네트워크 수신 감지*/
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type === "image" && details.tabId >= 0) {

      eventListner.push(details.url);
      storeImage( details.tabId, details.url);

    }  
  },  
  { urls: ["<all_urls>"] }
);  



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const batchFromPage = message.data;
  //console.log(batchFromPage);
  //console.log("서비스 워커 수신 data: " + batchFromPage.length);
  // sendResponse({
  //       type: "response",
  //       data: batchFromPage, // 20개만 보내고, 배열은 자동으로 비움
  //     });
  if (message?.type === "imgDataFromPage") {
    if(sender.tab.id )
     onlyCheck(message.data).then(batchFromPage => {
      sendResponse({
        type: "response",
        data: batchFromPage, // 20개만 보내고, 배열은 자동으로 비움
      });
    });
    return true;
  }
});



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "imgDataFromContentScript") {
     onlyCheck(message.data).then(batchFromScript => {
      sendResponse({
        type: "response",
        data: batchFromScript, 
      });
    });
    return true;
  }
});

// setInterval(
//   () =>{
//     chrome.runtime.sendMessage({
//       type: "waitingData",
//       data: waiting, // 20개만 보내고, 배열은 자동으로 비움
//     });
//     waiting.splice(0, waiting.length); 
//       }, 500);


      
// // 크롬 확장 프로그램 manifest에 "webRequest", "webRequestBlocking", "<all_urls>" 권한 필요

// const successSet = new Set();
// const totalSet = new Set();
// const failMap = new Map();

// // 이미지 요청 추적
// chrome.webRequest.onCompleted.addListener(
//   async (details) => {
//     // 이미지 요청만 필터
//     if (details.type !== "image") return;

//     const imageUrl = details.url;
//     // 중복 요청 방지
//     if (successSet.has(imageUrl) || failMap.has(imageUrl)) return;

//     totalSet.add(imageUrl);

//     try {
//       const res = await fetch(imageUrl, { mode: "cors", cache: "no-store" });
//       // "no-cors"로 요청하면 res.ok가 항상 false일 수 있으므로 status만 체크
//       if (res.status >= 200 && res.status < 400) {
//         console.log(`[이미지 성공] ${imageUrl} (status: ${res.status})`);
//         console.log('%c ', `font-size:1px; padding:20px; background:url(${imageUrl}) no-repeat; background-size:contain;`);
      
//         successSet.add(imageUrl);
//       } else {
//         // 이미지 데이터 받았으나 상태코드 이상
//         const msg = `[이미지 수신 비정상] ${imageUrl} (status: ${res.status})`;
//         console.warn(msg);
//         failMap.set(imageUrl, msg);
//       }
//     } catch (err) {
//       // fetch가 실제로 거부/차단된 경우
//       let reason = "알 수 없는 오류";
//       if (err instanceof TypeError) {
//         reason = "CORS 정책 또는 네트워크/인증/캐시 문제";
//       }
//       const msg = `[이미지 실패] ${imageUrl} (원인: ${reason}, 상세: ${err.message})`;
//       console.error(msg);
//       failMap.set(imageUrl, msg);
//     }
//   },
//   { urls: ["<all_urls>"] }
// );

// // 5초마다 누적 결과 콘솔 출력
// setInterval(() => {
//   const ok = successSet.size;
//   const fail = failMap.size;
//   console.log(`[5초 집계] 이미지 요청 결과 - 성공: ${ok}건, 실패: ${fail}건`);
// }, 5000);


// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   if (msg === "getSuccessImages") {
//     sendResponse(Array.from(totalSet));
//   }
// });
