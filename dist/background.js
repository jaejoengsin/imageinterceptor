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
      res = await fetch("https://image-interceptor-develop-683857194699.asia-northeast3.run.app", {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQSx1Q0FBdUMsZ0NBQWdDO0FBQ3ZFO0FBQ0EsWUFBWSx5RkFBNEI7QUFDeEM7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBLHVCQUF1QixXQUFXO0FBQ2xDO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxDQUFDO0FBQ0QiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvbW9kdWxlcy9pbmRleERiLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvbW9kdWxlcy9yZXF1ZXN0SW1nQW5hbHl6ZS5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL2JhY2tncm91bmRVdGlscy5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL3Byb3BhZ2F0ZS5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9iYWNrZ3JvdW5kLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxyXG4vL2lucHV0IGRhdGEgPT4gW3NpdGV1cmwsIGltZ3VybF0gOntpbWdNZXRhRGF0YX1cclxuZXhwb3J0IGNvbnN0IENzQmF0Y2hGb3JXYWl0aW5nID0gbmV3IE1hcCgpOyBcclxuXHJcbi8vZGVmYXVsdCA9IDFcclxubGV0IGN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWU7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSh2YWx1ZSkge1xyXG4gIGN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUgPSB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWU7XHJcbn0iLCJleHBvcnQgbGV0IERCID0gbnVsbDtcclxuZXhwb3J0IGxldCBrZXlTZXQgPSBudWxsO1xyXG5leHBvcnQgbGV0IGtleVNldExvYWRlZCA9IGZhbHNlO1xyXG5cclxuXHJcblxyXG5leHBvcnQgIGFzeW5jIGZ1bmN0aW9uIGluaXRJbmRleERiKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBkZWxldGVJbWFnZVVybERCKCk7Ly/rgpjspJHsl5Ag7IKt7KCc7ZW07JW8IO2VqC4g7ISc67mE7IqkIOybjOy7pCDstIjquLDtmZTtlZjrqbQg66y07KGw6rG0IOq4sOyhtCBkYiDsgq3soJxcclxuICAgICAgICBEQiA9IGF3YWl0IG9wZW5JbWFnZVVybERCKCk7XHJcbiAgICAgICAgYXdhaXQgbG9hZEtleVNldChEQik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJkYuuhnOuTnOyZhOujjFwiKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLshJzruYTsiqTsm4zsu6Qg7LSI6riw7ZmUIC0gZGIg66Gc65OcIOuwjyDtgqTshYsg66Gc65OcIOykkeyXkCDsl5Drn6wg67Cc7IOdOlwiICsgZSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZXJyb3Igd2hpbGUgbG9hZGluZyBkYiBvciBrZXlzZXQgXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcblxyXG4vKlxyXG5yZXNvbHZlKHZhbHVlKVxyXG46IOyekeyXheydtCDshLHqs7XtlojsnYQg65WMIFByb21pc2XsnZgg7IOB7YOc66W8ICfsnbTtlokoZnVsZmlsbGVkKScg7IOB7YOc66GcIOyghO2ZmOyLnO2CpOqzoCwg6rKw6rO866W8IHZhbHVl66GcIOyghOuLrO2VqeuLiOuLpC4g7ZW064u5IOqwkuydgFxyXG4udGhlbigp7J2YIOyyqyDrsojsp7gg7L2c67CxLCDruYTrj5nquLDsoIHsnLzroZwg7Iuk7ZaJXHJcbnJlamVjdChyZWFzb24pXHJcbjog7J6R7JeF7J20IOyLpO2MqO2WiOydhCDrlYwgUHJvbWlzZeydmCDsg4Htg5zrpbwgJ+qxsOu2gChyZWplY3RlZCknIOyDge2DnOuhnCDsoITtmZjsi5ztgqTqs6AsIOyXkOufrCjsnbTsnKAp66W8IHJlYXNvbuycvOuhnCDsoITri6ztlanri4jri6QuXHJcbu2VtOuLuSDqsJLsnYAgLmNhdGNoKCkg65iQ64qUIC50aGVuKCwgKSDrkZAg67KI7Ke4IOy9nOuwsSwg67mE64+Z6riw7KCB7Jy866GcIOyLpO2WiVxyXG4qL1xyXG5leHBvcnQgZnVuY3Rpb24gb3BlbkltYWdlVXJsREIoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIC8vaW1hZ2VVcmxEQuuKlCBkYuydtOumhC4g66eM7JW9IOyhtOyerO2VmOyngCDslYrsnLzrqbQg7IOd7ISxLCDsobTsnqztlZjrqbQg7ZW064u5IGRi66W8IOyXtOydjCBcclxuICAgICAgICAvL+uRkOuyiOynuCDsnbjsnpDsnbggMeydgCDrjbDsnbTthLAg67Kg7J207IqkIOuyhOyghC4g66eM7JW97JeQIGRi6rCAIOydtCDqsJLrs7Tri6Qg67KE7KCE7J20IOuCruuLpOuptCDsl4Xqt7jroIjsnbTrk5wg7J2067Kk7Yq46rCAIOuwnOyDneuQqC4ob251cGdyYWRlbmVlZGVkKVxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSBpbmRleGVkREIub3BlbignaW1hZ2VVcmxEQicsIDEpO1xyXG4gICAgICAgIC8v7JeF6re466CI7J2065Oc6rCAIOuwnOyDne2VoCDqsr3smrAg7J2067Kk7Yq4IO2VuOuTpOufrOyXkOyEnCDsi6TtlontlaAg7L2c67CxIO2VqOyImCDsoJXsnZhcclxuICAgICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBvcGVuIOyalOyyreycvOuhnCDsl7TrpqzqsbDrgpgg7IOd7ISx65CcIOuNsOydtO2EsOuyoOydtOyKpChJREJEYXRhYmFzZSkg6rCd7LK0LiBcclxuICAgICAgICAgICAgLy/snbQg6rCd7LK066GcIG9iamVjdFN0b3JlKO2FjOydtOu4lCDqsJnsnYAg6rCc64WQKeulvCDrp4zrk6TqsbDrgpgg7IKt7KCc7ZWY64qUIOuTsSDrjbDsnbTthLDrsqDsnbTsiqTsnZgg7Iqk7YKk66eI66W8IOyhsOyeke2VoCDsiJgg7J6I7J2MXHJcbiAgICAgICAgICAgIC8vIG9iamVjdFN0b3Jl7J2AIOydvOyiheydmCBcIu2FjOydtOu4lFwiIOqwnOuFkOydtOupsCDqtIDqs4TtmJVEQuydmCDthYzsnbTruJTrs7Tri6Qg7J6Q7Jyg66Gc7Jq0IO2Yle2DnOuhnCwg7J6Q67CU7Iqk7YGs66a97Yq4IOqwneyytCDri6jsnITroZwgXHJcbiAgICAgICAgICAgIC8v642w7J207YSw66W8IOyggOyepe2VoCDsiJgg7J6I7J2MXHJcbiAgICAgICAgICAgIC8va2V5UGF0aOuKlCDsoIDsnqXtlZjripQg6rCBIOqwneyytOyXkOyEnCDquLDrs7jtgqTroZwg7IKs7Jqp7ZWgIOyGjeyEsSDsnbTrpoRcclxuICAgICAgICAgICAgY29uc3QgZGIgPSBldmVudC50YXJnZXQucmVzdWx0O1xyXG4gICAgICAgICAgICAvLyBpbWFnZXMgb2JqZWN0U3RvcmUg7IOd7ISxLCBrZXlQYXRo64qUIGNhbm9uaWNhbFVybOuhnCFcclxuXHJcbiAgICAgICAgICAgIGlmICghZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygnaW1nVVJMJykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZSgnaW1nVVJMJywgeyBrZXlQYXRoOiAndXJsJyB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7IC8vIHByb21pc2UgdmFsdWXsl5AgZGIg7J247Iqk7YS07IqkIOuwmO2ZmOqwkiDsoIDsnqVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpOyAvLyBwcm9taXNlIHJlYXNvbuyXkCBldmVudC50YXJnZXQuZXJyb3Ig7KCA7J6lXHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlSW1hZ2VVcmxEQigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgLy8gSW5kZXhlZERC7J2YIGRlbGV0ZURhdGFiYXNlIOuplOyEnOuTnOulvCDsgqzsmqntlZjsl6wg642w7J207YSw67Kg7J207Iqk66W8IOyCreygnO2VqeuLiOuLpC5cclxuICAgICAgICBjb25zdCByZXF1ZXN0ID0gaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKCdpbWFnZVVybERCJyk7XHJcblxyXG4gICAgICAgIC8vIOyCreygnCDshLHqs7Ug7IucIO2YuOy2nOuQmOuKlCDsnbTrsqTtirgg7ZW465Ok65+sXHJcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfrjbDsnbTthLDrsqDsnbTsiqTqsIAg7ISx6rO17KCB7Jy866GcIOyCreygnOuQmOyXiOyKteuLiOuLpC4nKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIOyCreygnCDsi6TtjKgg7IucIO2YuOy2nOuQmOuKlCDsnbTrsqTtirgg7ZW465Ok65+sXHJcbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHJlamVjdCgn642w7J207YSw67Kg7J207IqkIOyCreygnCDsmKTrpZg6JywgZXZlbnQudGFyZ2V0LmVycm9yKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyDrjbDsnbTthLDrsqDsnbTsiqTqsIAg64uk66W4IO2DreyXkOyEnCDsl7TroKQg7J6I7Ja0IOyCreygnOqwgCDssKjri6jrkKAg65WMIO2YuOy2nOuQmOuKlCDsnbTrsqTtirgg7ZW465Ok65+sXHJcbiAgICAgICAgcmVxdWVzdC5vbmJsb2NrZWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign642w7J207YSw67Kg7J207Iqk6rCAIOuLpOuluCDsl7DqsrDsl5Ag7J2Y7ZW0IOywqOuLqOuQmOyXiOyKteuLiOuLpC4nKTtcclxuICAgICAgICAgICAgcmVqZWN0KCfrjbDsnbTthLDrsqDsnbTsiqTqsIAg64uk66W4IOyXsOqysOyXkCDsnZjtlbQg7LCo64uo65CY7JeI7Iq164uI64ukLicpO1xyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsS2V5c1Byb21pc2Uoc3RvcmUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVxID0gc3RvcmUuZ2V0QWxsS2V5cygpO1xyXG4gICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSAoZSkgPT4gcmVzb2x2ZShlLnRhcmdldC5yZXN1bHQpOyAvLyDrsLDsl7Qg67CY7ZmYIVxyXG4gICAgICAgIHJlcS5vbmVycm9yID0gKGUpID0+IHJlamVjdChlLnRhcmdldC5lcnJvcik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkS2V5U2V0KCkge1xyXG4gICAgY29uc3QgdHggPSBEQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWRvbmx5Jyk7XHJcbiAgICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuICAgIC8vIOydtOuvuCDsoIDsnqXrkJwg66qo65OgIGNhbm9uaWNhbFVybOydhCDtlZzrsojsl5Ag7KGw7ZqMICjrjIDrn4kg7LKY66asIOyLnCDtmqjsnKjsoIEpXHJcbiAgICBjb25zdCBleGlzdGluZ0tleXMgPSBhd2FpdCBnZXRBbGxLZXlzUHJvbWlzZShzdG9yZSk7XHJcbiAgICAvLyDsnbTrr7gg7KG07J6s7ZWY64qU7KeAIFNldOycvOuhnCDqtIDrpqwo6rKA7IOJIOu5oOumhClcclxuICAgIGtleVNldCA9IG5ldyBTZXQoZXhpc3RpbmdLZXlzKTtcclxuICAgIGNvbnNvbGUubG9nKGtleVNldC5zaXplKTtcclxuICAgIGtleVNldExvYWRlZCA9IHRydWU7XHJcbn1cclxuXHJcbi8qKuOEuFxyXG4gKiBcclxuICogQHBhcmFtIHtPYmplY3R9IHRhYmxlTWV0aG9kUmVzdWx0IHRhYmxl7JeQIGdldCxwdXQg65OxIOu5hOuPmeq4sCDsmpTssq3snZgg67CY7ZmY6rCSICBcclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVxVGFibGVQcm9taXNlKHRhYmxlTWV0aG9kUmVzdWx0KSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRhYmxlTWV0aG9kUmVzdWx0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWJsZU1ldGhvZFJlc3VsdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVEQihyZXNwb25zZURhdGEpIHtcclxuICAgIGNvbnN0IHR4ID0gREIudHJhbnNhY3Rpb24oJ2ltZ1VSTCcsICdyZWFkd3JpdGUnKTtcclxuICAgIGNvbnN0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ2ltZ1VSTCcpO1xyXG5cclxuICAgIGZvciAoY29uc3QgW3VybCwgaW1nUmVzRGF0YV0gb2YgcmVzcG9uc2VEYXRhKSB7XHJcbiAgICAgICAgbGV0IGRiVmFsdWUgPSBhd2FpdCByZXFUYWJsZVByb21pc2Uoc3RvcmUuZ2V0KHVybCkpLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwidGFibGXsl5DshJwga2V5IOyhsO2ajO2VmOqzoCB2YWx1ZSDqsIDsoLjsmKTripQg7KSR7JeQIEVycm9yIOuwnOyDnTpcIiwgZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRiVmFsdWUucmVzcG9uc2UgPSBpbWdSZXNEYXRhLnJlc3BvbnNlO1xyXG4gICAgICAgIGRiVmFsdWUuc3RhdHVzID0gaW1nUmVzRGF0YS5zdGF0dXM7XHJcbiAgICAgICAgZGJWYWx1ZS5oYXJtZnVsID0gaW1nUmVzRGF0YS5oYXJtZnVsO1xyXG4gICAgICAgIGF3YWl0IHJlcVRhYmxlUHJvbWlzZShzdG9yZS5wdXQoZGJWYWx1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vdHgg7JmE66OMIOq4sOuLrOumtCDtlYTsmpQgeD8uLi5cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgcHJvcGFnYXRlUmVzQm9keURhdGF9IGZyb20gJy4uL3V0aWxzL3Byb3BhZ2F0ZS5qcyc7XHJcbmltcG9ydCB7REIsIHJlcVRhYmxlUHJvbWlzZX0gZnJvbSAnLi9pbmRleERiLmpzJztcclxuaW1wb3J0IHsgQ3NCYXRjaEZvcldhaXRpbmcsIGdldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUgfSBmcm9tICcuLi9nbG9iYWwvYmFja2dyb3VuZENvbmZpZy5qcyc7XHJcblxyXG5jb25zdCByZXRyeVRocmVzaG9sZCA9IDE1ICogMTAwMDtcclxuXHJcbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaEJhdGNoKENzSW1nRGF0YSwgdGFiSWQpIHtcclxuXHJcbi8vICAgY29uc29sZS5sb2coXCJmZXRjaGRhdGE6XCIgKyBDc0ltZ0RhdGEubGVuZ3RoKTtcclxuXHJcbi8vICAgbGV0IENzSW1nRGF0YUZvckZldGNoID0gbnVsbDtcclxuLy8gICB0cnkge1xyXG4vLyAgICAgY29uc3QgdGFiID0gYXdhaXQgY2hyb21lLnRhYnMuZ2V0KHRhYklkKTtcclxuLy8gICAgIGNvbnN0IHJlZmVyZXJVcmwgPSB0YWIudXJsO1xyXG5cclxuLy8gICAgIENzSW1nRGF0YUZvckZldGNoID0gYXdhaXQgUHJvbWlzZS5hbGwoXHJcbi8vICAgICAgIENzSW1nRGF0YS5tYXAoYXN5bmMgaW1nZGF0YSA9PiB7XHJcbi8vICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZldGNoQW5kUmV0dXJuQmFzZTY0SW1nKGltZ2RhdGEudXJsLCByZWZlcmVyVXJsKTtcclxuLy8gICAgICAgICByZXR1cm4ge1xyXG4vLyAgICAgICAgICAgdXJsOiBpbWdkYXRhLnVybCxcclxuLy8gICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXHJcbi8vICAgICAgICAgICBzdGF0dXM6IGltZ2RhdGEuc3RhdHVzLFxyXG4vLyAgICAgICAgICAgaGFybWZ1bDogaW1nZGF0YS5oYXJtZnVsXHJcbi8vICAgICAgICAgfTtcclxuLy8gICAgICAgfSlcclxuLy8gICAgICk7XHJcblxyXG4vLyAgIH0gY2F0Y2ggKGVycikge1xyXG4vLyAgICAgY29uc29sZS5lcnJvcihcIuydtOuvuOyngCDsi6TsoJwg642w7J207YSwIGZldGNoIOqzvOyglSDspJEg7JeQ65+sIOuwnOyDnTogXCIsIGVycik7XHJcbi8vICAgfVxyXG5cclxuLy8gICBjb25zdCBib2R5RGF0YSA9IEpTT04uc3RyaW5naWZ5KHsgZGF0YTogQ3NJbWdEYXRhRm9yRmV0Y2ggfSk7XHJcblxyXG4vLyAgIHRyeSB7XHJcblxyXG4vLyAgICAgY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuLy8gICAgIGNvbnNvbGUubG9nKFwiZmV0Y2ghOiBcIiwgQ3NJbWdEYXRhRm9yRmV0Y2gubGVuZ3RoKTtcclxuLy8gICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9pbWFnZS1pbnRlcmNlcHRvci10ZXN0LTY4Mzg1NzE5NDY5OS5hc2lhLW5vcnRoZWFzdDMucnVuLmFwcFwiLCB7XHJcbi8vICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbi8vICAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuLy8gICAgICAgYm9keTogYm9keURhdGFcclxuLy8gICAgIH0pO1xyXG5cclxuLy8gICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoXCLshJzrsoQg7J2R64u1IOyYpOulmFwiKTsvLyBjYXRjaOuhnCDsnbTrj5lcclxuLy8gICAgIGNvbnNvbGUubG9nKGByZXNwb25zZSBkZWxheXRpbWU6ICR7KHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpIC8gMTAwMH1gKTtcclxuXHJcbi8vICAgICBjb25zdCByZXNwb25zZUJvZHlEYXRhID0gYXdhaXQgcmVzLmpzb24oKT8udGhlbihyZXN1bHQgPT4geyByZXR1cm4gcmVzdWx0Py5kYXRhPy5pbWFnZXMgfSk7XHJcbi8vICAgICBpZiAocmVzcG9uc2VCb2R5RGF0YS5sZW5ndGggPiAwKSB7XHJcbi8vICAgICAgIHByb3BhZ2F0ZVJlc0JvZHlEYXRhKG5ldyBNYXAocmVzcG9uc2VCb2R5RGF0YS5tYXAoKGVsKSA9PiB7XHJcbi8vICAgICAgICAgcmV0dXJuIFtlbC51cmwsIHsgdXJsOiBlbC51cmwsIHJlc3BvbnNlOiB0cnVlLCBzdGF0dXM6IGVsLnN0YXR1cywgaGFybWZ1bDogZWwuaGFybWZ1bCB9XTtcclxuLy8gICAgICAgfSkpKTtcclxuLy8gICAgIH0gZWxzZSBjb25zb2xlLmxvZyhcImNhdXNlIC0gZmV0Y2ggcmVzcG9uc2U6IGJvZHlkYXRhIOyXhuydjFwiKTtcclxuLy8gICB9IGNhdGNoIChlcnIpIHtcclxuLy8gICAgIGNvbnNvbGUuZXJyb3IoXHJcbi8vICAgICAgIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXHJcbi8vICAgICAgICAgPyBgSlNPTiBwYXJzaW5nIGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbi8vICAgICAgICAgOiBgUmVxdWVzdCBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9YFxyXG4vLyAgICAgKTtcclxuLy8gICB9XHJcbi8vIH1cclxuXHJcblxyXG4vLy8vL+yLpO2XmCDtlajsiJhcclxuLy8gQmxvYuydhCBCYXNlNjQg66y47J6Q7Je066GcIOuzgO2ZmO2VmOuKlCDtl6ztjbwg7ZWo7IiYXHJcbiBmdW5jdGlvbiBibG9iVG9CYXNlNjQoYmxvYikge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoYmxvYik7IC8vIEJsb2LsnYQg7J297Ja0IEJhc2U2NCDrjbDsnbTthLAgVVJJ66GcIOuzgO2ZmCDsi5zsnpFcclxuICAgIHJlYWRlci5vbmxvYWRlbmQgPSAoKSA9PiB7XHJcbiAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdCk7IC8vIOuzgO2ZmCDsmYTro4wg7IucIEJhc2U2NCDrrLjsnpDsl7Qg67CY7ZmYXHJcbiAgICB9O1xyXG4gICAgcmVhZGVyLm9uZXJyb3IgPSAoZXJyb3IpID0+IHtcclxuICAgICAgICByZWplY3QoZXJyb3IpOyAvLyDsl5Drn6wg67Cc7IOdIOyLnCDqsbDrtoBcclxuICAgIH07XHJcbiAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuLy8vLy9cclxuIGFzeW5jIGZ1bmN0aW9uIGZldGNoQW5kUmV0dXJuQmFzZTY0SW1nKHVybCwgcmVmZXJlclVybCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIHRyeSB7XHJcblxyXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnUmVmZXJlcic6IHJlZmVyZXJVcmxcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCByZXNCbG9iID0gYXdhaXQgcmVzLmJsb2IoKTtcclxuICAgICAgY29uc3QgQmFzZTY0ID0gYXdhaXQgYmxvYlRvQmFzZTY0KHJlc0Jsb2IpLnRoZW4ocmVzTm90RmlsdGVyZCA9PiB7IHJldHVybiByZXNOb3RGaWx0ZXJkLnNwbGl0KCcsJylbMV07IH0pO1xyXG4gICAgICByZXR1cm4gcmVzb2x2ZShCYXNlNjQpO1xyXG5cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcblxyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgIH07XHJcblxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBmZXRjaEFuZFJldHVybkJsb2JJbWcodXJsLCByZWZlcmVyVXJsKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIHRyeSB7XHJcblxyXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnUmVmZXJlcic6IHJlZmVyZXJVcmxcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCByZXNCbG9iID0gYXdhaXQgcmVzLmJsb2IoKTtcclxuICAgICAgcmV0dXJuIHJlc29sdmUocmVzQmxvYik7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuXHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgfTtcclxuXHJcbiAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrVGltZUFuZFJlZmV0Y2goKSB7XHJcbiAgY29uc3QgcmVGZXRjaERhdGEgPSBuZXcgTWFwKCk7XHJcblxyXG4gIGNvbnN0IHR4ID0gREIudHJhbnNhY3Rpb24oJ2ltZ1VSTCcsICdyZWFkd3JpdGUnKTtcclxuICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuXHJcbiAgZm9yIChjb25zdCBbdXJsLCBpbWdEYXRhXSBvZiBDc0JhdGNoRm9yV2FpdGluZykge1xyXG4gICAgXHJcbiAgICBsZXQgZGJWYWx1ZSA9IGF3YWl0IHJlcVRhYmxlUHJvbWlzZShzdG9yZS5nZXQodXJsWzFdKSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwidGFibGXsl5DshJwga2V5IOyhsO2ajO2VmOqzoCB2YWx1ZSDqsIDsoLjsmKTripQg7KSR7JeQIEVycm9yIOuwnOyDnTpcIiwgZXJyb3IpO1xyXG4gICAgfSk7XHJcbiAgICBpZiAocmV0cnlUaHJlc2hvbGQgPCAoRGF0ZS5ub3coKSAtIGRiVmFsdWUuc2F2ZVRpbWUpKSB7XHJcbiAgICAgIGlmICghcmVGZXRjaERhdGEuZ2V0KGltZ0RhdGEudGFiSWQpKSB7XHJcbiAgICAgICAgcmVGZXRjaERhdGEuc2V0KGltZ0RhdGEudGFiSWQsIFtpbWdEYXRhXSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmVGZXRjaERhdGEuZ2V0KGltZ0RhdGEudGFiSWQpLnB1c2goaW1nRGF0YSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRiVmFsdWUuc2F2ZVRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICBhd2FpdCByZXFUYWJsZVByb21pc2Uoc3RvcmUucHV0KGRiVmFsdWUpKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZvciAoY29uc3QgW3RhYklkLCBpbWdEYXRhQXJyXSBvZiByZUZldGNoRGF0YSkge1xyXG4gICAgZmV0Y2hCYXRjaChpbWdEYXRhQXJyLCB0YWJJZCk7XHJcbiAgfVxyXG4gIGF3YWl0IHR4LmRvbmU/LigpO1xyXG5cclxufVxyXG5cclxuLy9jcmVhdGVJbWFnZUJpdG1hcOycvOuhnCDsp4Dsm5Ag7JWI7ZWY64qUIOydtOuvuOyngDogc3ZnXHJcbi8vaW1hZ2Ug6rCd7LK066W8IOyDneyEse2VtOyEnCDsmrDtmozsoIHsnLzroZwg7ZW06rKw7ZW07JW8IO2VqC4g6re465+s64KYIOu5hOycoO2VtCDsnbTrr7jsp4Ag7ZWE7YSw7JeQ7IScIO2VtOuLuSDsnKDtmJXsnZgg7J2066+47KeA66W8IOuvuOumrCDqsbjrn6zrgrwg7JiI7KCV7J206riwIOuVjOusuOyXkCDtmITsnqwg7IiY7KCVIOyViO2VnCDsg4Htg5xcclxuYXN5bmMgZnVuY3Rpb24gcmVzaXplQW5kU2VuZEJsb2IoYmxvYiwgd2lkdGgsIGhlaWdodCkge1xyXG4gICAgLy8gQmxvYuydhCBJbWFnZUJpdG1hcOycvOuhnCDrs4DtmZhcclxuICAgIGNvbnN0IGltYWdlQml0bWFwID0gYXdhaXQgY3JlYXRlSW1hZ2VCaXRtYXAoYmxvYik7XHJcblxyXG4gICAgLy8gT2Zmc2NyZWVuQ2FudmFzIOyDneyEsVxyXG4gICAgY29uc3Qgb2Zmc2NyZWVuID0gbmV3IE9mZnNjcmVlbkNhbnZhcyh3aWR0aCwgaGVpZ2h0KTtcclxuICAgIGNvbnN0IGN0eCA9IG9mZnNjcmVlbi5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgIC8vIOy6lOuyhOyKpOyXkCDqt7jrpqzquLBcclxuICAgIGN0eC5kcmF3SW1hZ2UoaW1hZ2VCaXRtYXAsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgIC8vIEJsb2LsnLzroZwg67OA7ZmYXHJcbiAgICBjb25zdCByZXNpemVkQmxvYiA9IGF3YWl0IG9mZnNjcmVlbi5jb252ZXJ0VG9CbG9iKHtcclxuICAgICAgICB0eXBlOiAnaW1hZ2Uvd2ViUCcsXHJcbiAgICAgICAgcXVhbGl0eTogMC45NVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHJlc2l6ZWRCbG9iO1xyXG4gIH1cclxuXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hCYXRjaChDc0ltZ0RhdGEsIHRhYklkKSB7XHJcblxyXG4gIC8vbGV0IENzSW1nRGF0YUZvckZldGNoID0gbnVsbDtcclxuICBsZXQgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICBsZXQgdGFiVXJsO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWUudGFicy5nZXQodGFiSWQpO1xyXG4gICAgdGFiVXJsID0gdGFiLnVybDtcclxuXHJcbiAgICAvLyBDc0ltZ0RhdGFGb3JGZXRjaCA9IGF3YWl0IFByb21pc2UuYWxsKFxyXG4gICAgLy8gICBDc0ltZ0RhdGEubWFwKGFzeW5jIGltZ2RhdGEgPT4ge1xyXG4gICAgLy8gICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmZXRjaEFuZFJldHVybkJhc2U2NEltZyhpbWdkYXRhLnVybCwgcmVmZXJlclVybCk7XHJcbiAgICAvLyAgICAgcmV0dXJuIHtcclxuICAgIC8vICAgICAgIHVybDogaW1nZGF0YS51cmwsXHJcbiAgICAvLyAgICAgICBjb250ZW50OiBjb250ZW50LFxyXG4gICAgLy8gICAgICAgc3RhdHVzOiBpbWdkYXRhLnN0YXR1cyxcclxuICAgIC8vICAgICAgIGhhcm1mdWw6IGltZ2RhdGEuaGFybWZ1bFxyXG4gICAgLy8gICAgIH07XHJcbiAgICAvLyAgIH0pXHJcbiAgICAvLyApO1xyXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoXHJcbiAgICAgIENzSW1nRGF0YS5tYXAoYXN5bmMgaW1nZGF0YSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW1nQmxvYiA9IGF3YWl0IGZldGNoQW5kUmV0dXJuQmxvYkltZyhpbWdkYXRhLnVybCwgdGFiVXJsKTtcclxuICAgICAgICBsZXQgcmVzaXplZEltZ0Jsb2I7XHJcblxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgIHJlc2l6ZWRJbWdCbG9iID0gYXdhaXQgcmVzaXplQW5kU2VuZEJsb2IoaW1nQmxvYiwgMjI0LCAyMjQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaChlcnIpe1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwifCByZXNpemXqs7zsoJXsl5DshJwg7Jik66WYIOuwnOyDnSBcIisgZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW1nTWV0YUpzb24gPSBKU09OLnN0cmluZ2lmeShcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdXJsOiBpbWdkYXRhLnVybCxcclxuICAgICAgICAgICAgc3RhdHVzOiBpbWdkYXRhLnN0YXR1cyxcclxuICAgICAgICAgICAgaGFybWZ1bDogaW1nZGF0YS5oYXJtZnVsLFxyXG4gICAgICAgICAgICBsZXZlbDogZ2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSgpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ltYWdlcycsIHJlc2l6ZWRJbWdCbG9iKTtcclxuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ltZ01ldGEnLCBpbWdNZXRhSnNvbik7XHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJib2R5IGRhdGEg7LKY66asIOuwjyDspIDruYQg6rO87KCVIOykkSDsl5Drn6wg67Cc7IOdOlwiLCBlcnIpO1xyXG4gIH1cclxuXHJcbiAgLy9jb25zdCBib2R5RGF0YSA9IEpTT04uc3RyaW5naWZ5KHsgZGF0YTogQ3NJbWdEYXRhRm9yRmV0Y2ggfSk7XHJcblxyXG4gIHRyeSB7XHJcblxyXG4gICAgY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgIGNvbnNvbGUubG9nKGA8LS1mZXRjaCEtLT5cXG4gdG90YWw6ICR7Q3NJbWdEYXRhLmxlbmd0aH1cXG5sZXZlbDoke2dldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoKSB9YCk7XHJcbiAgICBsZXQgcmVzO1xyXG4gICAgaWYgKHRhYlVybC5pbmNsdWRlcyhcInlvdXR1YmUuY29tXCIpICl7XHJcbiAgICAgIHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9pbWFnZS1pbnRlcmNlcHRvci15b3V0dWJlLTY4Mzg1NzE5NDY5OS5hc2lhLW5vcnRoZWFzdDMucnVuLmFwcFwiLCB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBib2R5OiBmb3JtRGF0YVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vaW1hZ2UtaW50ZXJjZXB0b3ItZGV2ZWxvcC02ODM4NTcxOTQ2OTkuYXNpYS1ub3J0aGVhc3QzLnJ1bi5hcHBcIiwge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgYm9keTogZm9ybURhdGFcclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihcIuyEnOuyhCDsnZHri7Ug7Jik66WYXCIpOy8vIGNhdGNo66GcIOydtOuPmVxyXG4gICAgY29uc29sZS5sb2coYHJlc3BvbnNlIGRlbGF5dGltZTogJHsocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLyAxMDAwfWApO1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlQm9keURhdGEgPSBhd2FpdCByZXMuanNvbigpPy50aGVuKHJlc3VsdCA9PiB7IHJldHVybiByZXN1bHQ/LmltYWdlIH0pO1xyXG4gICAgaWYgKHJlc3BvbnNlQm9keURhdGEubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgY29uc3QgcHJvY2Vzc2VkUmVzQm9keURhdGEgPSBuZXcgTWFwKHJlc3BvbnNlQm9keURhdGEubWFwKChlbCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbZWwudXJsLCB7IHVybDogZWwudXJsLCByZXNwb25zZTogdHJ1ZSwgc3RhdHVzOiBlbC5zdGF0dXMsIGhhcm1mdWw6IGVsLmhhcm1mdWwgfV07XHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICAgIHByb3BhZ2F0ZVJlc0JvZHlEYXRhKHByb2Nlc3NlZFJlc0JvZHlEYXRhKTtcclxuXHJcbiAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiY2F1c2UgLSBmZXRjaCByZXNwb25zZTogYm9keWRhdGEg7JeG7J2MXCIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcclxuICAgICAgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcclxuICAgICAgICA/IGBKU09OIHBhcnNpbmcgZmFpbGVkOiAke2Vyci5tZXNzYWdlfWBcclxuICAgICAgICA6IGBSZXF1ZXN0IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gUkVRVUVTVCBEQVRBXHJcbi8vIFtcclxuLy8gICB7XHJcbi8vICAgICBjYW5vbmljYWxVcmw6IGl0ZW0uY2Fub25pY2FsVXJsLFxyXG4vLyAgICAgICB1cmw6IGl0ZW0udXJsLFxyXG4vLyAgICAgICAgIHN0YXR1czogZmFsc2UsXHJcbi8vICAgICAgICAgICBoYXJtZnVsOiBmYWxzZVxyXG4vLyAgIH1cclxuLy8gXVxyXG4vLyBSRVNQT05TRSBEQVRBIGV4YW1wbGVcclxuLy8ge1xyXG4vLyAgICAgXCJkYXRhXCI6IFtcclxuLy8gICAgICAgICB7XHJcbi8vICAgICAgICAgICAgIFwiY2Fub25pY2FsVXJsXCI6IFwiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9wYWdlYWQvMXAtdXNlci1saXN0Lzk2Mjk4NTY1Ni8/YmFja2VuZD1pbm5lcnR1YmUmY25hbWU9MSZjdmVyPTJfMjAyNTA4MDcmZGF0YT1iYWNrZW5kJTNEaW5uZXJ0dWJlJTNCY25hbWUlM0QxJTNCY3ZlciUzRDJfMjAyNTA4MDclM0JlbCUzRGFkdW5pdCUzQnB0eXBlJTNEZl9hZHZpZXclM0J0eXBlJTNEdmlldyUzQnV0dWlkJTNEdGR6OUxXTk5RS1VnNFhwbWFfNDBVZyUzQnV0dmlkJTNENEJ5SjB6M1VNTkUmaXNfdnRjPTAmcHR5cGU9Zl9hZHZpZXcmcmFuZG9tPTQyODc2NjQ5NiZ1dHVpZD10ZHo5TFdOTlFLVWc0WHBtYV80MFVnXCIsXHJcbi8vICAgICAgICAgICAgIFwidXJsXCI6IFwiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9wYWdlYWQvMXAtdXNlci1saXN0Lzk2Mjk4NTY1Ni8/YmFja2VuZD1pbm5lcnR1YmUmY25hbWU9MSZjdmVyPTJfMjAyNTA4MDcmZGF0YT1iYWNrZW5kJTNEaW5uZXJ0dWJlJTNCY25hbWUlM0QxJTNCY3ZlciUzRDJfMjAyNTA4MDclM0JlbCUzRGFkdW5pdCUzQnB0eXBlJTNEZl9hZHZpZXclM0J0eXBlJTNEdmlldyUzQnV0dWlkJTNEdGR6OUxXTk5RS1VnNFhwbWFfNDBVZyUzQnV0dmlkJTNENEJ5SjB6M1VNTkUmaXNfdnRjPTAmcHR5cGU9Zl9hZHZpZXcmcmFuZG9tPTQyODc2NjQ5NiZ1dHVpZD10ZHo5TFdOTlFLVWc0WHBtYV80MFVnXCIsXHJcbi8vICAgICAgICAgICAgIFwic3RhdHVzXCI6IHRydWUsXHJcbi8vICAgICAgICAgICAgIFwiaGFybWZ1bFwiOiBmYWxzZSxcclxuLy8gICAgICAgICAgICAgXCJjYXRlZ29yeVwiOiBcIm1lZGljYWxcIixcclxuLy8gICAgICAgICAgICAgXCJzY29yZVwiOiAwLjQsXHJcbi8vICAgICAgICAgICAgIFwiZGV0YWlsc1wiOiB7XHJcbi8vICAgICAgICAgICAgICAgICBcImFkdWx0XCI6IDEsXHJcbi8vICAgICAgICAgICAgICAgICBcInNwb29mXCI6IDEsXHJcbi8vICAgICAgICAgICAgICAgICBcIm1lZGljYWxcIjogMixcclxuLy8gICAgICAgICAgICAgICAgIFwidmlvbGVuY2VcIjogMixcclxuLy8gICAgICAgICAgICAgICAgIFwicmFjeVwiOiAyXHJcbi8vICAgICAgICAgICAgIH0sXHJcbi8vICAgICAgICAgICAgIFwicHJvY2Vzc2VkXCI6IHRydWUsXHJcbi8vICAgICAgICAgICAgIFwiZXJyb3JcIjogZmFsc2UsXHJcbi8vICAgICAgICAgICAgIFwiZXJyb3JfbWVzc2FnZVwiOiBudWxsLFxyXG4vLyAgICAgICAgICAgICBcImVycm9yX3R5cGVcIjogbnVsbFxyXG4vLyAgICAgICAgIH1cclxuLy8gICAgIF0sXHJcbi8vICAgICBcInN1bW1hcnlcIjoge1xyXG4vLyAgICAgICAgIFwidG90YWxcIjogMSxcclxuLy8gICAgICAgICBcInByb2Nlc3NlZFwiOiAxLFxyXG4vLyAgICAgICAgIFwiaGFybWZ1bFwiOiAwLFxyXG4vLyAgICAgICAgIFwic2FmZVwiOiAxLFxyXG4vLyAgICAgICAgIFwiZXJyb3JzXCI6IDAsXHJcbi8vICAgICAgICAgXCJlcnJvcl90eXBlc1wiOiB7fVxyXG4vLyAgICAgfSxcclxuLy8gICAgIFwibWVzc2FnZVwiOiBcIuy0nSAx6rCcIOydtOuvuOyngCDspJEgMeqwnCDsspjrpqwg7JmE66OMICjrsLDsuZggQVBJIO2YuOy2nDogMe2ajOuhnCAx6rCcIOydtOuvuOyngCDrj5nsi5wg7LKY66asKVwiXHJcbi8vIH1cclxuIiwiXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbih1cmwsIG51bU9mSGFybWZ1bEltZykge1xyXG4gIGNvbnN0IHN0b3JlZERhdGEgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLmdldChbJ251bU9mSGFybWZ1bEltZ0luUGFnZSddKTtcclxuICBsZXQgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlID0gc3RvcmVkRGF0YS5udW1PZkhhcm1mdWxJbWdJblBhZ2UgfHwge307XHJcblxyXG4gIGNvbnNvbGUubG9nKG51bU9mSGFybWZ1bEltZ0luUGFnZSk7XHJcblxyXG4gIGlmICh1cmwgaW4gbnVtT2ZIYXJtZnVsSW1nSW5QYWdlKSB7XHJcbiAgICBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSArPSBudW1PZkhhcm1mdWxJbWc7XHJcbiAgfSBlbHNlIHtcclxuICAgIG51bU9mSGFybWZ1bEltZ0luUGFnZVt1cmxdID0gbnVtT2ZIYXJtZnVsSW1nO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5zZXQoeyAnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJzogbnVtT2ZIYXJtZnVsSW1nSW5QYWdlIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24odXJsKSB7XHJcbiAgICBjb25zdCBzdG9yZWREYXRhID0gYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5nZXQoWydudW1PZkhhcm1mdWxJbWdJblBhZ2UnXSk7XHJcblxyXG4gICAgIGxldCBudW1PZkhhcm1mdWxJbWdJblBhZ2UgPSBzdG9yZWREYXRhLm51bU9mSGFybWZ1bEltZ0luUGFnZSB8fCB7fTtcclxuICAgICBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA9IDA7XHJcblxyXG4gICAgICBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLnNldCh7ICdudW1PZkhhcm1mdWxJbWdJblBhZ2UnOiBudW1PZkhhcm1mdWxJbWdJblBhZ2UgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXROdW1PZkhhcm1mdWxJbWdJbnRoaXNwYWdlKHVybCkge1xyXG4gICAgY29uc3Qgc3RvcmVkRGF0YSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uZ2V0KFsnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJ10pO1xyXG4gICAgbGV0IG51bU9mSGFybWZ1bEltZ0luUGFnZSA9IHN0b3JlZERhdGEubnVtT2ZIYXJtZnVsSW1nSW5QYWdlIHx8IHt9O1xyXG5cclxuICAgIHJldHVybiBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA/IG51bU9mSGFybWZ1bEltZ0luUGFnZVt1cmxdIDogMDtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZFRvdGFsTnVtT2ZIYXJtZnVsSW1nKG51bSkge1xyXG5cclxuICAgIGNvbnN0IHRvdGFsTnVtT2ZIYXJtZnVsSW1nID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsndG90YWxOdW1PZkhhcm1mdWxJbWcnXSkudGhlbihyZXN1bHQgPT4gcmVzdWx0LnRvdGFsTnVtT2ZIYXJtZnVsSW1nKTtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7J3RvdGFsTnVtT2ZIYXJtZnVsSW1nJzoodG90YWxOdW1PZkhhcm1mdWxJbWcrIG51bSl9KTtcclxufVxyXG5cclxuIiwiXHJcbmltcG9ydCB7dXBkYXRlREIgfSBmcm9tICcuLi9tb2R1bGVzL2luZGV4RGIuanMnO1xyXG5pbXBvcnQge2NoZWNrVGltZUFuZFJlZmV0Y2h9IGZyb20gJy4uL21vZHVsZXMvcmVxdWVzdEltZ0FuYWx5emUuanMnO1xyXG5pbXBvcnQgeyBDc0JhdGNoRm9yV2FpdGluZyB9IGZyb20gJy4uL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzJztcclxuaW1wb3J0IHtzZXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uLCBhZGRUb3RhbE51bU9mSGFybWZ1bEltZ30gZnJvbSAnLi4vdXRpbHMvYmFja2dyb3VuZFV0aWxzLmpzJ1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb3BhZ2F0ZVJlc0JvZHlEYXRhKHJlc3BvbnNlRGF0YSkge1xyXG4gICAgY29uc3QgcmVhZHlUb1NlbmQgPSBuZXcgTWFwKCk7IC8vIHRhYmlkIDogW2ltZ0RhdGEsIC4uLi5dXHJcbiAgICBjb25zdCBudW1PZkhhcm1mdWxJbWdJblBhZ2VNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICBsZXQgdG90YWxOdW1PZkhhcm1mdWxXYWl0aW5nSW1nID0gMDtcclxuICAgIHVwZGF0ZURCKHJlc3BvbnNlRGF0YSk7XHJcblxyXG4gICAgZm9yIChjb25zdCBbdXJsLCBpbWdEYXRhXSBvZiBDc0JhdGNoRm9yV2FpdGluZykge1xyXG4gICAgICAgIGlmIChyZXNwb25zZURhdGEuaGFzKHVybFsxXSkpIHtcclxuICAgICAgICAgICAgY29uc3QgaW1nUmVzRGF0YSA9IHJlc3BvbnNlRGF0YS5nZXQodXJsWzFdKTtcclxuICAgICAgICAgICAgbGV0IGZyYW1lcztcclxuICAgICAgICAgICAgaW1nRGF0YS5zdGF0dXMgPSBpbWdSZXNEYXRhLnN0YXR1cztcclxuICAgICAgICAgICAgaW1nRGF0YS5oYXJtZnVsID0gaW1nUmVzRGF0YS5oYXJtZnVsO1xyXG5cclxuICAgICAgICAgICAgaWYgKGltZ1Jlc0RhdGEuaGFybWZ1bCkge1xyXG4gICAgICAgICAgICAgICAgaWYoIW51bU9mSGFybWZ1bEltZ0luUGFnZU1hcC5oYXModXJsWzBdKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwLnNldCh1cmxbMF0sMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwLnNldCh1cmxbMF0sIG51bU9mSGFybWZ1bEltZ0luUGFnZU1hcC5nZXQodXJsWzBdKSsxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFyZWFkeVRvU2VuZC5nZXQoaW1nRGF0YS50YWJJZCkpIHtcclxuICAgICAgICAgICAgICAgIGZyYW1lcyA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgICAgIGZyYW1lcy5zZXQoaW1nRGF0YS5mcmFtZUlkLCBbaW1nRGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgcmVhZHlUb1NlbmQuc2V0KGltZ0RhdGEudGFiSWQsIGZyYW1lcyk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZnJhbWVzID0gcmVhZHlUb1NlbmQuZ2V0KGltZ0RhdGEudGFiSWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmcmFtZXMuZ2V0KGltZ0RhdGEuZnJhbWVJZCkpIGZyYW1lcy5zZXQoaW1nRGF0YS5mcmFtZUlkLCBbaW1nRGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBmcmFtZXMuZ2V0KGltZ0RhdGEuZnJhbWVJZCkucHVzaChpbWdEYXRhKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgQ3NCYXRjaEZvcldhaXRpbmcuZGVsZXRlKHVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc2VuZFdhaXRpbmdDc0RhdGFUb0NzKHJlYWR5VG9TZW5kKTsvLy50aGVuKHJlcyA9PiB7IGNvbnNvbGUubG9nKFwicmVzcG9uc2Ugc3RhdHVzKFdhaXRpbmdDc0RhdGEgU2VuZGVkKTogXCIsIHJlcyk7IH0pY29udGVudHNjcmlwdOyZgCBydW50aW1lbWVzc2FnZSDqtZDsi6BcclxuICAgIGNoZWNrVGltZUFuZFJlZmV0Y2goKTtcclxuICAgIFxyXG4gICAgZm9yKGNvbnN0IFtwYWdlVXJsLCBjb3VudF0gb2YgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcInBhZ2VDb3VudEluZm9cXG5cIitwYWdlVXJsKydcXG4nK2NvdW50KTtcclxuICAgICAgICBhd2FpdCBzZXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uKHBhZ2VVcmwsY291bnQpOy8vbXV0dWFsIGV4Y2x1c2lvbuuhnCDsnbjtlZwgYXdhaXQuIOuCmOykkeyXkCDqs7XsnKAgcHJvbWlzZeulvCDsg53shLHtlbTshJwg7ISc67mE7Iqk7JuM7Luk7JeQ7IScIOq4sOuLpOumrOuKlCDsnbzsnbQg7JeG6rKMIOunjOuTpCDsiJjrj4Qg7J6I7J2MXHJcbiAgICAgICAgdG90YWxOdW1PZkhhcm1mdWxXYWl0aW5nSW1nKz0gY291bnQ7XHJcbiAgICB9XHJcbiAgIGFkZFRvdGFsTnVtT2ZIYXJtZnVsSW1nKHRvdGFsTnVtT2ZIYXJtZnVsV2FpdGluZ0ltZyk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXCLtmITsnqwg6riw64uk66as6rOgIOyeiOuKlCBjb250ZW50OiBcIiArIENzQmF0Y2hGb3JXYWl0aW5nLnNpemUpO1xyXG59XHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2VuZFdhaXRpbmdDc0RhdGFUb0NzKHJlYWR5RGF0YSkge1xyXG4gICAgbGV0IHNlbmREYXRhO1xyXG4gICAgbGV0IHNlbmREYXRhT25lO1xyXG4gICAgY29uc3QgcmVzdWx0ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IHRhYklkIG9mIHJlYWR5RGF0YS5rZXlzKCkpIHtcclxuICAgICAgICBzZW5kRGF0YSA9IHJlYWR5RGF0YS5nZXQodGFiSWQpO1xyXG4gICAgICAgIGZvciAoY29uc3QgZnJhbWVJZCBvZiBzZW5kRGF0YS5rZXlzKCkpIHtcclxuICAgICAgICAgICAgc2VuZERhdGFPbmUgPSBzZW5kRGF0YS5nZXQoZnJhbWVJZCk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYXdhaXQgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UodGFiSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiBcImltZ0RhdGFXYWl0aW5nRnJvbVNlcnZpY2VXb3JrXCIsIGRhdGE6IHNlbmREYXRhT25lIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmcmFtZUlkIH1cclxuICAgICAgICAgICAgICAgICkpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWUubWVzc2FnZS5pbmNsdWRlcygnQ291bGQgbm90IGVzdGFibGlzaCBjb25uZWN0aW9uJykpIGNvbnNvbGUuZXJyb3IoXCJjb250ZW50c2NyaXB0IOydkeuLtSDsmKTrpZhbdHlwZTogd2F0aW5nIGRhdGFdOiBcIiwgZSk7Ly9SZWNlaXZpbmcgZW5kIGRvZXMgbm90IGV4aXN0IOKGkiDsnqDsi5wg7ZuEIOyerOyLnOuPhFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnNvbGUubG9nKFwiY29udGVudHNjcmlwdCDsnZHri7Ug6rKw6rO8W3R5cGU6IHdhdGluZyBkYXRhXVwiKTtcclxuICAgIHJlc3VsdC5mb3JFYWNoKHJlcyA9PiB7IGNvbnNvbGUubG9nKHJlcyk7IH0pO1xyXG4gICAgY29uc29sZS5sb2coXCLstJ0g7IiY65+JOiBcIiwgcmVzdWx0Lmxlbmd0aCk7XHJcblxyXG4gIH1cclxuXHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiXHJcbmltcG9ydCAqIGFzIGluZGV4RGIgZnJvbSAnLi9tb2R1bGVzL2luZGV4RGIuanMnO1xyXG5pbXBvcnQgeyBDc0JhdGNoRm9yV2FpdGluZywgc2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSB9IGZyb20gJy4vZ2xvYmFsL2JhY2tncm91bmRDb25maWcuanMnO1xyXG5pbXBvcnQgeyBmZXRjaEJhdGNoIH0gZnJvbSAnLi9tb2R1bGVzL3JlcXVlc3RJbWdBbmFseXplLmpzJztcclxuaW1wb3J0IHtzZXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uLCBpbml0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbn0gZnJvbSAnLi91dGlscy9iYWNrZ3JvdW5kVXRpbHMuanMnXHJcblxyXG5jb25zdCBjdXJyZW50VGFicyA9IG5ldyBNYXAoKTtcclxuY29uc3QgY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0ID0gbmV3IE1hcCgpO1xyXG5jb25zdCByZXRyeVRocmVzaG9sZCA9IDE1ICogMTAwMDtcclxuXHJcblxyXG5cclxuY29uc3QgY29udGV4dENvbnRyb2xNZW51ID0ge1xyXG4gICdJbWdTaG93JzogJ+ydtOuvuOyngCDrs7TsnbTquLAnLFxyXG4gICdJbWdIaWRlJzogJ+ydtOuvuOyngCDqsJDstpTquLAnLFxyXG59XHJcblxyXG5sZXQgY2xpY2tlZEltZ1NyYyA9IG51bGw7XHJcbmxldCBpc0ludGVyY2VwdG9yQWN0aXZlID0gdHJ1ZTtcclxubGV0IHN0b3JlZEludGVyY2VwdG9yU3RhdHVzID0gbnVsbDtcclxuLy9cclxubGV0IHRvdGFsaW1nID0gMDtcclxubGV0IGludGVyY2VwdG9yU2l0ZSA9IG51bGw7XHJcbmxldCB0b3RhbE51bU9mSGFybWZ1bEltZztcclxuXHJcblxyXG5cclxuLy/stIjquLDtmZQg7L2U65OcXHJcbi8v67mE64+Z6riwIOykgOu5hCDsnpHsl4XsnbQg7JmE66OM65CY7Ja07JW8IOuLpOydjCDsvZTrk5zrpbwg7Iuk7ZaJ7ZWgIOyImCDsnojripQg7ZSE66Gc66eI7J207IqkIOqwneyytChyZXNvbHZlZOqwgCDrsJjtmZjrkJjslrTslbwg7ZWoKS4g7ZWo7IiYIOyekOyytOuKlCDrsJTroZwg7Iuk7ZaJXHJcbmxldCBQcm9taXNlRm9ySW5pdCA9IGluZGV4RGIuaW5pdEluZGV4RGIoKTtcclxuXHJcbmZ1bmN0aW9uIGdldFBhZ2VVcmxGcm9tVGFiSWQodGFiSWQpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiB7XHJcbiAgICBjaHJvbWUudGFicy5nZXQodGFiSWQsICh0YWIpID0+IHtcclxuICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICBlbHNlIHJlc29sdmUodGFiLnVybCk7XHJcbiAgICB9KTtcclxuICB9KVxyXG59XHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY2hlY2tDc0RhdGEodGFiSWQsIGZyYW1lSWQsIGJhdGNoKSB7XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IFByb21pc2VGb3JJbml0OyAvL2RiIGluaXQg7ZSE66Gc66+47IqkIOq4sOuLpOumvC4gXHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBhZ2VVcmwgPSBhd2FpdCBnZXRQYWdlVXJsRnJvbVRhYklkKHRhYklkKS50aGVuKHBhZ2VVcmw9PnBhZ2VVcmwpLmNhdGNoKGVycj0+e2NvbnNvbGUuZXJyb3IoZXJyKTt9KTsgIFxyXG4gIFxyXG4gIGNvbnN0IENzQmF0Y2hGb3JEQkFkZCA9IFtdO1xyXG4gIFxyXG4gIGxldCBudW1PZkhhcm1mdWxJbWcgPSAwO1xyXG4gIFxyXG4gIGxldCBjc0JhdGNoRm9yUmVzcG9uc2UgPSBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgIFxyXG4gICAgYmF0Y2gubWFwKGFzeW5jIChpdGVtKSA9PiB7XHJcbiAgICAgIGNvbnN0IHR4ID0gaW5kZXhEYi5EQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgaWYgKGluZGV4RGIua2V5U2V0LmhhcyhpdGVtLnVybCkpIHtcclxuICAgICAgICAgIFxyXG5cclxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgaW5kZXhEYi5yZXFUYWJsZVByb21pc2Uoc3RvcmUuZ2V0KGl0ZW0udXJsKSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwidGFibGXsl5DshJwga2V5IOyhsO2ajO2VmOqzoCB2YWx1ZSDqsIDsoLjsmKTripQg7KSR7JeQIEVycm9yIOuwnOyDnTpcIiwgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBpZiAoIXZhbHVlLnJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi642w7J207YSwIOuyoOydtOyKpOyXkCDsnojsp4Drp4wg7J2R64u17J2EIOuwm+yngCDrqrvtlZwgIGltZyBpZDogXCIgKyBpdGVtLmlkKTtcclxuICAgICAgICAgICAgaWYgKHJldHJ5VGhyZXNob2xkIDwgKERhdGUubm93KCkgLSB2YWx1ZS5zYXZlVGltZSkpIHtcclxuICAgICAgICAgICAgICBDc0JhdGNoRm9yREJBZGQucHVzaChpdGVtKTsgLy/rhIjrrLQg7Jik656r64+Z7JWIIOydkeuLteydhCDrjIDquLDtlZjqs6Ag7J6I64qUIOuNsOydtO2EsOyYgOuLpOuptCwg7J6s7JqU7LKtIOuwsOy5mOyXkCDstpTqsIBcclxuICAgICAgICAgICAgICB2YWx1ZS5zYXZlVGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW5kZXhEYi5yZXFUYWJsZVByb21pc2Uoc3RvcmUucHV0KHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaXRlbS50YWJJZCA9IHRhYklkO1xyXG4gICAgICAgICAgICBpdGVtLmZyYW1lSWQgPSBmcmFtZUlkO1xyXG4gICAgICAgICAgICBDc0JhdGNoRm9yV2FpdGluZy5zZXQoW3BhZ2VVcmwsaXRlbS51cmxdLCBpdGVtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuuNsOydtO2EsCDrsqDsnbTsiqTsl5Ag7J6I64qUIGltZyBpZDogXCIgKyBpdGVtLmlkICsgXCLsg4Htg5wv7Jyg7ZW0L+ydkeuLtTogXCIgKyB2YWx1ZS5zdGF0dXMgKyBcIiZcIiArIHZhbHVlLmhhcm1mdWwgKyBcIiZcIiArIHZhbHVlLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLnN0YXR1cykge1xyXG4gICAgICAgICAgICAgIGl0ZW0uc3RhdHVzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICBpZiAodmFsdWUuaGFybWZ1bCkge1xyXG4gICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nKys7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmhhcm1mdWwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coXCLrjbDsnbTthLAg67Kg7J207Iqk7JeQIOyXhuuKlCBpbWcgaWQ6IFwiICsgaXRlbS5pZCk7XHJcbiAgICAgICAgICBjb25zdCBjYWNoQ2hlY2sgPSBhd2FpdCBjYWNoZXMubWF0Y2goaXRlbS51cmwpO1xyXG5cclxuICAgICAgICAgIGlmIChjYWNoQ2hlY2spIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjYWNoIO2ZleyduCDqsrDqs7wsIOydvOy5mO2VmOuKlCB1cmzsnojsnYxcIik7XHJcbiAgICAgICAgICAgIC8v7ZiE7J6sIOydtCDrtoDrtoTsnbQg7KCc64yA66GcIOuPmeyeke2VmOuKlOyngCwg7Jyg7Zqo7ISx7J20IOyeiOuKlOyngCDsnpgg66qo66W06rKg7J2MLiBcclxuICAgICAgICAgICAgLy/rp4zslb3sl5AgY2FjaOqwgCDsobTsnqztlZzri6TrqbQgZGLsl5Ag7ZW064u5IOydtOuvuOyngCDrjbDsnbTthLAg7LaU6rCALCDqt7jrpqzqs6AgXHJcbiAgICAgICAgICAgIC8vY3NCYXRjaEZvclJlc3BvbnNl7JeQ64+EIOy2lOqwgFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBpbmRleERiLmtleVNldC5hZGQoaXRlbS51cmwpO1xyXG4gICAgICAgICAgICAvL+uNsOydtO2EsCDsl4bsnYwuIERCIOy2lOqwgO2VmOqzoCBmZXRjaFxyXG5cclxuXHJcbiAgICAgICAgICAgIGl0ZW0udGFiSWQgPSB0YWJJZDtcclxuICAgICAgICAgICAgaXRlbS5mcmFtZUlkID0gZnJhbWVJZDtcclxuICAgICAgICAgICAgQ3NCYXRjaEZvcldhaXRpbmcuc2V0KFtwYWdlVXJsLGl0ZW0udXJsXSwgaXRlbSk7IC8vZmV0Y2jtlaAg642w7J207YSw64+EIOqysOq1rSByZXNwb25zZSA9IGZhbHNl7J24IOuNsOydtO2EsOyZgCDtlajqu5ggY3NiYXRjaGZvcndhaXRpbmfsl5DshJwg6riw64uk66a8XHJcblxyXG4gICAgICAgICAgICBDc0JhdGNoRm9yREJBZGQucHVzaChpdGVtKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLsnbTrr7jsp4Ag67mE6rWQ7KSRIOyXkOufrDogXCIsIGUsIFwiXFxuVVJMOiBcIiwgaXRlbS51cmwpO1xyXG4gICAgICB9XHJcbiAgICB9KSk7XHJcblxyXG4gIGlmIChDc0JhdGNoRm9yREJBZGQ/Lmxlbmd0aCAhPSAwKSB7XHJcblxyXG4gICAgY29uc3QgdHggPSBpbmRleERiLkRCLnRyYW5zYWN0aW9uKCdpbWdVUkwnLCAncmVhZHdyaXRlJyk7XHJcbiAgICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuXHJcbiAgICBDc0JhdGNoRm9yREJBZGQuZm9yRWFjaChpbWdkYXRhID0+IHtcclxuICAgICAgc3RvcmUucHV0KFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHVybDogaW1nZGF0YS51cmwsXHJcbiAgICAgICAgICBkb21haW46IChuZXcgVVJMKGltZ2RhdGEudXJsKSkuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcLi8sICcnKSwvL+yImOygleyYiOyglSxcclxuICAgICAgICAgIHJlc3BvbnNlOiBmYWxzZSxcclxuICAgICAgICAgIHN0YXR1czogZmFsc2UsICAgLy8g6rKA7IKs7JmE66OMXHJcbiAgICAgICAgICBoYXJtZnVsOiBmYWxzZSwgICAvLyDquLDrs7jqsJJcclxuICAgICAgICAgIHNhdmVUaW1lOiBEYXRlLm5vdygpXHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZmV0Y2hCYXRjaChDc0JhdGNoRm9yREJBZGQsIHRhYklkKTtcclxuICAgIC8vZGIg7LaU6rCA7ZaI7Jy864uIIGZldGNoLlxyXG4gIH1cclxuXHJcbiAgLy9jb25zb2xlLmxvZyhcInBhZ2VDb3VudEluZm9cXG5cIitwYWdlVXJsKydcXG4nK251bU9mSGFybWZ1bEltZyk7XHJcbiAgc2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbihwYWdlVXJsLCBudW1PZkhhcm1mdWxJbWcpO1xyXG5cclxuXHJcbiAgLy9jb25zdCBkZWxheSA9IGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAyMDApKTtcclxuXHJcbiAgY3NCYXRjaEZvclJlc3BvbnNlID0gY3NCYXRjaEZvclJlc3BvbnNlLmZpbHRlcih4ID0+IHggIT09IHVuZGVmaW5lZCk7XHJcbiAgY29uc29sZS5sb2coJ1JlY2VpdmluZyAgcmVxdWVzdDonLCBiYXRjaCk7XHJcbiAgY29uc29sZS5sb2coJ1NlbmRpbmcgcmVzcG9uc2U6JywgY3NCYXRjaEZvclJlc3BvbnNlKTtcclxuICByZXR1cm4gY3NCYXRjaEZvclJlc3BvbnNlOyAvL+uwm+ydgCDrsLDsuZgg7KSR7JeQ7IScIOuwlOuhnCDsnZHri7XtlaAg7J2066+47KeAIOqwneyytOunjCDrhKPslrTshJwgcmV0dXJuXHJcbn1cclxuXHJcblxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL2V2ZW50IGxpc3Rlci8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy/svZjthZDsuKAg7Iqk7YGs66a97Yq4IOumrOyKpOuEiFxyXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XHJcbiAgaWYgKG1lc3NhZ2Uuc291cmNlID09PSBcImNvbnRlbnRcIikge1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIHN3aXRjaCAobWVzc2FnZT8udHlwZSkge1xyXG5cclxuICAgICAgICBjYXNlIFwiaW1nRGF0YUZyb21Db250ZW50U2NyaXB0XCI6XHJcbiAgICAgICAgICBjaGVja0NzRGF0YShzZW5kZXI/LnRhYj8uaWQsIHNlbmRlcj8uZnJhbWVJZCwgbWVzc2FnZS5kYXRhKS50aGVuKGJhdGNoRnJvbVNjcmlwdCA9PiB7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJyZXNwb25zZVwiLFxyXG4gICAgICAgICAgICAgIGRhdGE6IGJhdGNoRnJvbVNjcmlwdCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBjYXNlIFwicmVnaXN0ZXJfZnJhbWVcIjpcclxuICAgICAgICAgIGlmICghY3VycmVudFRhYnMuZ2V0KHNlbmRlcj8udGFiPy5pZCkpIHtcclxuICAgICAgICAgICAgY3VycmVudFRhYnMuc2V0KHNlbmRlcj8udGFiPy5pZCwgW3NlbmRlcj8uZnJhbWVJZF0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudFRhYnMuZ2V0KHNlbmRlcj8udGFiPy5pZCkuaW5jbHVkZXMoc2VuZGVyPy5mcmFtZUlkKSkge1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRUYWJzLmdldChzZW5kZXI/LnRhYj8uaWQpLnB1c2goc2VuZGVyPy5mcmFtZUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGdldFBhZ2VVcmxGcm9tVGFiSWQoc2VuZGVyPy50YWI/LmlkKS50aGVuKHBhZ2VVcmw9PntcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocGFnZVVybCk7XHJcbiAgICAgICAgICAgIGluaXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uKHBhZ2VVcmwpO1xyXG4gICAgICAgICAgfSkuY2F0Y2goZXJyPT57Y29uc29sZS5lcnJvcihlcnIpO30pO1xyXG5cclxuICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiB0cnVlIH0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgXCJpbWFnZUNsaWNrZWRcIjpcclxuICAgICAgICAgIGlmIChtZXNzYWdlLmltZ1NyYykge1xyXG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMucmVtb3ZlQWxsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgIGlkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgICAgICAgICAgICAgICAgdGl0bGU6ICdJbWFnZUludGVyY2VwdG9yIC0g7Jyg7ZW0IOydtOuvuOyngCDssKjri6gg7ZSE66Gc6re4656oJyxcclxuICAgICAgICAgICAgICAgICAgY29udGV4dHM6IFsnYWxsJ11cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW21lbnVJZCwgbWVudVRpdGxlXSBvZiBPYmplY3QuZW50cmllcyhjb250ZXh0Q29udHJvbE1lbnUpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbWVudUlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudElkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogbWVudVRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdyYWRpbycsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dHM6IFsnYWxsJ11cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5oYXMobWVzc2FnZS5pbWdTcmMpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5zZXQobWVzc2FnZS5pbWdTcmMsIG1lc3NhZ2UuaXNTaG93ID09PSB0cnVlID8gJ0ltZ1Nob3cnIDogJ0ltZ0hpZGUnKTtcclxuICAgICAgICAgICAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy51cGRhdGUobWVzc2FnZS5pc1Nob3cgPT09IHRydWUgPyAnSW1nU2hvdycgOiAnSW1nSGlkZScsIHsgY2hlY2tlZDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJuZXcgaW1nXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGFub3RoZXJJdGVtU3RhdHVzID0gY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LmdldChtZXNzYWdlLmltZ1NyYykgPT09ICdJbWdTaG93JyA/ICdJbWdIaWRlJyA6ICdJbWdTaG93JztcclxuICAgICAgICAgICAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy51cGRhdGUoY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LmdldChtZXNzYWdlLmltZ1NyYykgPT09ICdJbWdTaG93JyA/ICdJbWdTaG93JyA6ICdJbWdIaWRlJywgeyBjaGVja2VkOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJpbWcg7KG07J6sOiBcIiArIG1lc3NhZ2UuaW1nU3JjKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjbGlja2VkSW1nU3JjID0gbWVzc2FnZS5pbWdTcmM7XHJcblxyXG5cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICBjYXNlIFwiY2hlY2tfYmxhY2tfbGlzdFwiOlxyXG4gICAgICAgICAgbGV0IGlzSW5CbGFja0xpc3QgPSBmYWxzZTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcmNlcHRvclNpdGUuaGFzKG1lc3NhZ2Uuc2l0ZSkpIHtcclxuICAgICAgICAgICAgICBjb25zdCB0YXJnZXRTaXRlID0gaW50ZXJjZXB0b3JTaXRlLmdldChtZXNzYWdlLnNpdGUpO1xyXG4gICAgICAgICAgICAgIGlmICghdGFyZ2V0U2l0ZVtcImFjdGl2ZVwiXSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLtl4jsmqnrkJjsp4Ag7JWK7J2AIOyCrOydtO2KuFwiKTtcclxuICAgICAgICAgICAgICAgIGlzSW5CbGFja0xpc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRTaXRlW1wicGFnZVwiXS5pbmNsdWRlcyhtZXNzYWdlLnBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7ZeI7Jqp65CY7KeAIOyViuydgCDtjpjsnbTsp4BcIik7XHJcbiAgICAgICAgICAgICAgICAgIGlzSW5CbGFja0xpc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2Uoe1xyXG4gICAgICAgICAgICAgIG9rOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHJlc3VsdDogaXNJbkJsYWNrTGlzdFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XHJcbiAgICAgICAgICAgICAgb2s6IGZhbHNlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG5cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG5cclxuXHJcblxyXG5jaHJvbWUucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihhc3luYyAoKSA9PiB7XHJcblxyXG4gIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcclxuICAgIGlkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgIHRpdGxlOiAnSW1hZ2VJbnRlcmNlcHRvciAtIOycoO2VtCDsnbTrr7jsp4Ag7LCo64uoIO2UhOuhnOq3uOueqCcsXHJcbiAgICBjb250ZXh0czogWydhbGwnXVxyXG4gIH0pO1xyXG5cclxuICBmb3IgKGNvbnN0IFttZW51SWQsIG1lbnVUaXRsZV0gb2YgT2JqZWN0LmVudHJpZXMoY29udGV4dENvbnRyb2xNZW51KSkge1xyXG4gICAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xyXG4gICAgICBpZDogbWVudUlkLFxyXG4gICAgICBwYXJlbnRJZDogJ21haW5Db250cm9sTWVudScsXHJcbiAgICAgIHRpdGxlOiBtZW51VGl0bGUsXHJcbiAgICAgIHR5cGU6ICdyYWRpbycsXHJcbiAgICAgIGNvbnRleHRzOiBbJ2FsbCddXHJcbiAgICB9KTtcclxuICB9XHJcbiAgc3RvcmVkSW50ZXJjZXB0b3JTdGF0dXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydpbnRlcmNlcHRvclN0YXR1cyddKTtcclxuICBsZXQgc2F2ZWRTdGF0dXMgPSBzdG9yZWRJbnRlcmNlcHRvclN0YXR1cy5pbnRlcmNlcHRvclN0YXR1cztcclxuICBpZiAoc2F2ZWRTdGF0dXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU3RhdHVzJzogMSB9KTtcclxuICAgIHNhdmVkU3RhdHVzID0gMTtcclxuICB9XHJcbiAgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IHNhdmVkU3RhdHVzID09PSAxID8gdHJ1ZSA6IGZhbHNlO1xyXG4gIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdtYWluQ29udHJvbE1lbnUnLCB7IGVuYWJsZWQ6IGlzSW50ZXJjZXB0b3JBY3RpdmUgfSk7XHJcblxyXG5cclxuICBjb25zdCBzdG9yZWRJbnRlcmNlcHRvclNpdGUgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydpbnRlcmNlcHRvclNpdGUnXSk7XHJcbiAgaWYgKHN0b3JlZEludGVyY2VwdG9yU2l0ZSA9PT0gdW5kZWZpbmVkIHx8IHN0b3JlZEludGVyY2VwdG9yU2l0ZS5pbnRlcmNlcHRvclNpdGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU2l0ZSc6IHt9IH0pO1xyXG4gICAgaW50ZXJjZXB0b3JTaXRlID0gbmV3IE1hcCgpO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGludGVyY2VwdG9yU2l0ZSA9IG5ldyBNYXAoT2JqZWN0LmVudHJpZXMoc3RvcmVkSW50ZXJjZXB0b3JTaXRlLmludGVyY2VwdG9yU2l0ZSkpO1xyXG4gIH0gIFxyXG5cclxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWyd0b3RhbE51bU9mSGFybWZ1bEltZyddKS50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICBpZiAoIXJlc3VsdC50b3RhbE51bU9mSGFybWZ1bEltZykge1xyXG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAndG90YWxOdW1PZkhhcm1mdWxJbWcnOiAwIH0pO31cclxuICB9KTtcclxuXHJcblxyXG4gIGNvbnN0IHN0b3JlZEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydmaWx0ZXJpbmdTdGVwJ10pLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJpbmdTdGVwJzogMSB9KTtcclxuICAgIGxldCB2YWx1ZSA9IHJlc3VsdC5maWx0ZXJpbmdTdGVwO1xyXG4gICAgaWYgKHZhbHVlPT09dW5kZWZpbmVkKSB7XHJcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJpbmdTdGVwJzogMSB9KTtcclxuICAgICAgdmFsdWUgPSAxO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH0pO1xyXG4gIHNldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoc3RvcmVkQ3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSk7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn0pO1xyXG5cclxuXHJcbmNocm9tZS5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKChpdGVtLCB0YWIpID0+IHtcclxuXHJcbiAgaWYgKGNsaWNrZWRJbWdTcmMgPT09IG51bGwpIHtcclxuICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdJbWdTaG93JywgeyBjaGVja2VkOiB0cnVlIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29udHJvbElkID0gaXRlbS5tZW51SXRlbUlkO1xyXG4gIGNvbnN0IGltZ0luZm8gPSB7IHRhYklkOiB0YWIuaWQsIGZyYW1lSWQ6IGl0ZW0uZnJhbWVJZCwgdXJsOiBpdGVtLnNyY1VybCB9O1xyXG5cclxuICBjb25zb2xlLmxvZyhcIuy7qO2FjeyKpO2KuCDtgbTrpq1cIik7XHJcbiAgaWYgKGNvbnRyb2xJZCA9PT0gY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LmdldChjbGlja2VkSW1nU3JjKSkgcmV0dXJuO1xyXG5cclxuXHJcbiAgdHJ5IHtcclxuICAgIC8v7LaU67aAIHByb21pc2XstpTqsIBcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UoaW1nSW5mby50YWJJZCwge1xyXG4gICAgICBzb3VyY2U6IFwic2VydmljZV93b3JrZXJcIixcclxuICAgICAgdHlwZTogJ2NvbnRyb2xfaW1nJyxcclxuICAgICAgaXNTaG93OiBjb250cm9sSWQgPT09ICdJbWdTaG93JyA/IHRydWUgOiBmYWxzZVxyXG4gICAgfSwgeyBmcmFtZUlkOiBpbWdJbmZvLmZyYW1lSWQgfSk7XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICBjb25zb2xlLmxvZyhyZXNwb25zZS5tZXNzYWdlKTtcclxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IocmVzcG9uc2UubWVzc2FnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LnNldChjbGlja2VkSW1nU3JjLCBjb250cm9sSWQpO1xyXG4gICAgY2xpY2tlZEltZ1NyYyA9IG51bGw7XHJcblxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBpZiAoIWVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJ0NvdWxkIG5vdCBlc3RhYmxpc2ggY29ubmVjdGlvbicpKSBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdJbWdTaG93JywgeyBjaGVja2VkOiB0cnVlIH0pO1xyXG4gIH1cclxuICByZXR1cm4gdHJ1ZTtcclxuXHJcbn0pO1xyXG5cclxuXHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gYWN0aXZlSW50ZXJjZXB0b3IoZmxhZykge1xyXG4gIGNvbnN0IHJlc3VsdCA9IHsgb2s6IHRydWUsIG1lc3NhZ2U6IFtdIH07XHJcblxyXG4gIGZvciAoY29uc3QgW3RhYklkLCBmcmFtZXNdIG9mIGN1cnJlbnRUYWJzKSB7XHJcbiAgICBpZiAoIWZyYW1lcykgY29udGludWU7XHJcblxyXG4gICAgZm9yIChjb25zdCBmcmFtZSBvZiBmcmFtZXMpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYklkLCB7XHJcbiAgICAgICAgICBzb3VyY2U6IFwic2VydmljZV93b3JrZXJcIixcclxuICAgICAgICAgIHR5cGU6ICdhY3RpdmVfaW50ZXJjZXB0b3InLFxyXG4gICAgICAgICAgYWN0aXZlOiBmbGFnXHJcbiAgICAgICAgfSwgeyBmcmFtZUlkOiBmcmFtZSB9KTtcclxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgICByZXN1bHQub2sgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzdWx0Lm1lc3NhZ2UucHVzaChyZXNwb25zZS5tZXNzYWdlKTtcclxuXHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgaWYgKCFlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCdDb3VsZCBub3QgZXN0YWJsaXNoIGNvbm5lY3Rpb24nKSkgcmVzdWx0Lm9rID0gZmFsc2U7XHJcbiAgICAgICAgcmVzdWx0Lm1lc3NhZ2UucHVzaChlcnJvci5tZXNzYWdlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuXHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXRGaWx0ZXJTdGF0dXMoZmxhZykge1xyXG4gIGNvbnN0IHJlc3VsdCA9IHsgb2s6IHRydWUsIG1lc3NhZ2U6IFtdIH07XHJcblxyXG4gIGZvciAoY29uc3QgW3RhYklkLCBmcmFtZXNdIG9mIGN1cnJlbnRUYWJzKSB7XHJcbiAgICBpZiAoIWZyYW1lcykgY29udGludWU7XHJcblxyXG4gICAgZm9yIChjb25zdCBmcmFtZSBvZiBmcmFtZXMpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYklkLCB7XHJcbiAgICAgICAgICBzb3VyY2U6IFwic2VydmljZV93b3JrZXJcIixcclxuICAgICAgICAgIHR5cGU6ICdzZXRfZmlsdGVyX3N0YXR1cycsXHJcbiAgICAgICAgICBGaWx0ZXJTdGF0dXM6IGZsYWdcclxuICAgICAgICB9LCB7IGZyYW1lSWQ6IGZyYW1lIH0pO1xyXG5cclxuICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgICByZXN1bHQub2sgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzdWx0Lm1lc3NhZ2UucHVzaChyZXNwb25zZS5tZXNzYWdlKTtcclxuXHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgaWYgKCFlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCdDb3VsZCBub3QgZXN0YWJsaXNoIGNvbm5lY3Rpb24nKSkgcmVzdWx0Lm9rID0gZmFsc2U7XHJcbiAgICAgICAgcmVzdWx0Lm1lc3NhZ2UucHVzaChlcnJvci5tZXNzYWdlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vL+2MneyXhSDrpqzsiqTrhIhcclxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xyXG4gIGlmIChtZXNzYWdlLnNvdXJjZSA9PT0gXCJwb3B1cFwiKSB7XHJcbiAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGxldCByZXNwb25zZVN0YXR1cyA9IHRydWU7XHJcbiAgICAgICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcclxuICAgICAgICAgIGNhc2UgXCJhY3RpdmVfaW50ZXJjZXB0b3JcIjpcclxuICAgICAgICAgICAgcmVzcG9uc2VTdGF0dXMgPSBhd2FpdCBhY3RpdmVJbnRlcmNlcHRvcihtZXNzYWdlLmFjdGl2ZSk7XHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2VTdGF0dXMub2spIGNvbnNvbGUuZXJyb3IocmVzcG9uc2VTdGF0dXMub2spO1xyXG4gICAgICAgICAgICBpc0ludGVyY2VwdG9yQWN0aXZlID0gbWVzc2FnZS5hY3RpdmU7XHJcbiAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdtYWluQ29udHJvbE1lbnUnLCB7IGVuYWJsZWQ6IGlzSW50ZXJjZXB0b3JBY3RpdmUgPyB0cnVlIDogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiByZXNwb25zZVN0YXR1cy5vayB9KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgY2FzZSBcInNldF9maWx0ZXJfc3RhdHVzXCI6XHJcbiAgICAgICAgICAgIHJlc3BvbnNlU3RhdHVzID0gYXdhaXQgc2V0RmlsdGVyU3RhdHVzKG1lc3NhZ2UuRmlsdGVyU3RhdHVzKTtcclxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZVN0YXR1cy5vaykgY29uc29sZS5lcnJvcihyZXNwb25zZVN0YXR1cy5tZXNzYWdlKTtcclxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IHJlc3BvbnNlU3RhdHVzLm9rIH0pO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgXCJwb3B1cF9lcnJvclwiOlxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmcm9tIHBvcHVwOiBcIiArIG1lc3NhZ2UuZXJyb3IpO1xyXG4gICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2FuIG5vdCByZWFkIHBvcHVwIG1lc3NhZ2UgdHlwZVwiKTtcclxuICAgICAgICAgIGNhc2UgXCJzeW5jX2JsYWNrX2xpc3RcIjpcclxuICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgIGludGVyY2VwdG9yU2l0ZS5zZXQobWVzc2FnZS5yb290SW5zdGFuY2VbMF0sIG1lc3NhZ2Uucm9vdEluc3RhbmNlWzFdKTtcclxuICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAnaW50ZXJjZXB0b3JTaXRlJzogT2JqZWN0LmZyb21FbnRyaWVzKGludGVyY2VwdG9yU2l0ZSkgfSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgXCJzZXRfZmlsdGVyaW5nX3N0ZXBcIjpcclxuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ZpbHRlcmluZ1N0ZXAnOiBtZXNzYWdlLnZhbHVlIH0pO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlLnZhbHVlKTtcclxuICAgICAgICAgICAgc2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZShtZXNzYWdlLnZhbHVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogZmFsc2UgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn0pO1xyXG5cclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9