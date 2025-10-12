/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/global/backgroundConfig.js":
/*!*******************************************!*\
  !*** ./src/js/global/backgroundConfig.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CsBatchForWaiting: () => (/* binding */ CsBatchForWaiting),
/* harmony export */   getCurrentFilteringStepValue: () => (/* binding */ getCurrentFilteringStepValue),
/* harmony export */   setCurrentFilteringStepValue: () => (/* binding */ setCurrentFilteringStepValue)
/* harmony export */ });

//input data => [siteurl, imgurl] :{imgMetaData}
const CsBatchForWaiting = new Map(); 

//default = 1
let currentFilteringStepValue;

function setCurrentFilteringStepValue(value) {
  currentFilteringStepValue = value;
}

function getCurrentFilteringStepValue() {
  return currentFilteringStepValue;
}

/***/ }),

/***/ "./src/js/modules/indexDb.js":
/*!***********************************!*\
  !*** ./src/js/modules/indexDb.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DB: () => (/* binding */ DB),
/* harmony export */   deleteImageUrlDB: () => (/* binding */ deleteImageUrlDB),
/* harmony export */   getAllKeysPromise: () => (/* binding */ getAllKeysPromise),
/* harmony export */   initIndexDb: () => (/* binding */ initIndexDb),
/* harmony export */   keySet: () => (/* binding */ keySet),
/* harmony export */   keySetLoaded: () => (/* binding */ keySetLoaded),
/* harmony export */   loadKeySet: () => (/* binding */ loadKeySet),
/* harmony export */   openImageUrlDB: () => (/* binding */ openImageUrlDB),
/* harmony export */   reqTablePromise: () => (/* binding */ reqTablePromise),
/* harmony export */   updateDB: () => (/* binding */ updateDB)
/* harmony export */ });
let DB = null;
let keySet = null;
let keySetLoaded = false;



async function initIndexDb() {
    try {
        await deleteImageUrlDB();//나중에 삭제해야 함. 서비스 워커 초기화하면 무조건 기존 db 삭제
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

function deleteImageUrlDB() {
    return new Promise((resolve, reject) => {
        // IndexedDB의 deleteDatabase 메서드를 사용하여 데이터베이스를 삭제합니다.
        const request = indexedDB.deleteDatabase('imageUrlDB');

        // 삭제 성공 시 호출되는 이벤트 핸들러
        request.onsuccess = () => {
            console.log('데이터베이스가 성공적으로 삭제되었습니다.');
            resolve();
        };

        // 삭제 실패 시 호출되는 이벤트 핸들러
        request.onerror = (event) => {
            reject('데이터베이스 삭제 오류:', event.target.error);
        };

        // 데이터베이스가 다른 탭에서 열려 있어 삭제가 차단될 때 호출되는 이벤트 핸들러
        request.onblocked = () => {
            console.warn('데이터베이스가 다른 연결에 의해 차단되었습니다.');
            reject('데이터베이스가 다른 연결에 의해 차단되었습니다.');
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



async function updateDB(responseData) {
    const tx = DB.transaction('imgURL', 'readwrite');
    const store = tx.objectStore('imgURL');

    for (const [url, imgResData] of responseData) {
        let dbValue = await reqTablePromise(store.get(url)).then(result => {
            
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


/***/ }),

/***/ "./src/js/modules/requestImgAnalyze.js":
/*!*********************************************!*\
  !*** ./src/js/modules/requestImgAnalyze.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   checkTimeAndRefetch: () => (/* binding */ checkTimeAndRefetch),
/* harmony export */   fetchBatch: () => (/* binding */ fetchBatch)
/* harmony export */ });
/* harmony import */ var _utils_propagate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/propagate.js */ "./src/js/utils/propagate.js");
/* harmony import */ var _indexDb_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./indexDb.js */ "./src/js/modules/indexDb.js");
/* harmony import */ var _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../global/backgroundConfig.js */ "./src/js/global/backgroundConfig.js");




const retryThreshold = 15 * 1000;

// export async function fetchBatch(CsImgData, tabId) {

//   console.log("fetchdata:" + CsImgData.length);

//   let CsImgDataForFetch = null;
//   try {
//     const tab = await chrome.tabs.get(tabId);
//     const refererUrl = tab.url;

//     CsImgDataForFetch = await Promise.all(
//       CsImgData.map(async imgdata => {
//         const content = await fetchAndReturnBase64Img(imgdata.url, refererUrl);
//         return {
//           url: imgdata.url,
//           content: content,
//           status: imgdata.status,
//           harmful: imgdata.harmful
//         };
//       })
//     );

//   } catch (err) {
//     console.error("이미지 실제 데이터 fetch 과정 중 에러 발생: ", err);
//   }

//   const bodyData = JSON.stringify({ data: CsImgDataForFetch });

//   try {

//     const start = performance.now();
//     console.log("fetch!: ", CsImgDataForFetch.length);
//     const res = await fetch("https://image-interceptor-test-683857194699.asia-northeast3.run.app", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: bodyData
//     });

//     if (!res.ok) throw new Error("서버 응답 오류");// catch로 이동
//     console.log(`response delaytime: ${(performance.now() - start) / 1000}`);

//     const responseBodyData = await res.json()?.then(result => { return result?.data?.images });
//     if (responseBodyData.length > 0) {
//       propagateResBodyData(new Map(responseBodyData.map((el) => {
//         return [el.url, { url: el.url, response: true, status: el.status, harmful: el.harmful }];
//       })));
//     } else console.log("cause - fetch response: bodydata 없음");
//   } catch (err) {
//     console.error(
//       err instanceof SyntaxError
//         ? `JSON parsing failed: ${err.message}`
//         : `Request failed: ${err.message}`
//     );
//   }
// }


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
    }// removed by dead control flow


  });
}

async function fetchAndReturnBlobImg(url, refererUrl) {
  return new Promise(async (resolve, reject) => {
    try {

      const res = await fetch(url, {
        headers: {
          'Referer': refererUrl
        }
      });
      const resBlob = await res.blob();
      return resolve(resBlob);

    } catch (error) {

      return reject(error);
    }// removed by dead control flow


  });
}



async function checkTimeAndRefetch() {
  const reFetchData = new Map();

  const tx = _indexDb_js__WEBPACK_IMPORTED_MODULE_1__.DB.transaction('imgURL', 'readwrite');
  const store = tx.objectStore('imgURL');

  for (const [url, imgData] of _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.CsBatchForWaiting) {
    
    let dbValue = await (0,_indexDb_js__WEBPACK_IMPORTED_MODULE_1__.reqTablePromise)(store.get(url[1])).then(result => {
      return result;
    }).catch(error => {
      console.error("table에서 key 조회하고 value 가져오는 중에 Error 발생:", error);
    });
    if (retryThreshold < (Date.now() - dbValue.saveTime)) {
      if (!reFetchData.get(imgData.tabId)) {
        reFetchData.set(imgData.tabId, [imgData]);
      }
      else {
        reFetchData.get(imgData.tabId).push(imgData);
      }

      dbValue.saveTime = Date.now();
      await (0,_indexDb_js__WEBPACK_IMPORTED_MODULE_1__.reqTablePromise)(store.put(dbValue));
    }
  }

  for (const [tabId, imgDataArr] of reFetchData) {
    console.log("resending data:" + reFetchData.size);
    fetchBatch(imgDataArr, tabId);
  }
  await tx.done?.();

}

//createImageBitmap으로 지원 안하는 이미지: svg
//image 객체를 생성해서 우회적으로 해결해야 함. 그러나 비유해 이미지 필터에서 해당 유형의 이미지를 미리 걸러낼 예정이기 때문에 현재 수정 안한 상태
async function resizeAndSendBlob(blob, width, height) {
    // Blob을 ImageBitmap으로 변환
    const imageBitmap = await createImageBitmap(blob);

    // OffscreenCanvas 생성
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d');

    // 캔버스에 그리기
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Blob으로 변환
    const resizedBlob = await offscreen.convertToBlob({
        type: 'image/webP',
        quality: 0.95
    });

    return resizedBlob;
  }


async function fetchBatch(CsImgData, tabId) {

  //let CsImgDataForFetch = null;
  let formData = new FormData();
  let tabUrl;
  try {
    const tab = await chrome.tabs.get(tabId);
    tabUrl = tab.url;

    // CsImgDataForFetch = await Promise.all(
    //   CsImgData.map(async imgdata => {
    //     const content = await fetchAndReturnBase64Img(imgdata.url, refererUrl);
    //     return {
    //       url: imgdata.url,
    //       content: content,
    //       status: imgdata.status,
    //       harmful: imgdata.harmful
    //     };
    //   })
    // );
    await Promise.all(
      CsImgData.map(async imgdata => {
        const imgBlob = await fetchAndReturnBlobImg(imgdata.url, tabUrl);
        let resizedImgBlob;

        try{
          resizedImgBlob = await resizeAndSendBlob(imgBlob, 224, 224);
        }
        catch(err){
          throw new Error("| resize과정에서 오류 발생 "+ err);
        }
        const imgMetaJson = JSON.stringify(
          {
            url: imgdata.url,
            status: imgdata.status,
            harmful: imgdata.harmful,
            level: (0,_global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.getCurrentFilteringStepValue)()
          }
        );
        formData.append('images', resizedImgBlob);
        formData.append('imgMeta', imgMetaJson);
      })
    );

  } catch (err) {
    console.error("body data 처리 및 준비 과정 중 에러 발생:", err);
  }

  //const bodyData = JSON.stringify({ data: CsImgDataForFetch });

  try {

    const start = performance.now();
    console.log(`<--fetch!-->\n total: ${CsImgData.length}\nlevel:${(0,_global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.getCurrentFilteringStepValue)() }`);
    let res;
    if (tabUrl.includes("youtube.com") ){
      res = await fetch("https://image-interceptor-youtube-683857194699.asia-northeast3.run.app", {
        method: "POST",
        body: formData
      });
    }
    else {
      res = await fetch("https://image-interceptor-gpu-683857194699.asia-southeast1.run.app", {
        method: "POST",
        body: formData
      });

    }
    if (!res.ok) throw new Error("서버 응답 오류");// catch로 이동
    console.log(`response delaytime: ${(performance.now() - start) / 1000}`);

    const responseBodyData = await res.json()?.then(result => { return result?.image });
    if (responseBodyData.length > 0) {

      const processedResBodyData = new Map(responseBodyData.map((el) => {
        return [el.url, { url: el.url, response: true, status: el.status, harmful: el.harmful }];
      }));

      (0,_utils_propagate_js__WEBPACK_IMPORTED_MODULE_0__.propagateResBodyData)(processedResBodyData);

    } else throw new Error("cause - fetch response: bodydata 없음");
  } catch (err) {
    console.error(
      err instanceof SyntaxError
        ? `JSON parsing failed: ${err.message}`
        : `Request failed: ${err.message}`
    );
  }
}

// REQUEST DATA
// [
//   {
//     canonicalUrl: item.canonicalUrl,
//       url: item.url,
//         status: false,
//           harmful: false
//   }
// ]
// RESPONSE DATA example
// {
//     "data": [
//         {
//             "canonicalUrl": "https://www.google.com/pagead/1p-user-list/962985656/?backend=innertube&cname=1&cver=2_20250807&data=backend%3Dinnertube%3Bcname%3D1%3Bcver%3D2_20250807%3Bel%3Dadunit%3Bptype%3Df_adview%3Btype%3Dview%3Butuid%3Dtdz9LWNNQKUg4Xpma_40Ug%3Butvid%3D4ByJ0z3UMNE&is_vtc=0&ptype=f_adview&random=428766496&utuid=tdz9LWNNQKUg4Xpma_40Ug",
//             "url": "https://www.google.com/pagead/1p-user-list/962985656/?backend=innertube&cname=1&cver=2_20250807&data=backend%3Dinnertube%3Bcname%3D1%3Bcver%3D2_20250807%3Bel%3Dadunit%3Bptype%3Df_adview%3Btype%3Dview%3Butuid%3Dtdz9LWNNQKUg4Xpma_40Ug%3Butvid%3D4ByJ0z3UMNE&is_vtc=0&ptype=f_adview&random=428766496&utuid=tdz9LWNNQKUg4Xpma_40Ug",
//             "status": true,
//             "harmful": false,
//             "category": "medical",
//             "score": 0.4,
//             "details": {
//                 "adult": 1,
//                 "spoof": 1,
//                 "medical": 2,
//                 "violence": 2,
//                 "racy": 2
//             },
//             "processed": true,
//             "error": false,
//             "error_message": null,
//             "error_type": null
//         }
//     ],
//     "summary": {
//         "total": 1,
//         "processed": 1,
//         "harmful": 0,
//         "safe": 1,
//         "errors": 0,
//         "error_types": {}
//     },
//     "message": "총 1개 이미지 중 1개 처리 완료 (배치 API 호출: 1회로 1개 이미지 동시 처리)"
// }


/***/ }),

/***/ "./src/js/utils/backgroundUtils.js":
/*!*****************************************!*\
  !*** ./src/js/utils/backgroundUtils.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addTotalNumOfHarmfulImg: () => (/* binding */ addTotalNumOfHarmfulImg),
/* harmony export */   getNumOfHarmfulImgInthispage: () => (/* binding */ getNumOfHarmfulImgInthispage),
/* harmony export */   initNumOfHarmfulImgInStorageSession: () => (/* binding */ initNumOfHarmfulImgInStorageSession),
/* harmony export */   setNumOfHarmfulImgInStorageSession: () => (/* binding */ setNumOfHarmfulImgInStorageSession)
/* harmony export */ });


async function setNumOfHarmfulImgInStorageSession(url, numOfHarmfulImg) {
  const storedData = await chrome.storage.session.get(['numOfHarmfulImgInPage']);
  let numOfHarmfulImgInPage = storedData.numOfHarmfulImgInPage || {};

  console.log(numOfHarmfulImgInPage);

  if (url in numOfHarmfulImgInPage) {
    numOfHarmfulImgInPage[url] += numOfHarmfulImg;
  } else {
    numOfHarmfulImgInPage[url] = numOfHarmfulImg;
  }

  await chrome.storage.session.set({ 'numOfHarmfulImgInPage': numOfHarmfulImgInPage });
}

async function initNumOfHarmfulImgInStorageSession(url) {
    const storedData = await chrome.storage.session.get(['numOfHarmfulImgInPage']);

     let numOfHarmfulImgInPage = storedData.numOfHarmfulImgInPage || {};
     numOfHarmfulImgInPage[url] = 0;

      chrome.storage.session.set({ 'numOfHarmfulImgInPage': numOfHarmfulImgInPage });
}

async function getNumOfHarmfulImgInthispage(url) {
    const storedData = await chrome.storage.session.get(['numOfHarmfulImgInPage']);
    let numOfHarmfulImgInPage = storedData.numOfHarmfulImgInPage || {};

    return numOfHarmfulImgInPage[url] ? numOfHarmfulImgInPage[url] : 0;
}

async function addTotalNumOfHarmfulImg(num) {

    const totalNumOfHarmfulImg = await chrome.storage.local.get(['totalNumOfHarmfulImg']).then(result => result.totalNumOfHarmfulImg);
    chrome.storage.local.set({'totalNumOfHarmfulImg':(totalNumOfHarmfulImg+ num)});
}



/***/ }),

/***/ "./src/js/utils/propagate.js":
/*!***********************************!*\
  !*** ./src/js/utils/propagate.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   propagateResBodyData: () => (/* binding */ propagateResBodyData)
/* harmony export */ });
/* harmony import */ var _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../modules/indexDb.js */ "./src/js/modules/indexDb.js");
/* harmony import */ var _modules_requestImgAnalyze_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../modules/requestImgAnalyze.js */ "./src/js/modules/requestImgAnalyze.js");
/* harmony import */ var _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../global/backgroundConfig.js */ "./src/js/global/backgroundConfig.js");
/* harmony import */ var _utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/backgroundUtils.js */ "./src/js/utils/backgroundUtils.js");






async function propagateResBodyData(responseData) {
    const readyToSend = new Map(); // tabid : [imgData, ....]
    const numOfHarmfulImgInPageMap = new Map();
    let totalNumOfHarmfulWaitingImg = 0;
    (0,_modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.updateDB)(responseData);

    for (const [url, imgData] of _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.CsBatchForWaiting) {
        if (responseData.has(url[1])) {
            const imgResData = responseData.get(url[1]);
            let frames;
            imgData.status = imgResData.status;
            imgData.harmful = imgResData.harmful;

            if (imgResData.harmful) {
                if(!numOfHarmfulImgInPageMap.has(url[0])){
                    numOfHarmfulImgInPageMap.set(url[0],0);
                }
                else {
                     numOfHarmfulImgInPageMap.set(url[0], numOfHarmfulImgInPageMap.get(url[0])+1);
                }
            }

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

            _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.CsBatchForWaiting.delete(url);
        }
    }
    sendWaitingCsDataToCs(readyToSend);//.then(res => { console.log("response status(WaitingCsData Sended): ", res); })contentscript와 runtimemessage 교신
    (0,_modules_requestImgAnalyze_js__WEBPACK_IMPORTED_MODULE_1__.checkTimeAndRefetch)();
    
    for(const [pageUrl, count] of numOfHarmfulImgInPageMap) {
        //console.log("pageCountInfo\n"+pageUrl+'\n'+count);
        await (0,_utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_3__.setNumOfHarmfulImgInStorageSession)(pageUrl,count);//mutual exclusion로 인한 await. 나중에 공유 promise를 생성해서 서비스워커에서 기다리는 일이 없게 만들 수도 있음
        totalNumOfHarmfulWaitingImg+= count;
    }
   (0,_utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_3__.addTotalNumOfHarmfulImg)(totalNumOfHarmfulWaitingImg);

    console.log("현재 기다리고 있는 content: " + _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.CsBatchForWaiting.size);
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
                if (!e.message.includes('Could not establish connection')) console.error("contentscript 응답 오류[type: wating data]: ", e);//Receiving end does not exist → 잠시 후 재시도
            }

        }
    }
    console.log("contentscript 응답 결과[type: wating data]");
    result.forEach(res => { console.log(res); });
    console.log("총 수량: ", result.length);

  }



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!******************************!*\
  !*** ./src/js/background.js ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./modules/indexDb.js */ "./src/js/modules/indexDb.js");
/* harmony import */ var _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./global/backgroundConfig.js */ "./src/js/global/backgroundConfig.js");
/* harmony import */ var _modules_requestImgAnalyze_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./modules/requestImgAnalyze.js */ "./src/js/modules/requestImgAnalyze.js");
/* harmony import */ var _utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/backgroundUtils.js */ "./src/js/utils/backgroundUtils.js");






const currentTabs = new Map();
const controlMenuImgStatusList = new Map();
const retryThreshold = 15 * 1000;



const contextControlMenu = {
  'ImgShow': '이미지 보이기',
  'ImgHide': '이미지 감추기',
}

let clickedImgSrc = null;
let isInterceptorActive = true;
let storedInterceptorStatus = null;
//
let totalimg = 0;
let interceptorSite = null;
let totalNumOfHarmfulImg;



//초기화 코드
//비동기 준비 작업이 완료되어야 다음 코드를 실행할 수 있는 프로마이스 객체(resolved가 반환되어야 함). 함수 자체는 바로 실행
let PromiseForInit = _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.initIndexDb();

function getPageUrlFromTabId(tabId) {
  return new Promise((resolve,reject) => {
    chrome.tabs.get(tabId, (tab) => {
       if (chrome.runtime.lastError) reject(chrome.runtime.lastError.message);
       else resolve(tab.url);
    });
  })
}


async function checkCsData(tabId, frameId, batch) {
  
  try {
    await PromiseForInit; //db init 프로미스 기다림. 
  } catch (e) {
    console.error(e);
    return;
  }

  const pageUrl = await getPageUrlFromTabId(tabId).then(pageUrl=>pageUrl).catch(err=>{console.error(err);});  
  
  const CsBatchForDBAdd = [];
  
  let numOfHarmfulImg = 0;
  
  let csBatchForResponse = await Promise.all(
    
    batch.map(async (item) => {
      const tx = _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.DB.transaction('imgURL', 'readwrite');
      const store = tx.objectStore('imgURL');
      try {

        if (_modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.keySet.has(item.url)) {
          

          const value = await _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.reqTablePromise(store.get(item.url)).then(result => {
           
            return result;
          }).catch(error => {
            console.error("table에서 key 조회하고 value 가져오는 중에 Error 발생:", error.message);
          });

          if (!value.response) {
            console.log("데이터 베이스에 있지만 응답을 받지 못한  img id: " + item.id);
            if (retryThreshold < (Date.now() - value.saveTime)) {
              CsBatchForDBAdd.push(item); //너무 오랫동안 응답을 대기하고 있는 데이터였다면, 재요청 배치에 추가
              value.saveTime = Date.now();
              await _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.reqTablePromise(store.put(value));
            }
            item.tabId = tabId;
            item.frameId = frameId;
            _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_1__.CsBatchForWaiting.set([pageUrl,item.url], item);
          }
          else {
            console.log("데이터 베이스에 있는 img id: " + item.id + "상태/유해/응답: " + value.status + "&" + value.harmful + "&" + value.response);
            if (value.status) {
              item.status = true;
              if (value.harmful) {
                numOfHarmfulImg++;
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

            _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.keySet.add(item.url);
            //데이터 없음. DB 추가하고 fetch


            item.tabId = tabId;
            item.frameId = frameId;
            _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_1__.CsBatchForWaiting.set([pageUrl,item.url], item); //fetch할 데이터도 결국 response = false인 데이터와 함께 csbatchforwaiting에서 기다림

            CsBatchForDBAdd.push(item);
          }

        }
      } catch (e) {
        console.log("이미지 비교중 에러: ", e, "\nURL: ", item.url);
      }
    }));

  if (CsBatchForDBAdd?.length != 0) {

    const tx = _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.DB.transaction('imgURL', 'readwrite');
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

    (0,_modules_requestImgAnalyze_js__WEBPACK_IMPORTED_MODULE_2__.fetchBatch)(CsBatchForDBAdd, tabId);
    //db 추가했으니 fetch.
  }

  //console.log("pageCountInfo\n"+pageUrl+'\n'+numOfHarmfulImg);
  (0,_utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_3__.setNumOfHarmfulImgInStorageSession)(pageUrl, numOfHarmfulImg);


  //const delay = await new Promise(resolve => setTimeout(resolve, 200));

  csBatchForResponse = csBatchForResponse.filter(x => x !== undefined);
  console.log('Receiving  request:', batch);
  console.log('Sending response:', csBatchForResponse);
  return csBatchForResponse; //받은 배치 중에서 바로 응답할 이미지 객체만 넣어서 return
}



//////////////////////////////////event lister///////////////////////////////
//콘텐츠 스크립트 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === "content") {

    try {
      switch (message?.type) {

        case "imgDataFromContentScript":
          checkCsData(sender?.tab?.id, sender?.frameId, message.data).then(batchFromScript => {
            sendResponse({
              type: "response",
              data: batchFromScript,
            });
          });
          return true;

        case "register_frame":
          if (!currentTabs.get(sender?.tab?.id)) {
            currentTabs.set(sender?.tab?.id, [sender?.frameId]);
          }
          else {
            if (!currentTabs.get(sender?.tab?.id).includes(sender?.frameId)) {
              currentTabs.get(sender?.tab?.id).push(sender?.frameId);
            }
          }

          getPageUrlFromTabId(sender?.tab?.id).then(pageUrl=>{
            console.log(pageUrl);
            (0,_utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_3__.initNumOfHarmfulImgInStorageSession)(pageUrl);
          }).catch(err=>{console.error(err);});

          sendResponse({ ok: true });
          break;

        case "imageClicked":
          if (message.imgSrc) {
            (async () => {
              chrome.contextMenus.removeAll(() => {

                chrome.contextMenus.create({
                  id: 'mainControlMenu',
                  title: 'ImageInterceptor - 유해 이미지 차단 프로그램',
                  contexts: ['all']
                });

                for (const [menuId, menuTitle] of Object.entries(contextControlMenu)) {
                  chrome.contextMenus.create({
                    id: menuId,
                    parentId: 'mainControlMenu',
                    title: menuTitle,
                    type: 'radio',
                    contexts: ['all']
                  });
                }
                if (!controlMenuImgStatusList.has(message.imgSrc)) {
                  controlMenuImgStatusList.set(message.imgSrc, message.isShow === true ? 'ImgShow' : 'ImgHide');
                  chrome.contextMenus.update(message.isShow === true ? 'ImgShow' : 'ImgHide', { checked: true });
                  console.log("new img");
                }
                else {
                  const anotherItemStatus = controlMenuImgStatusList.get(message.imgSrc) === 'ImgShow' ? 'ImgHide' : 'ImgShow';
                  chrome.contextMenus.update(controlMenuImgStatusList.get(message.imgSrc) === 'ImgShow' ? 'ImgShow' : 'ImgHide', { checked: true });

                  console.log("img 존재: " + message.imgSrc);
                }

                clickedImgSrc = message.imgSrc;


              });
            })();
            return true;

          }

        case "check_black_list":
          let isInBlackList = false;
          try {
            if (interceptorSite.has(message.site)) {
              const targetSite = interceptorSite.get(message.site);
              if (!targetSite["active"]) {
                console.log("허용되지 않은 사이트");
                isInBlackList = true;
              }
              else {
                if (targetSite["page"].includes(message.path)) {
                  console.log("허용되지 않은 페이지");
                  isInBlackList = true;
                }
              }
            }
            sendResponse({
              ok: true,
              result: isInBlackList
            });
          }
          catch (e) {
            sendResponse({
              ok: false,
            });
            throw new Error(e);
          }

      }
    } catch (e) {

    }
  }
});



chrome.runtime.onInstalled.addListener(async () => {

  chrome.contextMenus.create({
    id: 'mainControlMenu',
    title: 'ImageInterceptor - 유해 이미지 차단 프로그램',
    contexts: ['all']
  });

  for (const [menuId, menuTitle] of Object.entries(contextControlMenu)) {
    chrome.contextMenus.create({
      id: menuId,
      parentId: 'mainControlMenu',
      title: menuTitle,
      type: 'radio',
      contexts: ['all']
    });
  }
  storedInterceptorStatus = await chrome.storage.local.get(['interceptorStatus']);
  let savedStatus = storedInterceptorStatus.interceptorStatus;
  if (savedStatus === undefined) {
    chrome.storage.local.set({ 'interceptorStatus': 1 });
    savedStatus = 1;
  }
  isInterceptorActive = savedStatus === 1 ? true : false;
  chrome.contextMenus.update('mainControlMenu', { enabled: isInterceptorActive });


  const storedInterceptorSite = await chrome.storage.local.get(['interceptorSite']);
  if (storedInterceptorSite === undefined || storedInterceptorSite.interceptorSite === undefined) {
    chrome.storage.local.set({ 'interceptorSite': {} });
    interceptorSite = new Map();
  }
  else {
    interceptorSite = new Map(Object.entries(storedInterceptorSite.interceptorSite));
  }  

  chrome.storage.local.get(['totalNumOfHarmfulImg']).then(result => {
    if (!result.totalNumOfHarmfulImg) {
      chrome.storage.local.set({ 'totalNumOfHarmfulImg': 0 });}
  });


  const storedCurrentFilteringStepValue = await chrome.storage.local.get(['filteringStep']).then(result => {
    chrome.storage.local.set({ 'filteringStep': 1 });
    let value = result.filteringStep;
    if (value===undefined) {
      chrome.storage.local.set({ 'filteringStep': 1 });
      value = 1;
    }
    return value;
  });
  (0,_global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_1__.setCurrentFilteringStepValue)(storedCurrentFilteringStepValue);
  return true;
});


chrome.contextMenus.onClicked.addListener((item, tab) => {

  if (clickedImgSrc === null) {
    chrome.contextMenus.update('ImgShow', { checked: true });
    return;
  }

  const controlId = item.menuItemId;
  const imgInfo = { tabId: tab.id, frameId: item.frameId, url: item.srcUrl };

  console.log("컨텍스트 클릭");
  if (controlId === controlMenuImgStatusList.get(clickedImgSrc)) return;


  try {
    //추부 promise추가
    const response = chrome.tabs.sendMessage(imgInfo.tabId, {
      source: "service_worker",
      type: 'control_img',
      isShow: controlId === 'ImgShow' ? true : false
    }, { frameId: imgInfo.frameId });

    if (!response.ok) {
      console.log(response.message);
      //throw new Error(response.message);
    }

    controlMenuImgStatusList.set(clickedImgSrc, controlId);
    clickedImgSrc = null;

  } catch (error) {
    if (!error.message.includes('Could not establish connection')) console.error(error);
    chrome.contextMenus.update('ImgShow', { checked: true });
  }
  return true;

});




async function activeInterceptor(flag) {
  const result = { ok: true, message: [] };

  for (const [tabId, frames] of currentTabs) {
    if (!frames) continue;

    for (const frame of frames) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          source: "service_worker",
          type: 'active_interceptor',
          active: flag
        }, { frameId: frame });
        if (!response.ok) {
          result.ok = false;
        }
        result.message.push(response.message);

      } catch (error) {
        if (!error.message.includes('Could not establish connection')) result.ok = false;
        result.message.push(error.message);
      }
    }
  }

  return result;
}



async function setFilterStatus(flag) {
  const result = { ok: true, message: [] };

  for (const [tabId, frames] of currentTabs) {
    if (!frames) continue;

    for (const frame of frames) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          source: "service_worker",
          type: 'set_filter_status',
          FilterStatus: flag
        }, { frameId: frame });

        if (!response.ok) {
          result.ok = false;
        }
        result.message.push(response.message);

      } catch (error) {
        if (!error.message.includes('Could not establish connection')) result.ok = false;
        result.message.push(error.message);
      }
    }
  }
  return result;
}

//팝업 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === "popup") {
    (async () => {
      try {
        let responseStatus = true;
        switch (message.type) {
          case "active_interceptor":
            responseStatus = await activeInterceptor(message.active);
            if (!responseStatus.ok) console.error(responseStatus.ok);
            isInterceptorActive = message.active;
            chrome.contextMenus.update('mainControlMenu', { enabled: isInterceptorActive ? true : false });
            sendResponse({ ok: responseStatus.ok });
            break;

          case "set_filter_status":
            responseStatus = await setFilterStatus(message.FilterStatus);
            if (!responseStatus.ok) console.error(responseStatus.message);
            sendResponse({ ok: responseStatus.ok });
            break;
          case "popup_error":
            throw new Error("from popup: " + message.error);
          default:
            throw new Error("can not read popup message type");
          case "sync_black_list":
            try{
              interceptorSite.set(message.rootInstance[0], message.rootInstance[1]);
              chrome.storage.local.set({ 'interceptorSite': Object.fromEntries(interceptorSite) });
            } catch(e) {
              throw new Error(e);
            }
            break;
          case "set_filtering_step":
            chrome.storage.local.set({ 'filteringStep': message.value });
            console.log(message.value);
            (0,_global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_1__.setCurrentFilteringStepValue)(message.value);
            break;
        }
      } catch (e) {
        console.error(e);
        sendResponse({ ok: false });
      }
    })();
    return true;
  }
});


})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxnQ0FBZ0M7QUFDdkU7QUFDQSxZQUFZLHlGQUE0QjtBQUN4QztBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0EsdUJBQXVCLFdBQVc7QUFDbEM7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLENBQUM7QUFDRCIsInNvdXJjZXMiOlsid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvZ2xvYmFsL2JhY2tncm91bmRDb25maWcuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9tb2R1bGVzL2luZGV4RGIuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9tb2R1bGVzL3JlcXVlc3RJbWdBbmFseXplLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvdXRpbHMvYmFja2dyb3VuZFV0aWxzLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvdXRpbHMvcHJvcGFnYXRlLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL2JhY2tncm91bmQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXHJcbi8vaW5wdXQgZGF0YSA9PiBbc2l0ZXVybCwgaW1ndXJsXSA6e2ltZ01ldGFEYXRhfVxyXG5leHBvcnQgY29uc3QgQ3NCYXRjaEZvcldhaXRpbmcgPSBuZXcgTWFwKCk7IFxyXG5cclxuLy9kZWZhdWx0ID0gMVxyXG5sZXQgY3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlKHZhbHVlKSB7XHJcbiAgY3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSA9IHZhbHVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSgpIHtcclxuICByZXR1cm4gY3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZTtcclxufSIsImV4cG9ydCBsZXQgREIgPSBudWxsO1xyXG5leHBvcnQgbGV0IGtleVNldCA9IG51bGw7XHJcbmV4cG9ydCBsZXQga2V5U2V0TG9hZGVkID0gZmFsc2U7XHJcblxyXG5cclxuXHJcbmV4cG9ydCAgYXN5bmMgZnVuY3Rpb24gaW5pdEluZGV4RGIoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGRlbGV0ZUltYWdlVXJsREIoKTsvL+uCmOykkeyXkCDsgq3soJztlbTslbwg7ZWoLiDshJzruYTsiqQg7JuM7LukIOy0iOq4sO2ZlO2VmOuptCDrrLTsobDqsbQg6riw7KG0IGRiIOyCreygnFxyXG4gICAgICAgIERCID0gYXdhaXQgb3BlbkltYWdlVXJsREIoKTtcclxuICAgICAgICBhd2FpdCBsb2FkS2V5U2V0KERCKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImRi66Gc65Oc7JmE66OMXCIpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIuyEnOu5hOyKpOybjOy7pCDstIjquLDtmZQgLSBkYiDroZzrk5wg67CPIO2CpOyFiyDroZzrk5wg7KSR7JeQIOyXkOufrCDrsJzsg506XCIgKyBlKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJlcnJvciB3aGlsZSBsb2FkaW5nIGRiIG9yIGtleXNldCBcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuXHJcbi8qXHJcbnJlc29sdmUodmFsdWUpXHJcbjog7J6R7JeF7J20IOyEseqzte2WiOydhCDrlYwgUHJvbWlzZeydmCDsg4Htg5zrpbwgJ+ydtO2WiShmdWxmaWxsZWQpJyDsg4Htg5zroZwg7KCE7ZmY7Iuc7YKk6rOgLCDqsrDqs7zrpbwgdmFsdWXroZwg7KCE64us7ZWp64uI64ukLiDtlbTri7kg6rCS7J2AXHJcbi50aGVuKCnsnZgg7LKrIOuyiOynuCDsvZzrsLEsIOu5hOuPmeq4sOyggeycvOuhnCDsi6TtlolcclxucmVqZWN0KHJlYXNvbilcclxuOiDsnpHsl4XsnbQg7Iuk7Yyo7ZaI7J2EIOuVjCBQcm9taXNl7J2YIOyDge2DnOulvCAn6rGw67aAKHJlamVjdGVkKScg7IOB7YOc66GcIOyghO2ZmOyLnO2CpOqzoCwg7JeQ65+sKOydtOycoCnrpbwgcmVhc29u7Jy866GcIOyghOuLrO2VqeuLiOuLpC5cclxu7ZW064u5IOqwkuydgCAuY2F0Y2goKSDrmJDripQgLnRoZW4oLCApIOuRkCDrsojsp7gg7L2c67CxLCDruYTrj5nquLDsoIHsnLzroZwg7Iuk7ZaJXHJcbiovXHJcbmV4cG9ydCBmdW5jdGlvbiBvcGVuSW1hZ2VVcmxEQigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgLy9pbWFnZVVybERC64qUIGRi7J2066aELiDrp4zslb0g7KG07J6s7ZWY7KeAIOyViuycvOuptCDsg53shLEsIOyhtOyerO2VmOuptCDtlbTri7kgZGLrpbwg7Je07J2MIFxyXG4gICAgICAgIC8v65GQ67KI7Ke4IOyduOyekOyduCAx7J2AIOuNsOydtO2EsCDrsqDsnbTsiqQg67KE7KCELiDrp4zslb3sl5AgZGLqsIAg7J20IOqwkuuztOuLpCDrsoTsoITsnbQg64Ku64uk66m0IOyXheq3uOugiOydtOuTnCDsnbTrsqTtirjqsIAg67Cc7IOd65CoLihvbnVwZ3JhZGVuZWVkZWQpXHJcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKCdpbWFnZVVybERCJywgMSk7XHJcbiAgICAgICAgLy/sl4Xqt7jroIjsnbTrk5zqsIAg67Cc7IOd7ZWgIOqyveyasCDsnbTrsqTtirgg7ZW465Ok65+s7JeQ7IScIOyLpO2Wie2VoCDsvZzrsLEg7ZWo7IiYIOygleydmFxyXG4gICAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIC8vIG9wZW4g7JqU7LKt7Jy866GcIOyXtOumrOqxsOuCmCDsg53shLHrkJwg642w7J207YSw67Kg7J207IqkKElEQkRhdGFiYXNlKSDqsJ3ssrQuIFxyXG4gICAgICAgICAgICAvL+ydtCDqsJ3ssrTroZwgb2JqZWN0U3RvcmUo7YWM7J2067iUIOqwmeydgCDqsJzrhZAp66W8IOunjOuTpOqxsOuCmCDsgq3soJztlZjripQg65OxIOuNsOydtO2EsOuyoOydtOyKpOydmCDsiqTtgqTrp4jrpbwg7KGw7J6R7ZWgIOyImCDsnojsnYxcclxuICAgICAgICAgICAgLy8gb2JqZWN0U3RvcmXsnYAg7J287KKF7J2YIFwi7YWM7J2067iUXCIg6rCc64WQ7J2066mwIOq0gOqzhO2YlURC7J2YIO2FjOydtOu4lOuztOuLpCDsnpDsnKDroZzsmrQg7ZiV7YOc66GcLCDsnpDrsJTsiqTtgazrpr3tirgg6rCd7LK0IOuLqOychOuhnCBcclxuICAgICAgICAgICAgLy/rjbDsnbTthLDrpbwg7KCA7J6l7ZWgIOyImCDsnojsnYxcclxuICAgICAgICAgICAgLy9rZXlQYXRo64qUIOyggOyepe2VmOuKlCDqsIEg6rCd7LK07JeQ7IScIOq4sOuzuO2CpOuhnCDsgqzsmqntlaAg7IaN7ISxIOydtOumhFxyXG4gICAgICAgICAgICBjb25zdCBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XHJcbiAgICAgICAgICAgIC8vIGltYWdlcyBvYmplY3RTdG9yZSDsg53shLEsIGtleVBhdGjripQgY2Fub25pY2FsVXJs66GcIVxyXG5cclxuICAgICAgICAgICAgaWYgKCFkYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCdpbWdVUkwnKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKCdpbWdVUkwnLCB7IGtleVBhdGg6ICd1cmwnIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTsgLy8gcHJvbWlzZSB2YWx1ZeyXkCBkYiDsnbjsiqTthLTsiqQg67CY7ZmY6rCSIOyggOyepVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJlcXVlc3Qub25lcnJvciA9IChldmVudCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7IC8vIHByb21pc2UgcmVhc29u7JeQIGV2ZW50LnRhcmdldC5lcnJvciDsoIDsnqVcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVJbWFnZVVybERCKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAvLyBJbmRleGVkRELsnZggZGVsZXRlRGF0YWJhc2Ug66mU7ISc65Oc66W8IOyCrOyaqe2VmOyXrCDrjbDsnbTthLDrsqDsnbTsiqTrpbwg7IKt7KCc7ZWp64uI64ukLlxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSBpbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoJ2ltYWdlVXJsREInKTtcclxuXHJcbiAgICAgICAgLy8g7IKt7KCcIOyEseqztSDsi5wg7Zi47Lac65CY64qUIOydtOuypO2KuCDtlbjrk6Trn6xcclxuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+uNsOydtO2EsOuyoOydtOyKpOqwgCDshLHqs7XsoIHsnLzroZwg7IKt7KCc65CY7JeI7Iq164uI64ukLicpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8g7IKt7KCcIOyLpO2MqCDsi5wg7Zi47Lac65CY64qUIOydtOuypO2KuCDtlbjrk6Trn6xcclxuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgcmVqZWN0KCfrjbDsnbTthLDrsqDsnbTsiqQg7IKt7KCcIOyYpOulmDonLCBldmVudC50YXJnZXQuZXJyb3IpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIOuNsOydtO2EsOuyoOydtOyKpOqwgCDri6Trpbgg7YOt7JeQ7IScIOyXtOugpCDsnojslrQg7IKt7KCc6rCAIOywqOuLqOuQoCDrlYwg7Zi47Lac65CY64qUIOydtOuypO2KuCDtlbjrk6Trn6xcclxuICAgICAgICByZXF1ZXN0Lm9uYmxvY2tlZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCfrjbDsnbTthLDrsqDsnbTsiqTqsIAg64uk66W4IOyXsOqysOyXkCDsnZjtlbQg7LCo64uo65CY7JeI7Iq164uI64ukLicpO1xyXG4gICAgICAgICAgICByZWplY3QoJ+uNsOydtO2EsOuyoOydtOyKpOqwgCDri6Trpbgg7Jew6rKw7JeQIOydmO2VtCDssKjri6jrkJjsl4jsirXri4jri6QuJyk7XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxLZXlzUHJvbWlzZShzdG9yZSkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCByZXEgPSBzdG9yZS5nZXRBbGxLZXlzKCk7XHJcbiAgICAgICAgcmVxLm9uc3VjY2VzcyA9IChlKSA9PiByZXNvbHZlKGUudGFyZ2V0LnJlc3VsdCk7IC8vIOuwsOyXtCDrsJjtmZghXHJcbiAgICAgICAgcmVxLm9uZXJyb3IgPSAoZSkgPT4gcmVqZWN0KGUudGFyZ2V0LmVycm9yKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRLZXlTZXQoKSB7XHJcbiAgICBjb25zdCB0eCA9IERCLnRyYW5zYWN0aW9uKCdpbWdVUkwnLCAncmVhZG9ubHknKTtcclxuICAgIGNvbnN0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ2ltZ1VSTCcpO1xyXG4gICAgLy8g7J2066+4IOyggOyepeuQnCDrqqjrk6AgY2Fub25pY2FsVXJs7J2EIO2VnOuyiOyXkCDsobDtmowgKOuMgOufiSDsspjrpqwg7IucIO2aqOycqOyggSlcclxuICAgIGNvbnN0IGV4aXN0aW5nS2V5cyA9IGF3YWl0IGdldEFsbEtleXNQcm9taXNlKHN0b3JlKTtcclxuICAgIC8vIOydtOuvuCDsobTsnqztlZjripTsp4AgU2V07Jy866GcIOq0gOumrCjqsoDsg4kg67mg66aEKVxyXG4gICAga2V5U2V0ID0gbmV3IFNldChleGlzdGluZ0tleXMpO1xyXG4gICAgY29uc29sZS5sb2coa2V5U2V0LnNpemUpO1xyXG4gICAga2V5U2V0TG9hZGVkID0gdHJ1ZTtcclxufVxyXG5cclxuLyoq44S4XHJcbiAqIFxyXG4gKiBAcGFyYW0ge09iamVjdH0gdGFibGVNZXRob2RSZXN1bHQgdGFibGXsl5AgZ2V0LHB1dCDrk7Eg67mE64+Z6riwIOyalOyyreydmCDrsJjtmZjqsJIgIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXFUYWJsZVByb21pc2UodGFibGVNZXRob2RSZXN1bHQpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdGFibGVNZXRob2RSZXN1bHQub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRhYmxlTWV0aG9kUmVzdWx0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZURCKHJlc3BvbnNlRGF0YSkge1xyXG4gICAgY29uc3QgdHggPSBEQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgY29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnaW1nVVJMJyk7XHJcblxyXG4gICAgZm9yIChjb25zdCBbdXJsLCBpbWdSZXNEYXRhXSBvZiByZXNwb25zZURhdGEpIHtcclxuICAgICAgICBsZXQgZGJWYWx1ZSA9IGF3YWl0IHJlcVRhYmxlUHJvbWlzZShzdG9yZS5nZXQodXJsKSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJ0YWJsZeyXkOyEnCBrZXkg7KGw7ZqM7ZWY6rOgIHZhbHVlIOqwgOyguOyYpOuKlCDspJHsl5AgRXJyb3Ig67Cc7IOdOlwiLCBlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZGJWYWx1ZS5yZXNwb25zZSA9IGltZ1Jlc0RhdGEucmVzcG9uc2U7XHJcbiAgICAgICAgZGJWYWx1ZS5zdGF0dXMgPSBpbWdSZXNEYXRhLnN0YXR1cztcclxuICAgICAgICBkYlZhbHVlLmhhcm1mdWwgPSBpbWdSZXNEYXRhLmhhcm1mdWw7XHJcbiAgICAgICAgYXdhaXQgcmVxVGFibGVQcm9taXNlKHN0b3JlLnB1dChkYlZhbHVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy90eCDsmYTro4wg6riw64us66a0IO2VhOyalCB4Py4uLlxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBwcm9wYWdhdGVSZXNCb2R5RGF0YX0gZnJvbSAnLi4vdXRpbHMvcHJvcGFnYXRlLmpzJztcclxuaW1wb3J0IHtEQiwgcmVxVGFibGVQcm9taXNlfSBmcm9tICcuL2luZGV4RGIuanMnO1xyXG5pbXBvcnQgeyBDc0JhdGNoRm9yV2FpdGluZywgZ2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSB9IGZyb20gJy4uL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzJztcclxuXHJcbmNvbnN0IHJldHJ5VGhyZXNob2xkID0gMTUgKiAxMDAwO1xyXG5cclxuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQmF0Y2goQ3NJbWdEYXRhLCB0YWJJZCkge1xyXG5cclxuLy8gICBjb25zb2xlLmxvZyhcImZldGNoZGF0YTpcIiArIENzSW1nRGF0YS5sZW5ndGgpO1xyXG5cclxuLy8gICBsZXQgQ3NJbWdEYXRhRm9yRmV0Y2ggPSBudWxsO1xyXG4vLyAgIHRyeSB7XHJcbi8vICAgICBjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWUudGFicy5nZXQodGFiSWQpO1xyXG4vLyAgICAgY29uc3QgcmVmZXJlclVybCA9IHRhYi51cmw7XHJcblxyXG4vLyAgICAgQ3NJbWdEYXRhRm9yRmV0Y2ggPSBhd2FpdCBQcm9taXNlLmFsbChcclxuLy8gICAgICAgQ3NJbWdEYXRhLm1hcChhc3luYyBpbWdkYXRhID0+IHtcclxuLy8gICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZmV0Y2hBbmRSZXR1cm5CYXNlNjRJbWcoaW1nZGF0YS51cmwsIHJlZmVyZXJVcmwpO1xyXG4vLyAgICAgICAgIHJldHVybiB7XHJcbi8vICAgICAgICAgICB1cmw6IGltZ2RhdGEudXJsLFxyXG4vLyAgICAgICAgICAgY29udGVudDogY29udGVudCxcclxuLy8gICAgICAgICAgIHN0YXR1czogaW1nZGF0YS5zdGF0dXMsXHJcbi8vICAgICAgICAgICBoYXJtZnVsOiBpbWdkYXRhLmhhcm1mdWxcclxuLy8gICAgICAgICB9O1xyXG4vLyAgICAgICB9KVxyXG4vLyAgICAgKTtcclxuXHJcbi8vICAgfSBjYXRjaCAoZXJyKSB7XHJcbi8vICAgICBjb25zb2xlLmVycm9yKFwi7J2066+47KeAIOyLpOygnCDrjbDsnbTthLAgZmV0Y2gg6rO87KCVIOykkSDsl5Drn6wg67Cc7IOdOiBcIiwgZXJyKTtcclxuLy8gICB9XHJcblxyXG4vLyAgIGNvbnN0IGJvZHlEYXRhID0gSlNPTi5zdHJpbmdpZnkoeyBkYXRhOiBDc0ltZ0RhdGFGb3JGZXRjaCB9KTtcclxuXHJcbi8vICAgdHJ5IHtcclxuXHJcbi8vICAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4vLyAgICAgY29uc29sZS5sb2coXCJmZXRjaCE6IFwiLCBDc0ltZ0RhdGFGb3JGZXRjaC5sZW5ndGgpO1xyXG4vLyAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2ltYWdlLWludGVyY2VwdG9yLXRlc3QtNjgzODU3MTk0Njk5LmFzaWEtbm9ydGhlYXN0My5ydW4uYXBwXCIsIHtcclxuLy8gICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuLy8gICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4vLyAgICAgICBib2R5OiBib2R5RGF0YVxyXG4vLyAgICAgfSk7XHJcblxyXG4vLyAgICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihcIuyEnOuyhCDsnZHri7Ug7Jik66WYXCIpOy8vIGNhdGNo66GcIOydtOuPmVxyXG4vLyAgICAgY29uc29sZS5sb2coYHJlc3BvbnNlIGRlbGF5dGltZTogJHsocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLyAxMDAwfWApO1xyXG5cclxuLy8gICAgIGNvbnN0IHJlc3BvbnNlQm9keURhdGEgPSBhd2FpdCByZXMuanNvbigpPy50aGVuKHJlc3VsdCA9PiB7IHJldHVybiByZXN1bHQ/LmRhdGE/LmltYWdlcyB9KTtcclxuLy8gICAgIGlmIChyZXNwb25zZUJvZHlEYXRhLmxlbmd0aCA+IDApIHtcclxuLy8gICAgICAgcHJvcGFnYXRlUmVzQm9keURhdGEobmV3IE1hcChyZXNwb25zZUJvZHlEYXRhLm1hcCgoZWwpID0+IHtcclxuLy8gICAgICAgICByZXR1cm4gW2VsLnVybCwgeyB1cmw6IGVsLnVybCwgcmVzcG9uc2U6IHRydWUsIHN0YXR1czogZWwuc3RhdHVzLCBoYXJtZnVsOiBlbC5oYXJtZnVsIH1dO1xyXG4vLyAgICAgICB9KSkpO1xyXG4vLyAgICAgfSBlbHNlIGNvbnNvbGUubG9nKFwiY2F1c2UgLSBmZXRjaCByZXNwb25zZTogYm9keWRhdGEg7JeG7J2MXCIpO1xyXG4vLyAgIH0gY2F0Y2ggKGVycikge1xyXG4vLyAgICAgY29uc29sZS5lcnJvcihcclxuLy8gICAgICAgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcclxuLy8gICAgICAgICA/IGBKU09OIHBhcnNpbmcgZmFpbGVkOiAke2Vyci5tZXNzYWdlfWBcclxuLy8gICAgICAgICA6IGBSZXF1ZXN0IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbi8vICAgICApO1xyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxuXHJcbi8vLy8v7Iuk7ZeYIO2VqOyImFxyXG4vLyBCbG9i7J2EIEJhc2U2NCDrrLjsnpDsl7TroZwg67OA7ZmY7ZWY64qUIO2XrO2NvCDtlajsiJhcclxuIGZ1bmN0aW9uIGJsb2JUb0Jhc2U2NChibG9iKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTsgLy8gQmxvYuydhCDsnb3slrQgQmFzZTY0IOuNsOydtO2EsCBVUknroZwg67OA7ZmYIOyLnOyekVxyXG4gICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHtcclxuICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KTsgLy8g67OA7ZmYIOyZhOujjCDsi5wgQmFzZTY0IOusuOyekOyXtCDrsJjtmZhcclxuICAgIH07XHJcbiAgICByZWFkZXIub25lcnJvciA9IChlcnJvcikgPT4ge1xyXG4gICAgICAgIHJlamVjdChlcnJvcik7IC8vIOyXkOufrCDrsJzsg50g7IucIOqxsOu2gFxyXG4gICAgfTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG4vLy8vL1xyXG4gYXN5bmMgZnVuY3Rpb24gZmV0Y2hBbmRSZXR1cm5CYXNlNjRJbWcodXJsLCByZWZlcmVyVXJsKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdSZWZlcmVyJzogcmVmZXJlclVybFxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIGNvbnN0IHJlc0Jsb2IgPSBhd2FpdCByZXMuYmxvYigpO1xyXG4gICAgICBjb25zdCBCYXNlNjQgPSBhd2FpdCBibG9iVG9CYXNlNjQocmVzQmxvYikudGhlbihyZXNOb3RGaWx0ZXJkID0+IHsgcmV0dXJuIHJlc05vdEZpbHRlcmQuc3BsaXQoJywnKVsxXTsgfSk7XHJcbiAgICAgIHJldHVybiByZXNvbHZlKEJhc2U2NCk7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuXHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgfTtcclxuXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoQW5kUmV0dXJuQmxvYkltZyh1cmwsIHJlZmVyZXJVcmwpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdSZWZlcmVyJzogcmVmZXJlclVybFxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIGNvbnN0IHJlc0Jsb2IgPSBhd2FpdCByZXMuYmxvYigpO1xyXG4gICAgICByZXR1cm4gcmVzb2x2ZShyZXNCbG9iKTtcclxuXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG5cclxuICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICB9O1xyXG5cclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tUaW1lQW5kUmVmZXRjaCgpIHtcclxuICBjb25zdCByZUZldGNoRGF0YSA9IG5ldyBNYXAoKTtcclxuXHJcbiAgY29uc3QgdHggPSBEQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWR3cml0ZScpO1xyXG4gIGNvbnN0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ2ltZ1VSTCcpO1xyXG5cclxuICBmb3IgKGNvbnN0IFt1cmwsIGltZ0RhdGFdIG9mIENzQmF0Y2hGb3JXYWl0aW5nKSB7XHJcbiAgICBcclxuICAgIGxldCBkYlZhbHVlID0gYXdhaXQgcmVxVGFibGVQcm9taXNlKHN0b3JlLmdldCh1cmxbMV0pKS50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJ0YWJsZeyXkOyEnCBrZXkg7KGw7ZqM7ZWY6rOgIHZhbHVlIOqwgOyguOyYpOuKlCDspJHsl5AgRXJyb3Ig67Cc7IOdOlwiLCBlcnJvcik7XHJcbiAgICB9KTtcclxuICAgIGlmIChyZXRyeVRocmVzaG9sZCA8IChEYXRlLm5vdygpIC0gZGJWYWx1ZS5zYXZlVGltZSkpIHtcclxuICAgICAgaWYgKCFyZUZldGNoRGF0YS5nZXQoaW1nRGF0YS50YWJJZCkpIHtcclxuICAgICAgICByZUZldGNoRGF0YS5zZXQoaW1nRGF0YS50YWJJZCwgW2ltZ0RhdGFdKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZUZldGNoRGF0YS5nZXQoaW1nRGF0YS50YWJJZCkucHVzaChpbWdEYXRhKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZGJWYWx1ZS5zYXZlVGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgIGF3YWl0IHJlcVRhYmxlUHJvbWlzZShzdG9yZS5wdXQoZGJWYWx1ZSkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZm9yIChjb25zdCBbdGFiSWQsIGltZ0RhdGFBcnJdIG9mIHJlRmV0Y2hEYXRhKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInJlc2VuZGluZyBkYXRhOlwiICsgcmVGZXRjaERhdGEuc2l6ZSk7XHJcbiAgICBmZXRjaEJhdGNoKGltZ0RhdGFBcnIsIHRhYklkKTtcclxuICB9XHJcbiAgYXdhaXQgdHguZG9uZT8uKCk7XHJcblxyXG59XHJcblxyXG4vL2NyZWF0ZUltYWdlQml0bWFw7Jy866GcIOyngOybkCDslYjtlZjripQg7J2066+47KeAOiBzdmdcclxuLy9pbWFnZSDqsJ3ssrTrpbwg7IOd7ISx7ZW07IScIOyasO2ajOyggeycvOuhnCDtlbTqsrDtlbTslbwg7ZWoLiDqt7jrn6zrgpgg67mE7Jyg7ZW0IOydtOuvuOyngCDtlYTthLDsl5DshJwg7ZW064u5IOycoO2YleydmCDsnbTrr7jsp4Drpbwg66+466asIOqxuOufrOuCvCDsmIjsoJXsnbTquLAg65WM66y47JeQIO2YhOyerCDsiJjsoJUg7JWI7ZWcIOyDge2DnFxyXG5hc3luYyBmdW5jdGlvbiByZXNpemVBbmRTZW5kQmxvYihibG9iLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAvLyBCbG9i7J2EIEltYWdlQml0bWFw7Jy866GcIOuzgO2ZmFxyXG4gICAgY29uc3QgaW1hZ2VCaXRtYXAgPSBhd2FpdCBjcmVhdGVJbWFnZUJpdG1hcChibG9iKTtcclxuXHJcbiAgICAvLyBPZmZzY3JlZW5DYW52YXMg7IOd7ISxXHJcbiAgICBjb25zdCBvZmZzY3JlZW4gPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgY29uc3QgY3R4ID0gb2Zmc2NyZWVuLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgLy8g7LqU67KE7Iqk7JeQIOq3uOumrOq4sFxyXG4gICAgY3R4LmRyYXdJbWFnZShpbWFnZUJpdG1hcCwgMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcblxyXG4gICAgLy8gQmxvYuycvOuhnCDrs4DtmZhcclxuICAgIGNvbnN0IHJlc2l6ZWRCbG9iID0gYXdhaXQgb2Zmc2NyZWVuLmNvbnZlcnRUb0Jsb2Ioe1xyXG4gICAgICAgIHR5cGU6ICdpbWFnZS93ZWJQJyxcclxuICAgICAgICBxdWFsaXR5OiAwLjk1XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVzaXplZEJsb2I7XHJcbiAgfVxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaEJhdGNoKENzSW1nRGF0YSwgdGFiSWQpIHtcclxuXHJcbiAgLy9sZXQgQ3NJbWdEYXRhRm9yRmV0Y2ggPSBudWxsO1xyXG4gIGxldCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gIGxldCB0YWJVcmw7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHRhYiA9IGF3YWl0IGNocm9tZS50YWJzLmdldCh0YWJJZCk7XHJcbiAgICB0YWJVcmwgPSB0YWIudXJsO1xyXG5cclxuICAgIC8vIENzSW1nRGF0YUZvckZldGNoID0gYXdhaXQgUHJvbWlzZS5hbGwoXHJcbiAgICAvLyAgIENzSW1nRGF0YS5tYXAoYXN5bmMgaW1nZGF0YSA9PiB7XHJcbiAgICAvLyAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZldGNoQW5kUmV0dXJuQmFzZTY0SW1nKGltZ2RhdGEudXJsLCByZWZlcmVyVXJsKTtcclxuICAgIC8vICAgICByZXR1cm4ge1xyXG4gICAgLy8gICAgICAgdXJsOiBpbWdkYXRhLnVybCxcclxuICAgIC8vICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXHJcbiAgICAvLyAgICAgICBzdGF0dXM6IGltZ2RhdGEuc3RhdHVzLFxyXG4gICAgLy8gICAgICAgaGFybWZ1bDogaW1nZGF0YS5oYXJtZnVsXHJcbiAgICAvLyAgICAgfTtcclxuICAgIC8vICAgfSlcclxuICAgIC8vICk7XHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgICAgQ3NJbWdEYXRhLm1hcChhc3luYyBpbWdkYXRhID0+IHtcclxuICAgICAgICBjb25zdCBpbWdCbG9iID0gYXdhaXQgZmV0Y2hBbmRSZXR1cm5CbG9iSW1nKGltZ2RhdGEudXJsLCB0YWJVcmwpO1xyXG4gICAgICAgIGxldCByZXNpemVkSW1nQmxvYjtcclxuXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgcmVzaXplZEltZ0Jsb2IgPSBhd2FpdCByZXNpemVBbmRTZW5kQmxvYihpbWdCbG9iLCAyMjQsIDIyNCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKGVycil7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ8IHJlc2l6ZeqzvOygleyXkOyEnCDsmKTrpZgg67Cc7IOdIFwiKyBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbWdNZXRhSnNvbiA9IEpTT04uc3RyaW5naWZ5KFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmw6IGltZ2RhdGEudXJsLFxyXG4gICAgICAgICAgICBzdGF0dXM6IGltZ2RhdGEuc3RhdHVzLFxyXG4gICAgICAgICAgICBoYXJtZnVsOiBpbWdkYXRhLmhhcm1mdWwsXHJcbiAgICAgICAgICAgIGxldmVsOiBnZXRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlKClcclxuICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnaW1hZ2VzJywgcmVzaXplZEltZ0Jsb2IpO1xyXG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnaW1nTWV0YScsIGltZ01ldGFKc29uKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcImJvZHkgZGF0YSDsspjrpqwg67CPIOykgOu5hCDqs7zsoJUg7KSRIOyXkOufrCDrsJzsg506XCIsIGVycik7XHJcbiAgfVxyXG5cclxuICAvL2NvbnN0IGJvZHlEYXRhID0gSlNPTi5zdHJpbmdpZnkoeyBkYXRhOiBDc0ltZ0RhdGFGb3JGZXRjaCB9KTtcclxuXHJcbiAgdHJ5IHtcclxuXHJcbiAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgY29uc29sZS5sb2coYDwtLWZldGNoIS0tPlxcbiB0b3RhbDogJHtDc0ltZ0RhdGEubGVuZ3RofVxcbmxldmVsOiR7Z2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSgpIH1gKTtcclxuICAgIGxldCByZXM7XHJcbiAgICBpZiAodGFiVXJsLmluY2x1ZGVzKFwieW91dHViZS5jb21cIikgKXtcclxuICAgICAgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2ltYWdlLWludGVyY2VwdG9yLXlvdXR1YmUtNjgzODU3MTk0Njk5LmFzaWEtbm9ydGhlYXN0My5ydW4uYXBwXCIsIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGJvZHk6IGZvcm1EYXRhXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9pbWFnZS1pbnRlcmNlcHRvci1ncHUtNjgzODU3MTk0Njk5LmFzaWEtc291dGhlYXN0MS5ydW4uYXBwXCIsIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGJvZHk6IGZvcm1EYXRhXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoXCLshJzrsoQg7J2R64u1IOyYpOulmFwiKTsvLyBjYXRjaOuhnCDsnbTrj5lcclxuICAgIGNvbnNvbGUubG9nKGByZXNwb25zZSBkZWxheXRpbWU6ICR7KHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpIC8gMTAwMH1gKTtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZUJvZHlEYXRhID0gYXdhaXQgcmVzLmpzb24oKT8udGhlbihyZXN1bHQgPT4geyByZXR1cm4gcmVzdWx0Py5pbWFnZSB9KTtcclxuICAgIGlmIChyZXNwb25zZUJvZHlEYXRhLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgIGNvbnN0IHByb2Nlc3NlZFJlc0JvZHlEYXRhID0gbmV3IE1hcChyZXNwb25zZUJvZHlEYXRhLm1hcCgoZWwpID0+IHtcclxuICAgICAgICByZXR1cm4gW2VsLnVybCwgeyB1cmw6IGVsLnVybCwgcmVzcG9uc2U6IHRydWUsIHN0YXR1czogZWwuc3RhdHVzLCBoYXJtZnVsOiBlbC5oYXJtZnVsIH1dO1xyXG4gICAgICB9KSk7XHJcblxyXG4gICAgICBwcm9wYWdhdGVSZXNCb2R5RGF0YShwcm9jZXNzZWRSZXNCb2R5RGF0YSk7XHJcblxyXG4gICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcihcImNhdXNlIC0gZmV0Y2ggcmVzcG9uc2U6IGJvZHlkYXRhIOyXhuydjFwiKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXHJcbiAgICAgICAgPyBgSlNPTiBwYXJzaW5nIGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbiAgICAgICAgOiBgUmVxdWVzdCBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9YFxyXG4gICAgKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIFJFUVVFU1QgREFUQVxyXG4vLyBbXHJcbi8vICAge1xyXG4vLyAgICAgY2Fub25pY2FsVXJsOiBpdGVtLmNhbm9uaWNhbFVybCxcclxuLy8gICAgICAgdXJsOiBpdGVtLnVybCxcclxuLy8gICAgICAgICBzdGF0dXM6IGZhbHNlLFxyXG4vLyAgICAgICAgICAgaGFybWZ1bDogZmFsc2VcclxuLy8gICB9XHJcbi8vIF1cclxuLy8gUkVTUE9OU0UgREFUQSBleGFtcGxlXHJcbi8vIHtcclxuLy8gICAgIFwiZGF0YVwiOiBbXHJcbi8vICAgICAgICAge1xyXG4vLyAgICAgICAgICAgICBcImNhbm9uaWNhbFVybFwiOiBcImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vcGFnZWFkLzFwLXVzZXItbGlzdC85NjI5ODU2NTYvP2JhY2tlbmQ9aW5uZXJ0dWJlJmNuYW1lPTEmY3Zlcj0yXzIwMjUwODA3JmRhdGE9YmFja2VuZCUzRGlubmVydHViZSUzQmNuYW1lJTNEMSUzQmN2ZXIlM0QyXzIwMjUwODA3JTNCZWwlM0RhZHVuaXQlM0JwdHlwZSUzRGZfYWR2aWV3JTNCdHlwZSUzRHZpZXclM0J1dHVpZCUzRHRkejlMV05OUUtVZzRYcG1hXzQwVWclM0J1dHZpZCUzRDRCeUowejNVTU5FJmlzX3Z0Yz0wJnB0eXBlPWZfYWR2aWV3JnJhbmRvbT00Mjg3NjY0OTYmdXR1aWQ9dGR6OUxXTk5RS1VnNFhwbWFfNDBVZ1wiLFxyXG4vLyAgICAgICAgICAgICBcInVybFwiOiBcImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vcGFnZWFkLzFwLXVzZXItbGlzdC85NjI5ODU2NTYvP2JhY2tlbmQ9aW5uZXJ0dWJlJmNuYW1lPTEmY3Zlcj0yXzIwMjUwODA3JmRhdGE9YmFja2VuZCUzRGlubmVydHViZSUzQmNuYW1lJTNEMSUzQmN2ZXIlM0QyXzIwMjUwODA3JTNCZWwlM0RhZHVuaXQlM0JwdHlwZSUzRGZfYWR2aWV3JTNCdHlwZSUzRHZpZXclM0J1dHVpZCUzRHRkejlMV05OUUtVZzRYcG1hXzQwVWclM0J1dHZpZCUzRDRCeUowejNVTU5FJmlzX3Z0Yz0wJnB0eXBlPWZfYWR2aWV3JnJhbmRvbT00Mjg3NjY0OTYmdXR1aWQ9dGR6OUxXTk5RS1VnNFhwbWFfNDBVZ1wiLFxyXG4vLyAgICAgICAgICAgICBcInN0YXR1c1wiOiB0cnVlLFxyXG4vLyAgICAgICAgICAgICBcImhhcm1mdWxcIjogZmFsc2UsXHJcbi8vICAgICAgICAgICAgIFwiY2F0ZWdvcnlcIjogXCJtZWRpY2FsXCIsXHJcbi8vICAgICAgICAgICAgIFwic2NvcmVcIjogMC40LFxyXG4vLyAgICAgICAgICAgICBcImRldGFpbHNcIjoge1xyXG4vLyAgICAgICAgICAgICAgICAgXCJhZHVsdFwiOiAxLFxyXG4vLyAgICAgICAgICAgICAgICAgXCJzcG9vZlwiOiAxLFxyXG4vLyAgICAgICAgICAgICAgICAgXCJtZWRpY2FsXCI6IDIsXHJcbi8vICAgICAgICAgICAgICAgICBcInZpb2xlbmNlXCI6IDIsXHJcbi8vICAgICAgICAgICAgICAgICBcInJhY3lcIjogMlxyXG4vLyAgICAgICAgICAgICB9LFxyXG4vLyAgICAgICAgICAgICBcInByb2Nlc3NlZFwiOiB0cnVlLFxyXG4vLyAgICAgICAgICAgICBcImVycm9yXCI6IGZhbHNlLFxyXG4vLyAgICAgICAgICAgICBcImVycm9yX21lc3NhZ2VcIjogbnVsbCxcclxuLy8gICAgICAgICAgICAgXCJlcnJvcl90eXBlXCI6IG51bGxcclxuLy8gICAgICAgICB9XHJcbi8vICAgICBdLFxyXG4vLyAgICAgXCJzdW1tYXJ5XCI6IHtcclxuLy8gICAgICAgICBcInRvdGFsXCI6IDEsXHJcbi8vICAgICAgICAgXCJwcm9jZXNzZWRcIjogMSxcclxuLy8gICAgICAgICBcImhhcm1mdWxcIjogMCxcclxuLy8gICAgICAgICBcInNhZmVcIjogMSxcclxuLy8gICAgICAgICBcImVycm9yc1wiOiAwLFxyXG4vLyAgICAgICAgIFwiZXJyb3JfdHlwZXNcIjoge31cclxuLy8gICAgIH0sXHJcbi8vICAgICBcIm1lc3NhZ2VcIjogXCLstJ0gMeqwnCDsnbTrr7jsp4Ag7KSRIDHqsJwg7LKY66asIOyZhOujjCAo67Cw7LmYIEFQSSDtmLjstpw6IDHtmozroZwgMeqwnCDsnbTrr7jsp4Ag64+Z7IucIOyymOumrClcIlxyXG4vLyB9XHJcbiIsIlxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24odXJsLCBudW1PZkhhcm1mdWxJbWcpIHtcclxuICBjb25zdCBzdG9yZWREYXRhID0gYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5nZXQoWydudW1PZkhhcm1mdWxJbWdJblBhZ2UnXSk7XHJcbiAgbGV0IG51bU9mSGFybWZ1bEltZ0luUGFnZSA9IHN0b3JlZERhdGEubnVtT2ZIYXJtZnVsSW1nSW5QYWdlIHx8IHt9O1xyXG5cclxuICBjb25zb2xlLmxvZyhudW1PZkhhcm1mdWxJbWdJblBhZ2UpO1xyXG5cclxuICBpZiAodXJsIGluIG51bU9mSGFybWZ1bEltZ0luUGFnZSkge1xyXG4gICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gKz0gbnVtT2ZIYXJtZnVsSW1nO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA9IG51bU9mSGFybWZ1bEltZztcclxuICB9XHJcblxyXG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uc2V0KHsgJ251bU9mSGFybWZ1bEltZ0luUGFnZSc6IG51bU9mSGFybWZ1bEltZ0luUGFnZSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uKHVybCkge1xyXG4gICAgY29uc3Qgc3RvcmVkRGF0YSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uZ2V0KFsnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJ10pO1xyXG5cclxuICAgICBsZXQgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlID0gc3RvcmVkRGF0YS5udW1PZkhhcm1mdWxJbWdJblBhZ2UgfHwge307XHJcbiAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gPSAwO1xyXG5cclxuICAgICAgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5zZXQoeyAnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJzogbnVtT2ZIYXJtZnVsSW1nSW5QYWdlIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TnVtT2ZIYXJtZnVsSW1nSW50aGlzcGFnZSh1cmwpIHtcclxuICAgIGNvbnN0IHN0b3JlZERhdGEgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLmdldChbJ251bU9mSGFybWZ1bEltZ0luUGFnZSddKTtcclxuICAgIGxldCBudW1PZkhhcm1mdWxJbWdJblBhZ2UgPSBzdG9yZWREYXRhLm51bU9mSGFybWZ1bEltZ0luUGFnZSB8fCB7fTtcclxuXHJcbiAgICByZXR1cm4gbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gPyBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA6IDA7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRUb3RhbE51bU9mSGFybWZ1bEltZyhudW0pIHtcclxuXHJcbiAgICBjb25zdCB0b3RhbE51bU9mSGFybWZ1bEltZyA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ3RvdGFsTnVtT2ZIYXJtZnVsSW1nJ10pLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC50b3RhbE51bU9mSGFybWZ1bEltZyk7XHJcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyd0b3RhbE51bU9mSGFybWZ1bEltZyc6KHRvdGFsTnVtT2ZIYXJtZnVsSW1nKyBudW0pfSk7XHJcbn1cclxuXHJcbiIsIlxyXG5pbXBvcnQge3VwZGF0ZURCIH0gZnJvbSAnLi4vbW9kdWxlcy9pbmRleERiLmpzJztcclxuaW1wb3J0IHtjaGVja1RpbWVBbmRSZWZldGNofSBmcm9tICcuLi9tb2R1bGVzL3JlcXVlc3RJbWdBbmFseXplLmpzJztcclxuaW1wb3J0IHsgQ3NCYXRjaEZvcldhaXRpbmcgfSBmcm9tICcuLi9nbG9iYWwvYmFja2dyb3VuZENvbmZpZy5qcyc7XHJcbmltcG9ydCB7c2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbiwgYWRkVG90YWxOdW1PZkhhcm1mdWxJbWd9IGZyb20gJy4uL3V0aWxzL2JhY2tncm91bmRVdGlscy5qcydcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9wYWdhdGVSZXNCb2R5RGF0YShyZXNwb25zZURhdGEpIHtcclxuICAgIGNvbnN0IHJlYWR5VG9TZW5kID0gbmV3IE1hcCgpOyAvLyB0YWJpZCA6IFtpbWdEYXRhLCAuLi4uXVxyXG4gICAgY29uc3QgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgbGV0IHRvdGFsTnVtT2ZIYXJtZnVsV2FpdGluZ0ltZyA9IDA7XHJcbiAgICB1cGRhdGVEQihyZXNwb25zZURhdGEpO1xyXG5cclxuICAgIGZvciAoY29uc3QgW3VybCwgaW1nRGF0YV0gb2YgQ3NCYXRjaEZvcldhaXRpbmcpIHtcclxuICAgICAgICBpZiAocmVzcG9uc2VEYXRhLmhhcyh1cmxbMV0pKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGltZ1Jlc0RhdGEgPSByZXNwb25zZURhdGEuZ2V0KHVybFsxXSk7XHJcbiAgICAgICAgICAgIGxldCBmcmFtZXM7XHJcbiAgICAgICAgICAgIGltZ0RhdGEuc3RhdHVzID0gaW1nUmVzRGF0YS5zdGF0dXM7XHJcbiAgICAgICAgICAgIGltZ0RhdGEuaGFybWZ1bCA9IGltZ1Jlc0RhdGEuaGFybWZ1bDtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbWdSZXNEYXRhLmhhcm1mdWwpIHtcclxuICAgICAgICAgICAgICAgIGlmKCFudW1PZkhhcm1mdWxJbWdJblBhZ2VNYXAuaGFzKHVybFswXSkpe1xyXG4gICAgICAgICAgICAgICAgICAgIG51bU9mSGFybWZ1bEltZ0luUGFnZU1hcC5zZXQodXJsWzBdLDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgIG51bU9mSGFybWZ1bEltZ0luUGFnZU1hcC5zZXQodXJsWzBdLCBudW1PZkhhcm1mdWxJbWdJblBhZ2VNYXAuZ2V0KHVybFswXSkrMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghcmVhZHlUb1NlbmQuZ2V0KGltZ0RhdGEudGFiSWQpKSB7XHJcbiAgICAgICAgICAgICAgICBmcmFtZXMgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgICAgICAgICBmcmFtZXMuc2V0KGltZ0RhdGEuZnJhbWVJZCwgW2ltZ0RhdGFdKTtcclxuICAgICAgICAgICAgICAgIHJlYWR5VG9TZW5kLnNldChpbWdEYXRhLnRhYklkLCBmcmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZyYW1lcyA9IHJlYWR5VG9TZW5kLmdldChpbWdEYXRhLnRhYklkKTtcclxuICAgICAgICAgICAgICAgIGlmICghZnJhbWVzLmdldChpbWdEYXRhLmZyYW1lSWQpKSBmcmFtZXMuc2V0KGltZ0RhdGEuZnJhbWVJZCwgW2ltZ0RhdGFdKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgZnJhbWVzLmdldChpbWdEYXRhLmZyYW1lSWQpLnB1c2goaW1nRGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIENzQmF0Y2hGb3JXYWl0aW5nLmRlbGV0ZSh1cmwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHNlbmRXYWl0aW5nQ3NEYXRhVG9DcyhyZWFkeVRvU2VuZCk7Ly8udGhlbihyZXMgPT4geyBjb25zb2xlLmxvZyhcInJlc3BvbnNlIHN0YXR1cyhXYWl0aW5nQ3NEYXRhIFNlbmRlZCk6IFwiLCByZXMpOyB9KWNvbnRlbnRzY3JpcHTsmYAgcnVudGltZW1lc3NhZ2Ug6rWQ7IugXHJcbiAgICBjaGVja1RpbWVBbmRSZWZldGNoKCk7XHJcbiAgICBcclxuICAgIGZvcihjb25zdCBbcGFnZVVybCwgY291bnRdIG9mIG51bU9mSGFybWZ1bEltZ0luUGFnZU1hcCkge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coXCJwYWdlQ291bnRJbmZvXFxuXCIrcGFnZVVybCsnXFxuJytjb3VudCk7XHJcbiAgICAgICAgYXdhaXQgc2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbihwYWdlVXJsLGNvdW50KTsvL211dHVhbCBleGNsdXNpb27roZwg7J247ZWcIGF3YWl0LiDrgpjspJHsl5Ag6rO17JygIHByb21pc2Xrpbwg7IOd7ISx7ZW07IScIOyEnOu5hOyKpOybjOy7pOyXkOyEnCDquLDri6TrpqzripQg7J287J20IOyXhuqyjCDrp4zrk6Qg7IiY64+EIOyeiOydjFxyXG4gICAgICAgIHRvdGFsTnVtT2ZIYXJtZnVsV2FpdGluZ0ltZys9IGNvdW50O1xyXG4gICAgfVxyXG4gICBhZGRUb3RhbE51bU9mSGFybWZ1bEltZyh0b3RhbE51bU9mSGFybWZ1bFdhaXRpbmdJbWcpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKFwi7ZiE7J6sIOq4sOuLpOumrOqzoCDsnojripQgY29udGVudDogXCIgKyBDc0JhdGNoRm9yV2FpdGluZy5zaXplKTtcclxufVxyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNlbmRXYWl0aW5nQ3NEYXRhVG9DcyhyZWFkeURhdGEpIHtcclxuICAgIGxldCBzZW5kRGF0YTtcclxuICAgIGxldCBzZW5kRGF0YU9uZTtcclxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gICAgZm9yIChjb25zdCB0YWJJZCBvZiByZWFkeURhdGEua2V5cygpKSB7XHJcbiAgICAgICAgc2VuZERhdGEgPSByZWFkeURhdGEuZ2V0KHRhYklkKTtcclxuICAgICAgICBmb3IgKGNvbnN0IGZyYW1lSWQgb2Ygc2VuZERhdGEua2V5cygpKSB7XHJcbiAgICAgICAgICAgIHNlbmREYXRhT25lID0gc2VuZERhdGEuZ2V0KGZyYW1lSWQpO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGF3YWl0IGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYklkLFxyXG4gICAgICAgICAgICAgICAgICAgIHsgdHlwZTogXCJpbWdEYXRhV2FpdGluZ0Zyb21TZXJ2aWNlV29ya1wiLCBkYXRhOiBzZW5kRGF0YU9uZSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZnJhbWVJZCB9XHJcbiAgICAgICAgICAgICAgICApKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlLm1lc3NhZ2UuaW5jbHVkZXMoJ0NvdWxkIG5vdCBlc3RhYmxpc2ggY29ubmVjdGlvbicpKSBjb25zb2xlLmVycm9yKFwiY29udGVudHNjcmlwdCDsnZHri7Ug7Jik66WYW3R5cGU6IHdhdGluZyBkYXRhXTogXCIsIGUpOy8vUmVjZWl2aW5nIGVuZCBkb2VzIG5vdCBleGlzdCDihpIg7J6g7IucIO2bhCDsnqzsi5zrj4RcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhcImNvbnRlbnRzY3JpcHQg7J2R64u1IOqysOqzvFt0eXBlOiB3YXRpbmcgZGF0YV1cIik7XHJcbiAgICByZXN1bHQuZm9yRWFjaChyZXMgPT4geyBjb25zb2xlLmxvZyhyZXMpOyB9KTtcclxuICAgIGNvbnNvbGUubG9nKFwi7LSdIOyImOufiTogXCIsIHJlc3VsdC5sZW5ndGgpO1xyXG5cclxuICB9XHJcblxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIlxyXG5pbXBvcnQgKiBhcyBpbmRleERiIGZyb20gJy4vbW9kdWxlcy9pbmRleERiLmpzJztcclxuaW1wb3J0IHsgQ3NCYXRjaEZvcldhaXRpbmcsIHNldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUgfSBmcm9tICcuL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzJztcclxuaW1wb3J0IHsgZmV0Y2hCYXRjaCB9IGZyb20gJy4vbW9kdWxlcy9yZXF1ZXN0SW1nQW5hbHl6ZS5qcyc7XHJcbmltcG9ydCB7c2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbiwgaW5pdE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb259IGZyb20gJy4vdXRpbHMvYmFja2dyb3VuZFV0aWxzLmpzJ1xyXG5cclxuY29uc3QgY3VycmVudFRhYnMgPSBuZXcgTWFwKCk7XHJcbmNvbnN0IGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdCA9IG5ldyBNYXAoKTtcclxuY29uc3QgcmV0cnlUaHJlc2hvbGQgPSAxNSAqIDEwMDA7XHJcblxyXG5cclxuXHJcbmNvbnN0IGNvbnRleHRDb250cm9sTWVudSA9IHtcclxuICAnSW1nU2hvdyc6ICfsnbTrr7jsp4Ag67O07J206riwJyxcclxuICAnSW1nSGlkZSc6ICfsnbTrr7jsp4Ag6rCQ7LaU6riwJyxcclxufVxyXG5cclxubGV0IGNsaWNrZWRJbWdTcmMgPSBudWxsO1xyXG5sZXQgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IHRydWU7XHJcbmxldCBzdG9yZWRJbnRlcmNlcHRvclN0YXR1cyA9IG51bGw7XHJcbi8vXHJcbmxldCB0b3RhbGltZyA9IDA7XHJcbmxldCBpbnRlcmNlcHRvclNpdGUgPSBudWxsO1xyXG5sZXQgdG90YWxOdW1PZkhhcm1mdWxJbWc7XHJcblxyXG5cclxuXHJcbi8v7LSI6riw7ZmUIOy9lOuTnFxyXG4vL+u5hOuPmeq4sCDspIDruYQg7J6R7JeF7J20IOyZhOujjOuQmOyWtOyVvCDri6TsnYwg7L2U65Oc66W8IOyLpO2Wie2VoCDsiJgg7J6I64qUIO2UhOuhnOuniOydtOyKpCDqsJ3ssrQocmVzb2x2ZWTqsIAg67CY7ZmY65CY7Ja07JW8IO2VqCkuIO2VqOyImCDsnpDssrTripQg67CU66GcIOyLpO2WiVxyXG5sZXQgUHJvbWlzZUZvckluaXQgPSBpbmRleERiLmluaXRJbmRleERiKCk7XHJcblxyXG5mdW5jdGlvbiBnZXRQYWdlVXJsRnJvbVRhYklkKHRhYklkKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xyXG4gICAgY2hyb21lLnRhYnMuZ2V0KHRhYklkLCAodGFiKSA9PiB7XHJcbiAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgZWxzZSByZXNvbHZlKHRhYi51cmwpO1xyXG4gICAgfSk7XHJcbiAgfSlcclxufVxyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNoZWNrQ3NEYXRhKHRhYklkLCBmcmFtZUlkLCBiYXRjaCkge1xyXG4gIFxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBQcm9taXNlRm9ySW5pdDsgLy9kYiBpbml0IO2UhOuhnOuvuOyKpCDquLDri6TrprwuIFxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBwYWdlVXJsID0gYXdhaXQgZ2V0UGFnZVVybEZyb21UYWJJZCh0YWJJZCkudGhlbihwYWdlVXJsPT5wYWdlVXJsKS5jYXRjaChlcnI9Pntjb25zb2xlLmVycm9yKGVycik7fSk7ICBcclxuICBcclxuICBjb25zdCBDc0JhdGNoRm9yREJBZGQgPSBbXTtcclxuICBcclxuICBsZXQgbnVtT2ZIYXJtZnVsSW1nID0gMDtcclxuICBcclxuICBsZXQgY3NCYXRjaEZvclJlc3BvbnNlID0gYXdhaXQgUHJvbWlzZS5hbGwoXHJcbiAgICBcclxuICAgIGJhdGNoLm1hcChhc3luYyAoaXRlbSkgPT4ge1xyXG4gICAgICBjb25zdCB0eCA9IGluZGV4RGIuREIudHJhbnNhY3Rpb24oJ2ltZ1VSTCcsICdyZWFkd3JpdGUnKTtcclxuICAgICAgY29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnaW1nVVJMJyk7XHJcbiAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgIGlmIChpbmRleERiLmtleVNldC5oYXMoaXRlbS51cmwpKSB7XHJcbiAgICAgICAgICBcclxuXHJcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IGluZGV4RGIucmVxVGFibGVQcm9taXNlKHN0b3JlLmdldChpdGVtLnVybCkpLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInRhYmxl7JeQ7IScIGtleSDsobDtmoztlZjqs6AgdmFsdWUg6rCA7KC47Jik64qUIOykkeyXkCBFcnJvciDrsJzsg506XCIsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgaWYgKCF2YWx1ZS5yZXNwb25zZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuuNsOydtO2EsCDrsqDsnbTsiqTsl5Ag7J6I7KeA66eMIOydkeuLteydhCDrsJvsp4Ag66q77ZWcICBpbWcgaWQ6IFwiICsgaXRlbS5pZCk7XHJcbiAgICAgICAgICAgIGlmIChyZXRyeVRocmVzaG9sZCA8IChEYXRlLm5vdygpIC0gdmFsdWUuc2F2ZVRpbWUpKSB7XHJcbiAgICAgICAgICAgICAgQ3NCYXRjaEZvckRCQWRkLnB1c2goaXRlbSk7IC8v64SI66y0IOyYpOueq+uPmeyViCDsnZHri7XsnYQg64yA6riw7ZWY6rOgIOyeiOuKlCDrjbDsnbTthLDsmIDri6TrqbQsIOyerOyalOyyrSDrsLDsuZjsl5Ag7LaU6rCAXHJcbiAgICAgICAgICAgICAgdmFsdWUuc2F2ZVRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICAgIGF3YWl0IGluZGV4RGIucmVxVGFibGVQcm9taXNlKHN0b3JlLnB1dCh2YWx1ZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGl0ZW0udGFiSWQgPSB0YWJJZDtcclxuICAgICAgICAgICAgaXRlbS5mcmFtZUlkID0gZnJhbWVJZDtcclxuICAgICAgICAgICAgQ3NCYXRjaEZvcldhaXRpbmcuc2V0KFtwYWdlVXJsLGl0ZW0udXJsXSwgaXRlbSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLrjbDsnbTthLAg67Kg7J207Iqk7JeQIOyeiOuKlCBpbWcgaWQ6IFwiICsgaXRlbS5pZCArIFwi7IOB7YOcL+ycoO2VtC/snZHri7U6IFwiICsgdmFsdWUuc3RhdHVzICsgXCImXCIgKyB2YWx1ZS5oYXJtZnVsICsgXCImXCIgKyB2YWx1ZS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zdGF0dXMpIHtcclxuICAgICAgICAgICAgICBpdGVtLnN0YXR1cyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgaWYgKHZhbHVlLmhhcm1mdWwpIHtcclxuICAgICAgICAgICAgICAgIG51bU9mSGFybWZ1bEltZysrO1xyXG4gICAgICAgICAgICAgICAgaXRlbS5oYXJtZnVsID0gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwi642w7J207YSwIOuyoOydtOyKpOyXkCDsl4bripQgaW1nIGlkOiBcIiArIGl0ZW0uaWQpO1xyXG4gICAgICAgICAgY29uc3QgY2FjaENoZWNrID0gYXdhaXQgY2FjaGVzLm1hdGNoKGl0ZW0udXJsKTtcclxuXHJcbiAgICAgICAgICBpZiAoY2FjaENoZWNrKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY2FjaCDtmZXsnbgg6rKw6rO8LCDsnbzsuZjtlZjripQgdXJs7J6I7J2MXCIpO1xyXG4gICAgICAgICAgICAvL+2YhOyerCDsnbQg67aA67aE7J20IOygnOuMgOuhnCDrj5nsnpHtlZjripTsp4AsIOycoO2aqOyEseydtCDsnojripTsp4Ag7J6YIOuqqOultOqyoOydjC4gXHJcbiAgICAgICAgICAgIC8v66eM7JW97JeQIGNhY2jqsIAg7KG07J6s7ZWc64uk66m0IGRi7JeQIO2VtOuLuSDsnbTrr7jsp4Ag642w7J207YSwIOy2lOqwgCwg6re466as6rOgIFxyXG4gICAgICAgICAgICAvL2NzQmF0Y2hGb3JSZXNwb25zZeyXkOuPhCDstpTqsIBcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgaW5kZXhEYi5rZXlTZXQuYWRkKGl0ZW0udXJsKTtcclxuICAgICAgICAgICAgLy/rjbDsnbTthLAg7JeG7J2MLiBEQiDstpTqsIDtlZjqs6AgZmV0Y2hcclxuXHJcblxyXG4gICAgICAgICAgICBpdGVtLnRhYklkID0gdGFiSWQ7XHJcbiAgICAgICAgICAgIGl0ZW0uZnJhbWVJZCA9IGZyYW1lSWQ7XHJcbiAgICAgICAgICAgIENzQmF0Y2hGb3JXYWl0aW5nLnNldChbcGFnZVVybCxpdGVtLnVybF0sIGl0ZW0pOyAvL2ZldGNo7ZWgIOuNsOydtO2EsOuPhCDqsrDqta0gcmVzcG9uc2UgPSBmYWxzZeyduCDrjbDsnbTthLDsmYAg7ZWo6ruYIGNzYmF0Y2hmb3J3YWl0aW5n7JeQ7IScIOq4sOuLpOumvFxyXG5cclxuICAgICAgICAgICAgQ3NCYXRjaEZvckRCQWRkLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwi7J2066+47KeAIOu5hOq1kOykkSDsl5Drn6w6IFwiLCBlLCBcIlxcblVSTDogXCIsIGl0ZW0udXJsKTtcclxuICAgICAgfVxyXG4gICAgfSkpO1xyXG5cclxuICBpZiAoQ3NCYXRjaEZvckRCQWRkPy5sZW5ndGggIT0gMCkge1xyXG5cclxuICAgIGNvbnN0IHR4ID0gaW5kZXhEYi5EQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgY29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnaW1nVVJMJyk7XHJcblxyXG4gICAgQ3NCYXRjaEZvckRCQWRkLmZvckVhY2goaW1nZGF0YSA9PiB7XHJcbiAgICAgIHN0b3JlLnB1dChcclxuICAgICAgICB7XHJcbiAgICAgICAgICB1cmw6IGltZ2RhdGEudXJsLFxyXG4gICAgICAgICAgZG9tYWluOiAobmV3IFVSTChpbWdkYXRhLnVybCkpLmhvc3RuYW1lLnJlcGxhY2UoL153d3dcXC4vLCAnJyksLy/siJjsoJXsmIjsoJUsXHJcbiAgICAgICAgICByZXNwb25zZTogZmFsc2UsXHJcbiAgICAgICAgICBzdGF0dXM6IGZhbHNlLCAgIC8vIOqygOyCrOyZhOujjFxyXG4gICAgICAgICAgaGFybWZ1bDogZmFsc2UsICAgLy8g6riw67O46rCSXHJcbiAgICAgICAgICBzYXZlVGltZTogRGF0ZS5ub3coKVxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZldGNoQmF0Y2goQ3NCYXRjaEZvckRCQWRkLCB0YWJJZCk7XHJcbiAgICAvL2RiIOy2lOqwgO2WiOycvOuLiCBmZXRjaC5cclxuICB9XHJcblxyXG4gIC8vY29uc29sZS5sb2coXCJwYWdlQ291bnRJbmZvXFxuXCIrcGFnZVVybCsnXFxuJytudW1PZkhhcm1mdWxJbWcpO1xyXG4gIHNldE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24ocGFnZVVybCwgbnVtT2ZIYXJtZnVsSW1nKTtcclxuXHJcblxyXG4gIC8vY29uc3QgZGVsYXkgPSBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwKSk7XHJcblxyXG4gIGNzQmF0Y2hGb3JSZXNwb25zZSA9IGNzQmF0Y2hGb3JSZXNwb25zZS5maWx0ZXIoeCA9PiB4ICE9PSB1bmRlZmluZWQpO1xyXG4gIGNvbnNvbGUubG9nKCdSZWNlaXZpbmcgIHJlcXVlc3Q6JywgYmF0Y2gpO1xyXG4gIGNvbnNvbGUubG9nKCdTZW5kaW5nIHJlc3BvbnNlOicsIGNzQmF0Y2hGb3JSZXNwb25zZSk7XHJcbiAgcmV0dXJuIGNzQmF0Y2hGb3JSZXNwb25zZTsgLy/rsJvsnYAg67Cw7LmYIOykkeyXkOyEnCDrsJTroZwg7J2R64u17ZWgIOydtOuvuOyngCDqsJ3ssrTrp4wg64Sj7Ja07IScIHJldHVyblxyXG59XHJcblxyXG5cclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9ldmVudCBsaXN0ZXIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8v7L2Y7YWQ7LigIOyKpO2BrOumve2KuCDrpqzsiqTrhIhcclxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xyXG4gIGlmIChtZXNzYWdlLnNvdXJjZSA9PT0gXCJjb250ZW50XCIpIHtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBzd2l0Y2ggKG1lc3NhZ2U/LnR5cGUpIHtcclxuXHJcbiAgICAgICAgY2FzZSBcImltZ0RhdGFGcm9tQ29udGVudFNjcmlwdFwiOlxyXG4gICAgICAgICAgY2hlY2tDc0RhdGEoc2VuZGVyPy50YWI/LmlkLCBzZW5kZXI/LmZyYW1lSWQsIG1lc3NhZ2UuZGF0YSkudGhlbihiYXRjaEZyb21TY3JpcHQgPT4ge1xyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2Uoe1xyXG4gICAgICAgICAgICAgIHR5cGU6IFwicmVzcG9uc2VcIixcclxuICAgICAgICAgICAgICBkYXRhOiBiYXRjaEZyb21TY3JpcHQsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgY2FzZSBcInJlZ2lzdGVyX2ZyYW1lXCI6XHJcbiAgICAgICAgICBpZiAoIWN1cnJlbnRUYWJzLmdldChzZW5kZXI/LnRhYj8uaWQpKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRUYWJzLnNldChzZW5kZXI/LnRhYj8uaWQsIFtzZW5kZXI/LmZyYW1lSWRdKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRUYWJzLmdldChzZW5kZXI/LnRhYj8uaWQpLmluY2x1ZGVzKHNlbmRlcj8uZnJhbWVJZCkpIHtcclxuICAgICAgICAgICAgICBjdXJyZW50VGFicy5nZXQoc2VuZGVyPy50YWI/LmlkKS5wdXNoKHNlbmRlcj8uZnJhbWVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBnZXRQYWdlVXJsRnJvbVRhYklkKHNlbmRlcj8udGFiPy5pZCkudGhlbihwYWdlVXJsPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBhZ2VVcmwpO1xyXG4gICAgICAgICAgICBpbml0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbihwYWdlVXJsKTtcclxuICAgICAgICAgIH0pLmNhdGNoKGVycj0+e2NvbnNvbGUuZXJyb3IoZXJyKTt9KTtcclxuXHJcbiAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogdHJ1ZSB9KTtcclxuICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICBjYXNlIFwiaW1hZ2VDbGlja2VkXCI6XHJcbiAgICAgICAgICBpZiAobWVzc2FnZS5pbWdTcmMpIHtcclxuICAgICAgICAgICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLnJlbW92ZUFsbCgoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xyXG4gICAgICAgICAgICAgICAgICBpZDogJ21haW5Db250cm9sTWVudScsXHJcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAnSW1hZ2VJbnRlcmNlcHRvciAtIOycoO2VtCDsnbTrr7jsp4Ag7LCo64uoIO2UhOuhnOq3uOueqCcsXHJcbiAgICAgICAgICAgICAgICAgIGNvbnRleHRzOiBbJ2FsbCddXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFttZW51SWQsIG1lbnVUaXRsZV0gb2YgT2JqZWN0LmVudHJpZXMoY29udGV4dENvbnRyb2xNZW51KSkge1xyXG4gICAgICAgICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IG1lbnVJZCxcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRJZDogJ21haW5Db250cm9sTWVudScsXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IG1lbnVUaXRsZSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncmFkaW8nLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHRzOiBbJ2FsbCddXHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFjb250cm9sTWVudUltZ1N0YXR1c0xpc3QuaGFzKG1lc3NhZ2UuaW1nU3JjKSkge1xyXG4gICAgICAgICAgICAgICAgICBjb250cm9sTWVudUltZ1N0YXR1c0xpc3Quc2V0KG1lc3NhZ2UuaW1nU3JjLCBtZXNzYWdlLmlzU2hvdyA9PT0gdHJ1ZSA/ICdJbWdTaG93JyA6ICdJbWdIaWRlJyk7XHJcbiAgICAgICAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKG1lc3NhZ2UuaXNTaG93ID09PSB0cnVlID8gJ0ltZ1Nob3cnIDogJ0ltZ0hpZGUnLCB7IGNoZWNrZWQ6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibmV3IGltZ1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCBhbm90aGVySXRlbVN0YXR1cyA9IGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5nZXQobWVzc2FnZS5pbWdTcmMpID09PSAnSW1nU2hvdycgPyAnSW1nSGlkZScgOiAnSW1nU2hvdyc7XHJcbiAgICAgICAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5nZXQobWVzc2FnZS5pbWdTcmMpID09PSAnSW1nU2hvdycgPyAnSW1nU2hvdycgOiAnSW1nSGlkZScsIHsgY2hlY2tlZDogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaW1nIOyhtOyerDogXCIgKyBtZXNzYWdlLmltZ1NyYyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY2xpY2tlZEltZ1NyYyA9IG1lc3NhZ2UuaW1nU3JjO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgY2FzZSBcImNoZWNrX2JsYWNrX2xpc3RcIjpcclxuICAgICAgICAgIGxldCBpc0luQmxhY2tMaXN0ID0gZmFsc2U7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJjZXB0b3JTaXRlLmhhcyhtZXNzYWdlLnNpdGUpKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0U2l0ZSA9IGludGVyY2VwdG9yU2l0ZS5nZXQobWVzc2FnZS5zaXRlKTtcclxuICAgICAgICAgICAgICBpZiAoIXRhcmdldFNpdGVbXCJhY3RpdmVcIl0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7ZeI7Jqp65CY7KeAIOyViuydgCDsgqzsnbTtirhcIik7XHJcbiAgICAgICAgICAgICAgICBpc0luQmxhY2tMaXN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0U2l0ZVtcInBhZ2VcIl0uaW5jbHVkZXMobWVzc2FnZS5wYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIu2XiOyaqeuQmOyngCDslYrsnYAg7Y6Y7J207KeAXCIpO1xyXG4gICAgICAgICAgICAgICAgICBpc0luQmxhY2tMaXN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcclxuICAgICAgICAgICAgICBvazogdHJ1ZSxcclxuICAgICAgICAgICAgICByZXN1bHQ6IGlzSW5CbGFja0xpc3RcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2Uoe1xyXG4gICAgICAgICAgICAgIG9rOiBmYWxzZSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuXHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuXHJcblxyXG5cclxuY2hyb21lLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoYXN5bmMgKCkgPT4ge1xyXG5cclxuICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XHJcbiAgICBpZDogJ21haW5Db250cm9sTWVudScsXHJcbiAgICB0aXRsZTogJ0ltYWdlSW50ZXJjZXB0b3IgLSDsnKDtlbQg7J2066+47KeAIOywqOuLqCDtlITroZzqt7jrnqgnLFxyXG4gICAgY29udGV4dHM6IFsnYWxsJ11cclxuICB9KTtcclxuXHJcbiAgZm9yIChjb25zdCBbbWVudUlkLCBtZW51VGl0bGVdIG9mIE9iamVjdC5lbnRyaWVzKGNvbnRleHRDb250cm9sTWVudSkpIHtcclxuICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcclxuICAgICAgaWQ6IG1lbnVJZCxcclxuICAgICAgcGFyZW50SWQ6ICdtYWluQ29udHJvbE1lbnUnLFxyXG4gICAgICB0aXRsZTogbWVudVRpdGxlLFxyXG4gICAgICB0eXBlOiAncmFkaW8nLFxyXG4gICAgICBjb250ZXh0czogWydhbGwnXVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHN0b3JlZEludGVyY2VwdG9yU3RhdHVzID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnaW50ZXJjZXB0b3JTdGF0dXMnXSk7XHJcbiAgbGV0IHNhdmVkU3RhdHVzID0gc3RvcmVkSW50ZXJjZXB0b3JTdGF0dXMuaW50ZXJjZXB0b3JTdGF0dXM7XHJcbiAgaWYgKHNhdmVkU3RhdHVzID09PSB1bmRlZmluZWQpIHtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdpbnRlcmNlcHRvclN0YXR1cyc6IDEgfSk7XHJcbiAgICBzYXZlZFN0YXR1cyA9IDE7XHJcbiAgfVxyXG4gIGlzSW50ZXJjZXB0b3JBY3RpdmUgPSBzYXZlZFN0YXR1cyA9PT0gMSA/IHRydWUgOiBmYWxzZTtcclxuICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZSgnbWFpbkNvbnRyb2xNZW51JywgeyBlbmFibGVkOiBpc0ludGVyY2VwdG9yQWN0aXZlIH0pO1xyXG5cclxuXHJcbiAgY29uc3Qgc3RvcmVkSW50ZXJjZXB0b3JTaXRlID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnaW50ZXJjZXB0b3JTaXRlJ10pO1xyXG4gIGlmIChzdG9yZWRJbnRlcmNlcHRvclNpdGUgPT09IHVuZGVmaW5lZCB8fCBzdG9yZWRJbnRlcmNlcHRvclNpdGUuaW50ZXJjZXB0b3JTaXRlID09PSB1bmRlZmluZWQpIHtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdpbnRlcmNlcHRvclNpdGUnOiB7fSB9KTtcclxuICAgIGludGVyY2VwdG9yU2l0ZSA9IG5ldyBNYXAoKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBpbnRlcmNlcHRvclNpdGUgPSBuZXcgTWFwKE9iamVjdC5lbnRyaWVzKHN0b3JlZEludGVyY2VwdG9yU2l0ZS5pbnRlcmNlcHRvclNpdGUpKTtcclxuICB9ICBcclxuXHJcbiAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsndG90YWxOdW1PZkhhcm1mdWxJbWcnXSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgaWYgKCFyZXN1bHQudG90YWxOdW1PZkhhcm1mdWxJbWcpIHtcclxuICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ3RvdGFsTnVtT2ZIYXJtZnVsSW1nJzogMCB9KTt9XHJcbiAgfSk7XHJcblxyXG5cclxuICBjb25zdCBzdG9yZWRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnZmlsdGVyaW5nU3RlcCddKS50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAnZmlsdGVyaW5nU3RlcCc6IDEgfSk7XHJcbiAgICBsZXQgdmFsdWUgPSByZXN1bHQuZmlsdGVyaW5nU3RlcDtcclxuICAgIGlmICh2YWx1ZT09PXVuZGVmaW5lZCkge1xyXG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAnZmlsdGVyaW5nU3RlcCc6IDEgfSk7XHJcbiAgICAgIHZhbHVlID0gMTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9KTtcclxuICBzZXRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlKHN0b3JlZEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUpO1xyXG4gIHJldHVybiB0cnVlO1xyXG59KTtcclxuXHJcblxyXG5jaHJvbWUuY29udGV4dE1lbnVzLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcigoaXRlbSwgdGFiKSA9PiB7XHJcblxyXG4gIGlmIChjbGlja2VkSW1nU3JjID09PSBudWxsKSB7XHJcbiAgICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZSgnSW1nU2hvdycsIHsgY2hlY2tlZDogdHJ1ZSB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNvbnRyb2xJZCA9IGl0ZW0ubWVudUl0ZW1JZDtcclxuICBjb25zdCBpbWdJbmZvID0geyB0YWJJZDogdGFiLmlkLCBmcmFtZUlkOiBpdGVtLmZyYW1lSWQsIHVybDogaXRlbS5zcmNVcmwgfTtcclxuXHJcbiAgY29uc29sZS5sb2coXCLsu6jthY3siqTtirgg7YG066atXCIpO1xyXG4gIGlmIChjb250cm9sSWQgPT09IGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5nZXQoY2xpY2tlZEltZ1NyYykpIHJldHVybjtcclxuXHJcblxyXG4gIHRyeSB7XHJcbiAgICAvL+y2lOu2gCBwcm9taXNl7LaU6rCAXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGltZ0luZm8udGFiSWQsIHtcclxuICAgICAgc291cmNlOiBcInNlcnZpY2Vfd29ya2VyXCIsXHJcbiAgICAgIHR5cGU6ICdjb250cm9sX2ltZycsXHJcbiAgICAgIGlzU2hvdzogY29udHJvbElkID09PSAnSW1nU2hvdycgPyB0cnVlIDogZmFsc2VcclxuICAgIH0sIHsgZnJhbWVJZDogaW1nSW5mby5mcmFtZUlkIH0pO1xyXG5cclxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UubWVzc2FnZSk7XHJcbiAgICAgIC8vdGhyb3cgbmV3IEVycm9yKHJlc3BvbnNlLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5zZXQoY2xpY2tlZEltZ1NyYywgY29udHJvbElkKTtcclxuICAgIGNsaWNrZWRJbWdTcmMgPSBudWxsO1xyXG5cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgaWYgKCFlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCdDb3VsZCBub3QgZXN0YWJsaXNoIGNvbm5lY3Rpb24nKSkgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZSgnSW1nU2hvdycsIHsgY2hlY2tlZDogdHJ1ZSB9KTtcclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcblxyXG59KTtcclxuXHJcblxyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFjdGl2ZUludGVyY2VwdG9yKGZsYWcpIHtcclxuICBjb25zdCByZXN1bHQgPSB7IG9rOiB0cnVlLCBtZXNzYWdlOiBbXSB9O1xyXG5cclxuICBmb3IgKGNvbnN0IFt0YWJJZCwgZnJhbWVzXSBvZiBjdXJyZW50VGFicykge1xyXG4gICAgaWYgKCFmcmFtZXMpIGNvbnRpbnVlO1xyXG5cclxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwge1xyXG4gICAgICAgICAgc291cmNlOiBcInNlcnZpY2Vfd29ya2VyXCIsXHJcbiAgICAgICAgICB0eXBlOiAnYWN0aXZlX2ludGVyY2VwdG9yJyxcclxuICAgICAgICAgIGFjdGl2ZTogZmxhZ1xyXG4gICAgICAgIH0sIHsgZnJhbWVJZDogZnJhbWUgfSk7XHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgcmVzdWx0Lm9rID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2gocmVzcG9uc2UubWVzc2FnZSk7XHJcblxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmICghZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnQ291bGQgbm90IGVzdGFibGlzaCBjb25uZWN0aW9uJykpIHJlc3VsdC5vayA9IGZhbHNlO1xyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2goZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0RmlsdGVyU3RhdHVzKGZsYWcpIHtcclxuICBjb25zdCByZXN1bHQgPSB7IG9rOiB0cnVlLCBtZXNzYWdlOiBbXSB9O1xyXG5cclxuICBmb3IgKGNvbnN0IFt0YWJJZCwgZnJhbWVzXSBvZiBjdXJyZW50VGFicykge1xyXG4gICAgaWYgKCFmcmFtZXMpIGNvbnRpbnVlO1xyXG5cclxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwge1xyXG4gICAgICAgICAgc291cmNlOiBcInNlcnZpY2Vfd29ya2VyXCIsXHJcbiAgICAgICAgICB0eXBlOiAnc2V0X2ZpbHRlcl9zdGF0dXMnLFxyXG4gICAgICAgICAgRmlsdGVyU3RhdHVzOiBmbGFnXHJcbiAgICAgICAgfSwgeyBmcmFtZUlkOiBmcmFtZSB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgcmVzdWx0Lm9rID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2gocmVzcG9uc2UubWVzc2FnZSk7XHJcblxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmICghZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnQ291bGQgbm90IGVzdGFibGlzaCBjb25uZWN0aW9uJykpIHJlc3VsdC5vayA9IGZhbHNlO1xyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2goZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLy/tjJ3sl4Ug66as7Iqk64SIXHJcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICBpZiAobWVzc2FnZS5zb3VyY2UgPT09IFwicG9wdXBcIikge1xyXG4gICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsZXQgcmVzcG9uc2VTdGF0dXMgPSB0cnVlO1xyXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgICAgICBjYXNlIFwiYWN0aXZlX2ludGVyY2VwdG9yXCI6XHJcbiAgICAgICAgICAgIHJlc3BvbnNlU3RhdHVzID0gYXdhaXQgYWN0aXZlSW50ZXJjZXB0b3IobWVzc2FnZS5hY3RpdmUpO1xyXG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlU3RhdHVzLm9rKSBjb25zb2xlLmVycm9yKHJlc3BvbnNlU3RhdHVzLm9rKTtcclxuICAgICAgICAgICAgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IG1lc3NhZ2UuYWN0aXZlO1xyXG4gICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZSgnbWFpbkNvbnRyb2xNZW51JywgeyBlbmFibGVkOiBpc0ludGVyY2VwdG9yQWN0aXZlID8gdHJ1ZSA6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogcmVzcG9uc2VTdGF0dXMub2sgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGNhc2UgXCJzZXRfZmlsdGVyX3N0YXR1c1wiOlxyXG4gICAgICAgICAgICByZXNwb25zZVN0YXR1cyA9IGF3YWl0IHNldEZpbHRlclN0YXR1cyhtZXNzYWdlLkZpbHRlclN0YXR1cyk7XHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2VTdGF0dXMub2spIGNvbnNvbGUuZXJyb3IocmVzcG9uc2VTdGF0dXMubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiByZXNwb25zZVN0YXR1cy5vayB9KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlIFwicG9wdXBfZXJyb3JcIjpcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZnJvbSBwb3B1cDogXCIgKyBtZXNzYWdlLmVycm9yKTtcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbiBub3QgcmVhZCBwb3B1cCBtZXNzYWdlIHR5cGVcIik7XHJcbiAgICAgICAgICBjYXNlIFwic3luY19ibGFja19saXN0XCI6XHJcbiAgICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgICBpbnRlcmNlcHRvclNpdGUuc2V0KG1lc3NhZ2Uucm9vdEluc3RhbmNlWzBdLCBtZXNzYWdlLnJvb3RJbnN0YW5jZVsxXSk7XHJcbiAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU2l0ZSc6IE9iamVjdC5mcm9tRW50cmllcyhpbnRlcmNlcHRvclNpdGUpIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlIFwic2V0X2ZpbHRlcmluZ19zdGVwXCI6XHJcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJpbmdTdGVwJzogbWVzc2FnZS52YWx1ZSB9KTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZS52YWx1ZSk7XHJcbiAgICAgICAgICAgIHNldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUobWVzc2FnZS52YWx1ZSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IGZhbHNlIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59KTtcclxuXHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==