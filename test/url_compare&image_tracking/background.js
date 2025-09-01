import * as URLJs from './utils/normalize-url-main/index.js'


// const batchMap = new Map();
// const eventTimer = new Map();
// const IDLE = 10000;

const batchForDB = [];
// const batchForFetch = [];
const CsBatchForWaiting = new Map(); // url : {url:asdfas, status: adsfsadf, harmful:fdsafafsda}
const BATCH_LIMIT = 16;
const BATCH_LIMIT_FOR_FETCH = 16;
const IDLEForDB = 20;
const IDLEFORFETCH = 100;
const retryThreshold = 15*1000;

let mustFlush = false;
let idleTForDB = null;
let idleTForFetch = null;
let currentTab = null;
let DB = null;
let keySet = null;
let keySetLoaded = false;
let flushPromise = null;
let fetchPromise = null;
let totalimg = 0;


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

/**ㄸ
 * 
 * @param {Object} tableMethodResult table에 get,put 등 비동기 요청의 반환값  
 */

function reqTablePromise(tableMethodResult) {
  return new Promise((resolve, reject) => {
    tableMethodResult.onsuccess = (event) => {
      resolve(event.target.result);
    }
    tableMethodResult.onerror = (event) => {
      reject(event.target.error);
    }
  });
}


//초기화 코드
//비동기 준비 작업이 완료되어야 다음 코드를 실행할 수 있는 프로마이스 객체(resolved가 반환되어야 함). 함수 자체는 바로 실행
let PromiseForInit = (async () => {
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
})();


// async function DBCheckAndAdd(batch) {
//   if (!keySetLoaded) await loadKeySet(DB);
//   if (!DB) {
//     console.error("error from DBCheckAndAdd:DB가 준비되지 않았음.");
//     return;
//   }



//   const laterToFetch = [];
//   const firstToFetch = [];
//   const imagesNotInDB = [];

//   for (const item of batch) {
//     if (!keySet.has(item.canonicalUrl)) { // fetch 대상(아직 없음)
//       let pureBase64;

//       try {
//         pureBase64 = await fetchAndReturnBase64Img(item.url);
//       } catch (err) {
//         console.log("error while making base64: ", err);
//       }


//       if (currentTab == item.tabId) {
//         firstToFetch.push({
//           url: item.url,
//           content: pureBase64,
//           status: false,
//           harmful: false
//         });
//         //console.log("firsttofetch!"+firstToFetch.length);
//       }
//       else {
//         laterToFetch.push({
//           url: item.url,
//           content: pureBase64,
//           status: false,
//           harmful: false
//         });
//         //console.log("latertofetch!"+laterToFetch.length);
//       }
//       imagesNotInDB.push(
//         {
//           url: item.url,
//           domain: (new URL(item.url)).hostname.replace(/^www\./, ''),//수정예정,
//           response: false,
//           status: false,   // 검사완료
//           harmful: false,   // 기본값
//         }
//       );
//       keySet.add(item.url); // 중복 방지
//     }
//     else {

//       const DBimgvalue = await reqTablePromise(store.get(item.url)).then(result => {
//         console.log("table에서 key 조회하고 value 가져오기 성공(새로 감지된 이미지를 db 조회 중에)");
//         return result;
//       }).catch(error => {
//         console.error("table에서 key 조회하고 value 가져오는 중에 Error 발생(새로 감지된 이미지를 db 조회 중에):", error.message);
//       });
//       if (!DBimgvalue.response) {
//         if (currentTab == item.tabId) {
//           firstToFetch.push({
//             url: item.url,
//             content: pureBase64,
//             status: false,
//             harmful: false
//           });
//           //console.log("firsttofetch!"+firstToFetch.length);
//         }
//         else {
//           laterToFetch.push({
//             url: item.url,
//             content: pureBase64,
//             status: false,
//             harmful: false
//           });
//           //console.log("latertofetch!"+laterToFetch.length);
//         }
//       }
//     }
//     //있으나, response가 true가 아니라면 재요청(서버로부터 요청을 보냈지만 응답을 받기 전에 비정상적인 종료가 되었다고 가정);
//   }

//   const tx = DB.transaction('imgURL', 'readwrite');
//   const store = tx.objectStore('imgURL');


//   imagesNotInDB.forEach(imgData => {
//     store.put(imgData);     // DB에 저장
//   });
//   await tx.done?.(); // 일부 브라우저에선 필요 없음

//   firstToFetch.unshift(...laterToFetch);
//   console.log("DB add:전체/중복/추가 - " + batch.length + "/" + (batch.length - firstToFetch.length) + "/" + firstToFetch.length);
//   //console.log("fetchdata:"+firstToFetch.length);
//   return firstToFetch;
// }






async function checkCsData(tabId, frameId, batch) {
  
  try {
    await PromiseForInit; //db init 프로미스 기다림. 
  } catch (e) {
    console.error(e);
    return;
  }

  const tx = DB.transaction('imgURL', 'readwrite');
  const store = tx.objectStore('imgURL');


  const CsBatchForDBAdd = [];

  let csBatchForResponse = await Promise.all(

    batch.map(async (item) => {
      try {

        if (keySet.has(item.url)) {


          const value = await reqTablePromise(store.get(item.url)).then(result => {
            console.log("table에서 key 조회하고 value 가져오기 성공");
            return result;
          }).catch(error => {
            console.error("table에서 key 조회하고 value 가져오는 중에 Error 발생:", error.message);
          });

          if (!value.response) {
            console.log("데이터 베이스에 있지만 응답을 받지 못한  img id: " + item.id);
            if (retryThreshold < (Date.now() - value.saveTime)) {
              CsBatchForDBAdd.push(item); //너무 오랫동안 응답을 대기하고 있는 데이터였다면, 재요청 배치에 추가
              value.saveTime = Date.now();
              await reqTablePromise(store.put(value));
            } 
            item.tabId = tabId;
            item.frameId = frameId;
            CsBatchForWaiting.set(item.url, item);
          }
          else {
            console.log("데이터 베이스에 있는 img id: " + item.id + "상태/유해/응답: " + value.status + "&" + value.harmful + "&" + value.response);
            if (value.status) {
              item.status = true;
              if (value.harmful) {
                item.harmful = true;
              }
            }
            return item;
          }
        }
        else {

          console.log("데이터 베이스에 없는 img id: " + item.id);
          const cachCheck = await caches.match(item.url);

          if (cachCheck) {
            console.log("cach 확인 결과, 일치하는 url있음");
            //현재 이 부분이 제대로 동작하는지, 유효성이 있는지 잘 모르겠음. 
            //만약에 cach가 존재한다면 db에 해당 이미지 데이터 추가, 그리고 
            //csBatchForResponse에도 추가
          }
          else {

            keySet.add(item.url);
            //데이터 없음. DB 추가하고 fetch


            item.tabId = tabId;
            item.frameId = frameId;
            CsBatchForWaiting.set(item.url, item); //fetch할 데이터도 결국 response = false인 데이터와 함께 csbatchforwaiting에서 기다림

            CsBatchForDBAdd.push(item);
          }

        }
      } catch (e) {
        console.log("이미지 비교중 에러: ", e, "\nURL: ", item.url);
      }
    }));
   
  if (CsBatchForDBAdd?.length != 0) {

    const tx = DB.transaction('imgURL', 'readwrite');
    const store = tx.objectStore('imgURL');

    CsBatchForDBAdd.forEach(imgdata => {
      store.put(
        {
          url: imgdata.url,
          domain: (new URL(imgdata.url)).hostname.replace(/^www\./, ''),//수정예정,
          response: false,
          status: false,   // 검사완료
          harmful: false,   // 기본값
          saveTime: Date.now()
        }
      );
    });

    fetchBatch(CsBatchForDBAdd, tabId);
    //db 추가했으니 fetch.
  }

  await tx.done?.();

  const delay = await new Promise(resolve => setTimeout(resolve, 200));

  csBatchForResponse = csBatchForResponse.filter(x => x !== undefined);
  console.log('Receiving  request:', batch);
  console.log('Sending response:', csBatchForResponse);
  return csBatchForResponse; //받은 배치 중에서 바로 응답할 이미지 객체만 넣어서 return
}






async function updateDB(responseData) {
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


async function sendWaitingCsDataToCs(readyData) {
  let sendData;
  let sendDataOne;
  const result = [];
  for (const tabId of readyData.keys()) {
    sendData = readyData.get(tabId);
    for (const frameId of sendData.keys()) {
      sendDataOne = sendData.get(frameId);

      try {
        result.push(await chrome.tabs.sendMessage(tabId,
          { type: "imgDataWaitingFromServiceWork", data: sendDataOne },
          { frameId }
        ));
      } catch (e) {
        console.error("contentscript 응답 오류[type: wating data]: ", e);//Receiving end does not exist → 잠시 후 재시도
      }

    }
  }
  console.log("contentscript 응답 결과[type: wating data]");
  result.forEach(res => { console.log(res); });
  console.log("총 수량: ", result.length);

}

async function checkTimeAndRefetch() {
  const tx = DB.transaction('imgURL', 'readwrite');
  const store = tx.objectStore('imgURL');

  const reFetchData = new Map();

  for (const [url, imgData] of CsBatchForWaiting) {
    let dbValue = await reqTablePromise(store.get(url)).then(result => {
      console.log("table에서 key 조회하고 value 가져오기 성공");
      return result;
    }).catch(error => {
      console.error("table에서 key 조회하고 value 가져오는 중에 Error 발생:", error);
    });
    if (retryThreshold < (Date.now() - dbValue.saveTime)) {
      if(!reFetchData.get(imgData.tabId)){
        reFetchData.set(imgData.tabId, [imgData]);  
      }
      else{
        reFetchData.get(imgData.tabId).push(imgData);
      }

      dbValue.saveTime = Date.now();
      await reqTablePromise(store.put(dbValue));
    }
  }

  for(const [tabId, imgDataArr] of reFetchData){
    fetchBatch(imgDataArr, tabId);
  }
  await tx.done?.();

}


  /////실험 함수
  // Blob을 Base64 문자열로 변환하는 헬퍼 함수
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob); // Blob을 읽어 Base64 데이터 URI로 변환 시작
      reader.onloadend = () => {
        resolve(reader.result); // 변환 완료 시 Base64 문자열 반환
      };
      reader.onerror = (error) => {
        reject(error); // 에러 발생 시 거부
      };
    });
  }


  /////
  async function fetchAndReturnBase64Img(url, refererUrl) {
    return new Promise(async (resolve, reject) => {
      try {

        const res = await fetch(url, {
          headers: {
            'Referer': refererUrl
          }
        });
        const resBlob = await res.blob();
        const Base64 = await blobToBase64(resBlob).then(resNotFilterd => { return resNotFilterd.split(',')[1]; });
        return resolve(Base64);

      } catch (error) {

        return reject(error);
      };

    });
  }


  async function propagateResBodyData(responseData) {

    updateDB(responseData);

    const readyToSend = new Map(); // tabid : [imgData, ....]
    for (const [url, imgData] of CsBatchForWaiting) {
      if (responseData.has(url)) {
        const imgResData = responseData.get(url);
        let frames;
        imgData.status = imgResData.status;
        imgData.harmful = imgResData.harmful;
        if (!readyToSend.get(imgData.tabId)) {
          frames = new Map();
          frames.set(imgData.frameId, [imgData]);
          readyToSend.set(imgData.tabId, frames);

        }
        else {
          frames = readyToSend.get(imgData.tabId);
          if (!frames.get(imgData.frameId)) frames.set(imgData.frameId, [imgData]);
          else frames.get(imgData.frameId).push(imgData);
        }

        CsBatchForWaiting.delete(url);
      }
    }
    sendWaitingCsDataToCs(readyToSend);//.then(res => { console.log("response status(WaitingCsData Sended): ", res); })contentscript와 runtimemessage 교신
    //checkTimeAndRefetch();
    console.log("현재 기다리고 있는 content: " + CsBatchForWaiting.size);
  }


  // async function DBFlushByIDLE() {
  //   await flushBatch();
  //   if (mustFlush) {
  //     await fetchBatch();
  //   };
  // }

  // async function maybeFetch() {
  //   console.log("maybefetch! |  현재 fetch 예정 data 수: " + batchForFetch.length);
  //   if (batchForFetch.length >= BATCH_LIMIT_FOR_FETCH) {
  //     await fetchBatch();
  //   }
  //   else {
  //     await fetchPromise;
  //   }
  //   console.log("프로미스 기다림 종료");
  //   clearTimeout(idleTForFetch);
  //   idleTForFetch = setTimeout(fetchBatch, IDLEFORFETCH);
  // }

  // {
  //   url: item.url,
  //     content: pureBase64,
  //       status: false,
  //         harmful: false
  // }

  async function fetchBatch(CsImgData, tabId) {

    console.log("fetchdata:" + CsImgData.length);

    let CsImgDataForFetch = null;
    try {
      const tab = await chrome.tabs.get(tabId);
      const refererUrl = tab.url;

      CsImgDataForFetch = await Promise.all(
        CsImgData.map(async imgdata => {
          const content = await fetchAndReturnBase64Img(imgdata.url, refererUrl);
          return {
            url: imgdata.url,
            content: content,
            status: imgdata.status,
            harmful: imgdata.harmful
          };
        })
      );

    } catch (err) {
      console.error("이미지 실제 데이터 fetch 과정 중 에러 발생: ", err);
    }

    const bodyData = JSON.stringify({ data: CsImgDataForFetch });

    try {

      const start = performance.now();
      console.log("fetch!: ", CsImgDataForFetch.length);
      const res = await fetch("https://image-interceptor-test-683857194699.asia-northeast3.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyData
      });
      if (!res.ok) throw new Error("서버 응답 오류");// catch로 이동
      console.log(`response delaytime: ${(performance.now() - start) / 1000}`);

      const responseBodyData = await res.json()?.then(result => { return result?.data?.images });
      if (responseBodyData.length > 0) {
        propagateResBodyData(new Map(responseBodyData.map((el) => {
          return [el.url, { url: el.url, response: true, status: el.status, harmful: el.harmful }];
        })));
      } else console.log("cause - fetch response: bodydata 없음");
    } catch (err) {
      console.error(
        err instanceof SyntaxError
          ? `JSON parsing failed: ${err.message}`
          : `Request failed: ${err.message}`
      );
    }
  }


  /*
  REQUEST DATA
  [
    {
      canonicalUrl: item.canonicalUrl,
        url: item.url,
          status: false,
            harmful: false
    }
  ]
  RESPONSE DATA example
  {
      "data": [
          {
              "canonicalUrl": "https://www.google.com/pagead/1p-user-list/962985656/?backend=innertube&cname=1&cver=2_20250807&data=backend%3Dinnertube%3Bcname%3D1%3Bcver%3D2_20250807%3Bel%3Dadunit%3Bptype%3Df_adview%3Btype%3Dview%3Butuid%3Dtdz9LWNNQKUg4Xpma_40Ug%3Butvid%3D4ByJ0z3UMNE&is_vtc=0&ptype=f_adview&random=428766496&utuid=tdz9LWNNQKUg4Xpma_40Ug",
              "url": "https://www.google.com/pagead/1p-user-list/962985656/?backend=innertube&cname=1&cver=2_20250807&data=backend%3Dinnertube%3Bcname%3D1%3Bcver%3D2_20250807%3Bel%3Dadunit%3Bptype%3Df_adview%3Btype%3Dview%3Butuid%3Dtdz9LWNNQKUg4Xpma_40Ug%3Butvid%3D4ByJ0z3UMNE&is_vtc=0&ptype=f_adview&random=428766496&utuid=tdz9LWNNQKUg4Xpma_40Ug",
              "status": true,
              "harmful": false,
              "category": "medical",
              "score": 0.4,
              "details": {
                  "adult": 1,
                  "spoof": 1,
                  "medical": 2,
                  "violence": 2,
                  "racy": 2
              },
              "processed": true,
              "error": false,
              "error_message": null,
              "error_type": null
          }
      ],
      "summary": {
          "total": 1,
          "processed": 1,
          "harmful": 0,
          "safe": 1,
          "errors": 0,
          "error_types": {}
      },
      "message": "총 1개 이미지 중 1개 처리 완료 (배치 API 호출: 1회로 1개 이미지 동시 처리)"
  }
  */


  chrome.tabs.onActivated.addListener(({ tabId }) => {
    currentTab = tabId;
  });





  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "imgDataFromContentScript") {
    
      checkCsData(sender?.tab?.id, sender?.frameId, message.data).then(batchFromScript => {
        sendResponse({
          type: "response",
          data: batchFromScript,
        });
      });
      return true;
    }
  });
