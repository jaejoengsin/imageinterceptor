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
  const tx = _indexDb_js__WEBPACK_IMPORTED_MODULE_1__.DB.transaction('imgURL', 'readwrite');
  const store = tx.objectStore('imgURL');

  const reFetchData = new Map();

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
  
  try {
    const tab = await chrome.tabs.get(tabId);
    const refererUrl = tab.url;

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
        const imgBlob = await fetchAndReturnBlobImg(imgdata.url, refererUrl);
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
    const res = await fetch("https://image-interceptor-develop-683857194699.asia-northeast3.run.app", {
      method: "POST",
      body: formData
    });
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

            _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.CsBatchForWaiting.delete(url[1]);
        }
    }
    sendWaitingCsDataToCs(readyToSend);//.then(res => { console.log("response status(WaitingCsData Sended): ", res); })contentscript와 runtimemessage 교신
    //checkTimeAndRefetch();
    
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

        case "mainControlMenu":
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0EsUUFBUTtBQUNSO0FBQ0EsdUJBQXVCLFdBQVc7QUFDbEM7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLENBQUM7QUFDRCIsInNvdXJjZXMiOlsid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvZ2xvYmFsL2JhY2tncm91bmRDb25maWcuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9tb2R1bGVzL2luZGV4RGIuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9tb2R1bGVzL3JlcXVlc3RJbWdBbmFseXplLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvdXRpbHMvYmFja2dyb3VuZFV0aWxzLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvdXRpbHMvcHJvcGFnYXRlLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL2JhY2tncm91bmQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXHJcbi8vaW5wdXQgZGF0YSA9PiBbc2l0ZXVybCwgaW1ndXJsXSA6e2ltZ01ldGFEYXRhfVxyXG5leHBvcnQgY29uc3QgQ3NCYXRjaEZvcldhaXRpbmcgPSBuZXcgTWFwKCk7IFxyXG5cclxuLy9kZWZhdWx0ID0gMVxyXG5sZXQgY3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlKHZhbHVlKSB7XHJcbiAgY3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSA9IHZhbHVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSgpIHtcclxuICByZXR1cm4gY3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZTtcclxufSIsImV4cG9ydCBsZXQgREIgPSBudWxsO1xyXG5leHBvcnQgbGV0IGtleVNldCA9IG51bGw7XHJcbmV4cG9ydCBsZXQga2V5U2V0TG9hZGVkID0gZmFsc2U7XHJcblxyXG5cclxuXHJcbmV4cG9ydCAgYXN5bmMgZnVuY3Rpb24gaW5pdEluZGV4RGIoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IGRlbGV0ZUltYWdlVXJsREIoKTsvL+uCmOykkeyXkCDsgq3soJztlbTslbwg7ZWoLiDshJzruYTsiqQg7JuM7LukIOy0iOq4sO2ZlO2VmOuptCDrrLTsobDqsbQg6riw7KG0IGRiIOyCreygnFxyXG4gICAgICAgIERCID0gYXdhaXQgb3BlbkltYWdlVXJsREIoKTtcclxuICAgICAgICBhd2FpdCBsb2FkS2V5U2V0KERCKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImRi66Gc65Oc7JmE66OMXCIpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIuyEnOu5hOyKpOybjOy7pCDstIjquLDtmZQgLSBkYiDroZzrk5wg67CPIO2CpOyFiyDroZzrk5wg7KSR7JeQIOyXkOufrCDrsJzsg506XCIgKyBlKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJlcnJvciB3aGlsZSBsb2FkaW5nIGRiIG9yIGtleXNldCBcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuXHJcbi8qXHJcbnJlc29sdmUodmFsdWUpXHJcbjog7J6R7JeF7J20IOyEseqzte2WiOydhCDrlYwgUHJvbWlzZeydmCDsg4Htg5zrpbwgJ+ydtO2WiShmdWxmaWxsZWQpJyDsg4Htg5zroZwg7KCE7ZmY7Iuc7YKk6rOgLCDqsrDqs7zrpbwgdmFsdWXroZwg7KCE64us7ZWp64uI64ukLiDtlbTri7kg6rCS7J2AXHJcbi50aGVuKCnsnZgg7LKrIOuyiOynuCDsvZzrsLEsIOu5hOuPmeq4sOyggeycvOuhnCDsi6TtlolcclxucmVqZWN0KHJlYXNvbilcclxuOiDsnpHsl4XsnbQg7Iuk7Yyo7ZaI7J2EIOuVjCBQcm9taXNl7J2YIOyDge2DnOulvCAn6rGw67aAKHJlamVjdGVkKScg7IOB7YOc66GcIOyghO2ZmOyLnO2CpOqzoCwg7JeQ65+sKOydtOycoCnrpbwgcmVhc29u7Jy866GcIOyghOuLrO2VqeuLiOuLpC5cclxu7ZW064u5IOqwkuydgCAuY2F0Y2goKSDrmJDripQgLnRoZW4oLCApIOuRkCDrsojsp7gg7L2c67CxLCDruYTrj5nquLDsoIHsnLzroZwg7Iuk7ZaJXHJcbiovXHJcbmV4cG9ydCBmdW5jdGlvbiBvcGVuSW1hZ2VVcmxEQigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgLy9pbWFnZVVybERC64qUIGRi7J2066aELiDrp4zslb0g7KG07J6s7ZWY7KeAIOyViuycvOuptCDsg53shLEsIOyhtOyerO2VmOuptCDtlbTri7kgZGLrpbwg7Je07J2MIFxyXG4gICAgICAgIC8v65GQ67KI7Ke4IOyduOyekOyduCAx7J2AIOuNsOydtO2EsCDrsqDsnbTsiqQg67KE7KCELiDrp4zslb3sl5AgZGLqsIAg7J20IOqwkuuztOuLpCDrsoTsoITsnbQg64Ku64uk66m0IOyXheq3uOugiOydtOuTnCDsnbTrsqTtirjqsIAg67Cc7IOd65CoLihvbnVwZ3JhZGVuZWVkZWQpXHJcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKCdpbWFnZVVybERCJywgMSk7XHJcbiAgICAgICAgLy/sl4Xqt7jroIjsnbTrk5zqsIAg67Cc7IOd7ZWgIOqyveyasCDsnbTrsqTtirgg7ZW465Ok65+s7JeQ7IScIOyLpO2Wie2VoCDsvZzrsLEg7ZWo7IiYIOygleydmFxyXG4gICAgICAgIHJlcXVlc3Qub251cGdyYWRlbmVlZGVkID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIC8vIG9wZW4g7JqU7LKt7Jy866GcIOyXtOumrOqxsOuCmCDsg53shLHrkJwg642w7J207YSw67Kg7J207IqkKElEQkRhdGFiYXNlKSDqsJ3ssrQuIFxyXG4gICAgICAgICAgICAvL+ydtCDqsJ3ssrTroZwgb2JqZWN0U3RvcmUo7YWM7J2067iUIOqwmeydgCDqsJzrhZAp66W8IOunjOuTpOqxsOuCmCDsgq3soJztlZjripQg65OxIOuNsOydtO2EsOuyoOydtOyKpOydmCDsiqTtgqTrp4jrpbwg7KGw7J6R7ZWgIOyImCDsnojsnYxcclxuICAgICAgICAgICAgLy8gb2JqZWN0U3RvcmXsnYAg7J287KKF7J2YIFwi7YWM7J2067iUXCIg6rCc64WQ7J2066mwIOq0gOqzhO2YlURC7J2YIO2FjOydtOu4lOuztOuLpCDsnpDsnKDroZzsmrQg7ZiV7YOc66GcLCDsnpDrsJTsiqTtgazrpr3tirgg6rCd7LK0IOuLqOychOuhnCBcclxuICAgICAgICAgICAgLy/rjbDsnbTthLDrpbwg7KCA7J6l7ZWgIOyImCDsnojsnYxcclxuICAgICAgICAgICAgLy9rZXlQYXRo64qUIOyggOyepe2VmOuKlCDqsIEg6rCd7LK07JeQ7IScIOq4sOuzuO2CpOuhnCDsgqzsmqntlaAg7IaN7ISxIOydtOumhFxyXG4gICAgICAgICAgICBjb25zdCBkYiA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XHJcbiAgICAgICAgICAgIC8vIGltYWdlcyBvYmplY3RTdG9yZSDsg53shLEsIGtleVBhdGjripQgY2Fub25pY2FsVXJs66GcIVxyXG5cclxuICAgICAgICAgICAgaWYgKCFkYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKCdpbWdVUkwnKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKCdpbWdVUkwnLCB7IGtleVBhdGg6ICd1cmwnIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgcmVzb2x2ZShldmVudC50YXJnZXQucmVzdWx0KTsgLy8gcHJvbWlzZSB2YWx1ZeyXkCBkYiDsnbjsiqTthLTsiqQg67CY7ZmY6rCSIOyggOyepVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJlcXVlc3Qub25lcnJvciA9IChldmVudCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7IC8vIHByb21pc2UgcmVhc29u7JeQIGV2ZW50LnRhcmdldC5lcnJvciDsoIDsnqVcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVJbWFnZVVybERCKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAvLyBJbmRleGVkRELsnZggZGVsZXRlRGF0YWJhc2Ug66mU7ISc65Oc66W8IOyCrOyaqe2VmOyXrCDrjbDsnbTthLDrsqDsnbTsiqTrpbwg7IKt7KCc7ZWp64uI64ukLlxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSBpbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoJ2ltYWdlVXJsREInKTtcclxuXHJcbiAgICAgICAgLy8g7IKt7KCcIOyEseqztSDsi5wg7Zi47Lac65CY64qUIOydtOuypO2KuCDtlbjrk6Trn6xcclxuICAgICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+uNsOydtO2EsOuyoOydtOyKpOqwgCDshLHqs7XsoIHsnLzroZwg7IKt7KCc65CY7JeI7Iq164uI64ukLicpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8g7IKt7KCcIOyLpO2MqCDsi5wg7Zi47Lac65CY64qUIOydtOuypO2KuCDtlbjrk6Trn6xcclxuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgcmVqZWN0KCfrjbDsnbTthLDrsqDsnbTsiqQg7IKt7KCcIOyYpOulmDonLCBldmVudC50YXJnZXQuZXJyb3IpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIOuNsOydtO2EsOuyoOydtOyKpOqwgCDri6Trpbgg7YOt7JeQ7IScIOyXtOugpCDsnojslrQg7IKt7KCc6rCAIOywqOuLqOuQoCDrlYwg7Zi47Lac65CY64qUIOydtOuypO2KuCDtlbjrk6Trn6xcclxuICAgICAgICByZXF1ZXN0Lm9uYmxvY2tlZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCfrjbDsnbTthLDrsqDsnbTsiqTqsIAg64uk66W4IOyXsOqysOyXkCDsnZjtlbQg7LCo64uo65CY7JeI7Iq164uI64ukLicpO1xyXG4gICAgICAgICAgICByZWplY3QoJ+uNsOydtO2EsOuyoOydtOyKpOqwgCDri6Trpbgg7Jew6rKw7JeQIOydmO2VtCDssKjri6jrkJjsl4jsirXri4jri6QuJyk7XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxLZXlzUHJvbWlzZShzdG9yZSkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCByZXEgPSBzdG9yZS5nZXRBbGxLZXlzKCk7XHJcbiAgICAgICAgcmVxLm9uc3VjY2VzcyA9IChlKSA9PiByZXNvbHZlKGUudGFyZ2V0LnJlc3VsdCk7IC8vIOuwsOyXtCDrsJjtmZghXHJcbiAgICAgICAgcmVxLm9uZXJyb3IgPSAoZSkgPT4gcmVqZWN0KGUudGFyZ2V0LmVycm9yKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRLZXlTZXQoKSB7XHJcbiAgICBjb25zdCB0eCA9IERCLnRyYW5zYWN0aW9uKCdpbWdVUkwnLCAncmVhZG9ubHknKTtcclxuICAgIGNvbnN0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ2ltZ1VSTCcpO1xyXG4gICAgLy8g7J2066+4IOyggOyepeuQnCDrqqjrk6AgY2Fub25pY2FsVXJs7J2EIO2VnOuyiOyXkCDsobDtmowgKOuMgOufiSDsspjrpqwg7IucIO2aqOycqOyggSlcclxuICAgIGNvbnN0IGV4aXN0aW5nS2V5cyA9IGF3YWl0IGdldEFsbEtleXNQcm9taXNlKHN0b3JlKTtcclxuICAgIC8vIOydtOuvuCDsobTsnqztlZjripTsp4AgU2V07Jy866GcIOq0gOumrCjqsoDsg4kg67mg66aEKVxyXG4gICAga2V5U2V0ID0gbmV3IFNldChleGlzdGluZ0tleXMpO1xyXG4gICAgY29uc29sZS5sb2coa2V5U2V0LnNpemUpO1xyXG4gICAga2V5U2V0TG9hZGVkID0gdHJ1ZTtcclxufVxyXG5cclxuLyoq44S4XHJcbiAqIFxyXG4gKiBAcGFyYW0ge09iamVjdH0gdGFibGVNZXRob2RSZXN1bHQgdGFibGXsl5AgZ2V0LHB1dCDrk7Eg67mE64+Z6riwIOyalOyyreydmCDrsJjtmZjqsJIgIFxyXG4gKi9cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXFUYWJsZVByb21pc2UodGFibGVNZXRob2RSZXN1bHQpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdGFibGVNZXRob2RSZXN1bHQub25zdWNjZXNzID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRhYmxlTWV0aG9kUmVzdWx0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgcmVqZWN0KGV2ZW50LnRhcmdldC5lcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZURCKHJlc3BvbnNlRGF0YSkge1xyXG4gICAgY29uc3QgdHggPSBEQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgY29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnaW1nVVJMJyk7XHJcblxyXG4gICAgZm9yIChjb25zdCBbdXJsLCBpbWdSZXNEYXRhXSBvZiByZXNwb25zZURhdGEpIHtcclxuICAgICAgICBsZXQgZGJWYWx1ZSA9IGF3YWl0IHJlcVRhYmxlUHJvbWlzZShzdG9yZS5nZXQodXJsKSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJ0YWJsZeyXkOyEnCBrZXkg7KGw7ZqM7ZWY6rOgIHZhbHVlIOqwgOyguOyYpOuKlCDspJHsl5AgRXJyb3Ig67Cc7IOdOlwiLCBlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZGJWYWx1ZS5yZXNwb25zZSA9IGltZ1Jlc0RhdGEucmVzcG9uc2U7XHJcbiAgICAgICAgZGJWYWx1ZS5zdGF0dXMgPSBpbWdSZXNEYXRhLnN0YXR1cztcclxuICAgICAgICBkYlZhbHVlLmhhcm1mdWwgPSBpbWdSZXNEYXRhLmhhcm1mdWw7XHJcbiAgICAgICAgYXdhaXQgcmVxVGFibGVQcm9taXNlKHN0b3JlLnB1dChkYlZhbHVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy90eCDsmYTro4wg6riw64us66a0IO2VhOyalCB4Py4uLlxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBwcm9wYWdhdGVSZXNCb2R5RGF0YX0gZnJvbSAnLi4vdXRpbHMvcHJvcGFnYXRlLmpzJztcclxuaW1wb3J0IHtEQiwgcmVxVGFibGVQcm9taXNlfSBmcm9tICcuL2luZGV4RGIuanMnO1xyXG5pbXBvcnQgeyBDc0JhdGNoRm9yV2FpdGluZywgZ2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSB9IGZyb20gJy4uL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzJztcclxuXHJcbmNvbnN0IHJldHJ5VGhyZXNob2xkID0gMTUgKiAxMDAwO1xyXG5cclxuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQmF0Y2goQ3NJbWdEYXRhLCB0YWJJZCkge1xyXG5cclxuLy8gICBjb25zb2xlLmxvZyhcImZldGNoZGF0YTpcIiArIENzSW1nRGF0YS5sZW5ndGgpO1xyXG5cclxuLy8gICBsZXQgQ3NJbWdEYXRhRm9yRmV0Y2ggPSBudWxsO1xyXG4vLyAgIHRyeSB7XHJcbi8vICAgICBjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWUudGFicy5nZXQodGFiSWQpO1xyXG4vLyAgICAgY29uc3QgcmVmZXJlclVybCA9IHRhYi51cmw7XHJcblxyXG4vLyAgICAgQ3NJbWdEYXRhRm9yRmV0Y2ggPSBhd2FpdCBQcm9taXNlLmFsbChcclxuLy8gICAgICAgQ3NJbWdEYXRhLm1hcChhc3luYyBpbWdkYXRhID0+IHtcclxuLy8gICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZmV0Y2hBbmRSZXR1cm5CYXNlNjRJbWcoaW1nZGF0YS51cmwsIHJlZmVyZXJVcmwpO1xyXG4vLyAgICAgICAgIHJldHVybiB7XHJcbi8vICAgICAgICAgICB1cmw6IGltZ2RhdGEudXJsLFxyXG4vLyAgICAgICAgICAgY29udGVudDogY29udGVudCxcclxuLy8gICAgICAgICAgIHN0YXR1czogaW1nZGF0YS5zdGF0dXMsXHJcbi8vICAgICAgICAgICBoYXJtZnVsOiBpbWdkYXRhLmhhcm1mdWxcclxuLy8gICAgICAgICB9O1xyXG4vLyAgICAgICB9KVxyXG4vLyAgICAgKTtcclxuXHJcbi8vICAgfSBjYXRjaCAoZXJyKSB7XHJcbi8vICAgICBjb25zb2xlLmVycm9yKFwi7J2066+47KeAIOyLpOygnCDrjbDsnbTthLAgZmV0Y2gg6rO87KCVIOykkSDsl5Drn6wg67Cc7IOdOiBcIiwgZXJyKTtcclxuLy8gICB9XHJcblxyXG4vLyAgIGNvbnN0IGJvZHlEYXRhID0gSlNPTi5zdHJpbmdpZnkoeyBkYXRhOiBDc0ltZ0RhdGFGb3JGZXRjaCB9KTtcclxuXHJcbi8vICAgdHJ5IHtcclxuXHJcbi8vICAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4vLyAgICAgY29uc29sZS5sb2coXCJmZXRjaCE6IFwiLCBDc0ltZ0RhdGFGb3JGZXRjaC5sZW5ndGgpO1xyXG4vLyAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2ltYWdlLWludGVyY2VwdG9yLXRlc3QtNjgzODU3MTk0Njk5LmFzaWEtbm9ydGhlYXN0My5ydW4uYXBwXCIsIHtcclxuLy8gICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuLy8gICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4vLyAgICAgICBib2R5OiBib2R5RGF0YVxyXG4vLyAgICAgfSk7XHJcblxyXG4vLyAgICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihcIuyEnOuyhCDsnZHri7Ug7Jik66WYXCIpOy8vIGNhdGNo66GcIOydtOuPmVxyXG4vLyAgICAgY29uc29sZS5sb2coYHJlc3BvbnNlIGRlbGF5dGltZTogJHsocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLyAxMDAwfWApO1xyXG5cclxuLy8gICAgIGNvbnN0IHJlc3BvbnNlQm9keURhdGEgPSBhd2FpdCByZXMuanNvbigpPy50aGVuKHJlc3VsdCA9PiB7IHJldHVybiByZXN1bHQ/LmRhdGE/LmltYWdlcyB9KTtcclxuLy8gICAgIGlmIChyZXNwb25zZUJvZHlEYXRhLmxlbmd0aCA+IDApIHtcclxuLy8gICAgICAgcHJvcGFnYXRlUmVzQm9keURhdGEobmV3IE1hcChyZXNwb25zZUJvZHlEYXRhLm1hcCgoZWwpID0+IHtcclxuLy8gICAgICAgICByZXR1cm4gW2VsLnVybCwgeyB1cmw6IGVsLnVybCwgcmVzcG9uc2U6IHRydWUsIHN0YXR1czogZWwuc3RhdHVzLCBoYXJtZnVsOiBlbC5oYXJtZnVsIH1dO1xyXG4vLyAgICAgICB9KSkpO1xyXG4vLyAgICAgfSBlbHNlIGNvbnNvbGUubG9nKFwiY2F1c2UgLSBmZXRjaCByZXNwb25zZTogYm9keWRhdGEg7JeG7J2MXCIpO1xyXG4vLyAgIH0gY2F0Y2ggKGVycikge1xyXG4vLyAgICAgY29uc29sZS5lcnJvcihcclxuLy8gICAgICAgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcclxuLy8gICAgICAgICA/IGBKU09OIHBhcnNpbmcgZmFpbGVkOiAke2Vyci5tZXNzYWdlfWBcclxuLy8gICAgICAgICA6IGBSZXF1ZXN0IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbi8vICAgICApO1xyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxuXHJcbi8vLy8v7Iuk7ZeYIO2VqOyImFxyXG4vLyBCbG9i7J2EIEJhc2U2NCDrrLjsnpDsl7TroZwg67OA7ZmY7ZWY64qUIO2XrO2NvCDtlajsiJhcclxuIGZ1bmN0aW9uIGJsb2JUb0Jhc2U2NChibG9iKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTsgLy8gQmxvYuydhCDsnb3slrQgQmFzZTY0IOuNsOydtO2EsCBVUknroZwg67OA7ZmYIOyLnOyekVxyXG4gICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHtcclxuICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KTsgLy8g67OA7ZmYIOyZhOujjCDsi5wgQmFzZTY0IOusuOyekOyXtCDrsJjtmZhcclxuICAgIH07XHJcbiAgICByZWFkZXIub25lcnJvciA9IChlcnJvcikgPT4ge1xyXG4gICAgICAgIHJlamVjdChlcnJvcik7IC8vIOyXkOufrCDrsJzsg50g7IucIOqxsOu2gFxyXG4gICAgfTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG4vLy8vL1xyXG4gYXN5bmMgZnVuY3Rpb24gZmV0Y2hBbmRSZXR1cm5CYXNlNjRJbWcodXJsLCByZWZlcmVyVXJsKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdSZWZlcmVyJzogcmVmZXJlclVybFxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIGNvbnN0IHJlc0Jsb2IgPSBhd2FpdCByZXMuYmxvYigpO1xyXG4gICAgICBjb25zdCBCYXNlNjQgPSBhd2FpdCBibG9iVG9CYXNlNjQocmVzQmxvYikudGhlbihyZXNOb3RGaWx0ZXJkID0+IHsgcmV0dXJuIHJlc05vdEZpbHRlcmQuc3BsaXQoJywnKVsxXTsgfSk7XHJcbiAgICAgIHJldHVybiByZXNvbHZlKEJhc2U2NCk7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuXHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgfTtcclxuXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoQW5kUmV0dXJuQmxvYkltZyh1cmwsIHJlZmVyZXJVcmwpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdSZWZlcmVyJzogcmVmZXJlclVybFxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIGNvbnN0IHJlc0Jsb2IgPSBhd2FpdCByZXMuYmxvYigpO1xyXG4gICAgICByZXR1cm4gcmVzb2x2ZShyZXNCbG9iKTtcclxuXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG5cclxuICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICB9O1xyXG5cclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tUaW1lQW5kUmVmZXRjaCgpIHtcclxuICBjb25zdCB0eCA9IERCLnRyYW5zYWN0aW9uKCdpbWdVUkwnLCAncmVhZHdyaXRlJyk7XHJcbiAgY29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnaW1nVVJMJyk7XHJcblxyXG4gIGNvbnN0IHJlRmV0Y2hEYXRhID0gbmV3IE1hcCgpO1xyXG5cclxuICBmb3IgKGNvbnN0IFt1cmwsIGltZ0RhdGFdIG9mIENzQmF0Y2hGb3JXYWl0aW5nKSB7XHJcbiAgICBsZXQgZGJWYWx1ZSA9IGF3YWl0IHJlcVRhYmxlUHJvbWlzZShzdG9yZS5nZXQodXJsWzFdKSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICBcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgICAgY29uc29sZS5lcnJvcihcInRhYmxl7JeQ7IScIGtleSDsobDtmoztlZjqs6AgdmFsdWUg6rCA7KC47Jik64qUIOykkeyXkCBFcnJvciDrsJzsg506XCIsIGVycm9yKTtcclxuICAgIH0pO1xyXG4gICAgaWYgKHJldHJ5VGhyZXNob2xkIDwgKERhdGUubm93KCkgLSBkYlZhbHVlLnNhdmVUaW1lKSkge1xyXG4gICAgICBpZiAoIXJlRmV0Y2hEYXRhLmdldChpbWdEYXRhLnRhYklkKSkge1xyXG4gICAgICAgIHJlRmV0Y2hEYXRhLnNldChpbWdEYXRhLnRhYklkLCBbaW1nRGF0YV0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHJlRmV0Y2hEYXRhLmdldChpbWdEYXRhLnRhYklkKS5wdXNoKGltZ0RhdGEpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkYlZhbHVlLnNhdmVUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgYXdhaXQgcmVxVGFibGVQcm9taXNlKHN0b3JlLnB1dChkYlZhbHVlKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IFt0YWJJZCwgaW1nRGF0YUFycl0gb2YgcmVGZXRjaERhdGEpIHtcclxuICAgIGZldGNoQmF0Y2goaW1nRGF0YUFyciwgdGFiSWQpO1xyXG4gIH1cclxuICBhd2FpdCB0eC5kb25lPy4oKTtcclxuXHJcbn1cclxuXHJcbi8vY3JlYXRlSW1hZ2VCaXRtYXDsnLzroZwg7KeA7JuQIOyViO2VmOuKlCDsnbTrr7jsp4A6IHN2Z1xyXG4vL2ltYWdlIOqwneyytOulvCDsg53shLHtlbTshJwg7Jqw7ZqM7KCB7Jy866GcIO2VtOqysO2VtOyVvCDtlaguIOq3uOufrOuCmCDruYTsnKDtlbQg7J2066+47KeAIO2VhO2EsOyXkOyEnCDtlbTri7kg7Jyg7ZiV7J2YIOydtOuvuOyngOulvCDrr7jrpqwg6rG465+s64K8IOyYiOygleydtOq4sCDrlYzrrLjsl5Ag7ZiE7J6sIOyImOyglSDslYjtlZwg7IOB7YOcXHJcbmFzeW5jIGZ1bmN0aW9uIHJlc2l6ZUFuZFNlbmRCbG9iKGJsb2IsIHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIC8vIEJsb2LsnYQgSW1hZ2VCaXRtYXDsnLzroZwg67OA7ZmYXHJcbiAgICBjb25zdCBpbWFnZUJpdG1hcCA9IGF3YWl0IGNyZWF0ZUltYWdlQml0bWFwKGJsb2IpO1xyXG5cclxuICAgIC8vIE9mZnNjcmVlbkNhbnZhcyDsg53shLFcclxuICAgIGNvbnN0IG9mZnNjcmVlbiA9IG5ldyBPZmZzY3JlZW5DYW52YXMod2lkdGgsIGhlaWdodCk7XHJcbiAgICBjb25zdCBjdHggPSBvZmZzY3JlZW4uZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAvLyDsupTrsoTsiqTsl5Ag6re466as6riwXHJcbiAgICBjdHguZHJhd0ltYWdlKGltYWdlQml0bWFwLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICAvLyBCbG9i7Jy866GcIOuzgO2ZmFxyXG4gICAgY29uc3QgcmVzaXplZEJsb2IgPSBhd2FpdCBvZmZzY3JlZW4uY29udmVydFRvQmxvYih7XHJcbiAgICAgICAgdHlwZTogJ2ltYWdlL3dlYlAnLFxyXG4gICAgICAgIHF1YWxpdHk6IDAuOTVcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXNpemVkQmxvYjtcclxuICB9XHJcblxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQmF0Y2goQ3NJbWdEYXRhLCB0YWJJZCkge1xyXG5cclxuICAvL2xldCBDc0ltZ0RhdGFGb3JGZXRjaCA9IG51bGw7XHJcbiAgbGV0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHRhYiA9IGF3YWl0IGNocm9tZS50YWJzLmdldCh0YWJJZCk7XHJcbiAgICBjb25zdCByZWZlcmVyVXJsID0gdGFiLnVybDtcclxuXHJcbiAgICAvLyBDc0ltZ0RhdGFGb3JGZXRjaCA9IGF3YWl0IFByb21pc2UuYWxsKFxyXG4gICAgLy8gICBDc0ltZ0RhdGEubWFwKGFzeW5jIGltZ2RhdGEgPT4ge1xyXG4gICAgLy8gICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmZXRjaEFuZFJldHVybkJhc2U2NEltZyhpbWdkYXRhLnVybCwgcmVmZXJlclVybCk7XHJcbiAgICAvLyAgICAgcmV0dXJuIHtcclxuICAgIC8vICAgICAgIHVybDogaW1nZGF0YS51cmwsXHJcbiAgICAvLyAgICAgICBjb250ZW50OiBjb250ZW50LFxyXG4gICAgLy8gICAgICAgc3RhdHVzOiBpbWdkYXRhLnN0YXR1cyxcclxuICAgIC8vICAgICAgIGhhcm1mdWw6IGltZ2RhdGEuaGFybWZ1bFxyXG4gICAgLy8gICAgIH07XHJcbiAgICAvLyAgIH0pXHJcbiAgICAvLyApO1xyXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoXHJcbiAgICAgIENzSW1nRGF0YS5tYXAoYXN5bmMgaW1nZGF0YSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW1nQmxvYiA9IGF3YWl0IGZldGNoQW5kUmV0dXJuQmxvYkltZyhpbWdkYXRhLnVybCwgcmVmZXJlclVybCk7XHJcbiAgICAgICAgbGV0IHJlc2l6ZWRJbWdCbG9iO1xyXG5cclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICByZXNpemVkSW1nQmxvYiA9IGF3YWl0IHJlc2l6ZUFuZFNlbmRCbG9iKGltZ0Jsb2IsIDIyNCwgMjI0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goZXJyKXtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInwgcmVzaXpl6rO87KCV7JeQ7IScIOyYpOulmCDrsJzsg50gXCIrIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGltZ01ldGFKc29uID0gSlNPTi5zdHJpbmdpZnkoXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogaW1nZGF0YS51cmwsXHJcbiAgICAgICAgICAgIHN0YXR1czogaW1nZGF0YS5zdGF0dXMsXHJcbiAgICAgICAgICAgIGhhcm1mdWw6IGltZ2RhdGEuaGFybWZ1bCxcclxuICAgICAgICAgICAgbGV2ZWw6IGdldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdpbWFnZXMnLCByZXNpemVkSW1nQmxvYik7XHJcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdpbWdNZXRhJywgaW1nTWV0YUpzb24pO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiYm9keSBkYXRhIOyymOumrCDrsI8g7KSA67mEIOqzvOyglSDspJEg7JeQ65+sIOuwnOyDnTpcIiwgZXJyKTtcclxuICB9XHJcblxyXG4gIC8vY29uc3QgYm9keURhdGEgPSBKU09OLnN0cmluZ2lmeSh7IGRhdGE6IENzSW1nRGF0YUZvckZldGNoIH0pO1xyXG5cclxuICB0cnkge1xyXG5cclxuICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICBjb25zb2xlLmxvZyhgPC0tZmV0Y2ghLS0+XFxuIHRvdGFsOiAke0NzSW1nRGF0YS5sZW5ndGh9XFxubGV2ZWw6JHtnZXRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlKCkgfWApO1xyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2ltYWdlLWludGVyY2VwdG9yLWRldmVsb3AtNjgzODU3MTk0Njk5LmFzaWEtbm9ydGhlYXN0My5ydW4uYXBwXCIsIHtcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgYm9keTogZm9ybURhdGFcclxuICAgIH0pO1xyXG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihcIuyEnOuyhCDsnZHri7Ug7Jik66WYXCIpOy8vIGNhdGNo66GcIOydtOuPmVxyXG4gICAgY29uc29sZS5sb2coYHJlc3BvbnNlIGRlbGF5dGltZTogJHsocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLyAxMDAwfWApO1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlQm9keURhdGEgPSBhd2FpdCByZXMuanNvbigpPy50aGVuKHJlc3VsdCA9PiB7IHJldHVybiByZXN1bHQ/LmltYWdlIH0pO1xyXG4gICAgaWYgKHJlc3BvbnNlQm9keURhdGEubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgY29uc3QgcHJvY2Vzc2VkUmVzQm9keURhdGEgPSBuZXcgTWFwKHJlc3BvbnNlQm9keURhdGEubWFwKChlbCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbZWwudXJsLCB7IHVybDogZWwudXJsLCByZXNwb25zZTogdHJ1ZSwgc3RhdHVzOiBlbC5zdGF0dXMsIGhhcm1mdWw6IGVsLmhhcm1mdWwgfV07XHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICAgIHByb3BhZ2F0ZVJlc0JvZHlEYXRhKHByb2Nlc3NlZFJlc0JvZHlEYXRhKTtcclxuXHJcbiAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiY2F1c2UgLSBmZXRjaCByZXNwb25zZTogYm9keWRhdGEg7JeG7J2MXCIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcclxuICAgICAgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcclxuICAgICAgICA/IGBKU09OIHBhcnNpbmcgZmFpbGVkOiAke2Vyci5tZXNzYWdlfWBcclxuICAgICAgICA6IGBSZXF1ZXN0IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuLy8gUkVRVUVTVCBEQVRBXHJcbi8vIFtcclxuLy8gICB7XHJcbi8vICAgICBjYW5vbmljYWxVcmw6IGl0ZW0uY2Fub25pY2FsVXJsLFxyXG4vLyAgICAgICB1cmw6IGl0ZW0udXJsLFxyXG4vLyAgICAgICAgIHN0YXR1czogZmFsc2UsXHJcbi8vICAgICAgICAgICBoYXJtZnVsOiBmYWxzZVxyXG4vLyAgIH1cclxuLy8gXVxyXG4vLyBSRVNQT05TRSBEQVRBIGV4YW1wbGVcclxuLy8ge1xyXG4vLyAgICAgXCJkYXRhXCI6IFtcclxuLy8gICAgICAgICB7XHJcbi8vICAgICAgICAgICAgIFwiY2Fub25pY2FsVXJsXCI6IFwiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9wYWdlYWQvMXAtdXNlci1saXN0Lzk2Mjk4NTY1Ni8/YmFja2VuZD1pbm5lcnR1YmUmY25hbWU9MSZjdmVyPTJfMjAyNTA4MDcmZGF0YT1iYWNrZW5kJTNEaW5uZXJ0dWJlJTNCY25hbWUlM0QxJTNCY3ZlciUzRDJfMjAyNTA4MDclM0JlbCUzRGFkdW5pdCUzQnB0eXBlJTNEZl9hZHZpZXclM0J0eXBlJTNEdmlldyUzQnV0dWlkJTNEdGR6OUxXTk5RS1VnNFhwbWFfNDBVZyUzQnV0dmlkJTNENEJ5SjB6M1VNTkUmaXNfdnRjPTAmcHR5cGU9Zl9hZHZpZXcmcmFuZG9tPTQyODc2NjQ5NiZ1dHVpZD10ZHo5TFdOTlFLVWc0WHBtYV80MFVnXCIsXHJcbi8vICAgICAgICAgICAgIFwidXJsXCI6IFwiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9wYWdlYWQvMXAtdXNlci1saXN0Lzk2Mjk4NTY1Ni8/YmFja2VuZD1pbm5lcnR1YmUmY25hbWU9MSZjdmVyPTJfMjAyNTA4MDcmZGF0YT1iYWNrZW5kJTNEaW5uZXJ0dWJlJTNCY25hbWUlM0QxJTNCY3ZlciUzRDJfMjAyNTA4MDclM0JlbCUzRGFkdW5pdCUzQnB0eXBlJTNEZl9hZHZpZXclM0J0eXBlJTNEdmlldyUzQnV0dWlkJTNEdGR6OUxXTk5RS1VnNFhwbWFfNDBVZyUzQnV0dmlkJTNENEJ5SjB6M1VNTkUmaXNfdnRjPTAmcHR5cGU9Zl9hZHZpZXcmcmFuZG9tPTQyODc2NjQ5NiZ1dHVpZD10ZHo5TFdOTlFLVWc0WHBtYV80MFVnXCIsXHJcbi8vICAgICAgICAgICAgIFwic3RhdHVzXCI6IHRydWUsXHJcbi8vICAgICAgICAgICAgIFwiaGFybWZ1bFwiOiBmYWxzZSxcclxuLy8gICAgICAgICAgICAgXCJjYXRlZ29yeVwiOiBcIm1lZGljYWxcIixcclxuLy8gICAgICAgICAgICAgXCJzY29yZVwiOiAwLjQsXHJcbi8vICAgICAgICAgICAgIFwiZGV0YWlsc1wiOiB7XHJcbi8vICAgICAgICAgICAgICAgICBcImFkdWx0XCI6IDEsXHJcbi8vICAgICAgICAgICAgICAgICBcInNwb29mXCI6IDEsXHJcbi8vICAgICAgICAgICAgICAgICBcIm1lZGljYWxcIjogMixcclxuLy8gICAgICAgICAgICAgICAgIFwidmlvbGVuY2VcIjogMixcclxuLy8gICAgICAgICAgICAgICAgIFwicmFjeVwiOiAyXHJcbi8vICAgICAgICAgICAgIH0sXHJcbi8vICAgICAgICAgICAgIFwicHJvY2Vzc2VkXCI6IHRydWUsXHJcbi8vICAgICAgICAgICAgIFwiZXJyb3JcIjogZmFsc2UsXHJcbi8vICAgICAgICAgICAgIFwiZXJyb3JfbWVzc2FnZVwiOiBudWxsLFxyXG4vLyAgICAgICAgICAgICBcImVycm9yX3R5cGVcIjogbnVsbFxyXG4vLyAgICAgICAgIH1cclxuLy8gICAgIF0sXHJcbi8vICAgICBcInN1bW1hcnlcIjoge1xyXG4vLyAgICAgICAgIFwidG90YWxcIjogMSxcclxuLy8gICAgICAgICBcInByb2Nlc3NlZFwiOiAxLFxyXG4vLyAgICAgICAgIFwiaGFybWZ1bFwiOiAwLFxyXG4vLyAgICAgICAgIFwic2FmZVwiOiAxLFxyXG4vLyAgICAgICAgIFwiZXJyb3JzXCI6IDAsXHJcbi8vICAgICAgICAgXCJlcnJvcl90eXBlc1wiOiB7fVxyXG4vLyAgICAgfSxcclxuLy8gICAgIFwibWVzc2FnZVwiOiBcIuy0nSAx6rCcIOydtOuvuOyngCDspJEgMeqwnCDsspjrpqwg7JmE66OMICjrsLDsuZggQVBJIO2YuOy2nDogMe2ajOuhnCAx6rCcIOydtOuvuOyngCDrj5nsi5wg7LKY66asKVwiXHJcbi8vIH1cclxuIiwiXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbih1cmwsIG51bU9mSGFybWZ1bEltZykge1xyXG4gIGNvbnN0IHN0b3JlZERhdGEgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLmdldChbJ251bU9mSGFybWZ1bEltZ0luUGFnZSddKTtcclxuICBsZXQgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlID0gc3RvcmVkRGF0YS5udW1PZkhhcm1mdWxJbWdJblBhZ2UgfHwge307XHJcblxyXG4gIGNvbnNvbGUubG9nKG51bU9mSGFybWZ1bEltZ0luUGFnZSk7XHJcblxyXG4gIGlmICh1cmwgaW4gbnVtT2ZIYXJtZnVsSW1nSW5QYWdlKSB7XHJcbiAgICBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSArPSBudW1PZkhhcm1mdWxJbWc7XHJcbiAgfSBlbHNlIHtcclxuICAgIG51bU9mSGFybWZ1bEltZ0luUGFnZVt1cmxdID0gbnVtT2ZIYXJtZnVsSW1nO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5zZXQoeyAnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJzogbnVtT2ZIYXJtZnVsSW1nSW5QYWdlIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24odXJsKSB7XHJcbiAgICBjb25zdCBzdG9yZWREYXRhID0gYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5nZXQoWydudW1PZkhhcm1mdWxJbWdJblBhZ2UnXSk7XHJcblxyXG4gICAgIGxldCBudW1PZkhhcm1mdWxJbWdJblBhZ2UgPSBzdG9yZWREYXRhLm51bU9mSGFybWZ1bEltZ0luUGFnZSB8fCB7fTtcclxuICAgICBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA9IDA7XHJcblxyXG4gICAgICBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLnNldCh7ICdudW1PZkhhcm1mdWxJbWdJblBhZ2UnOiBudW1PZkhhcm1mdWxJbWdJblBhZ2UgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXROdW1PZkhhcm1mdWxJbWdJbnRoaXNwYWdlKHVybCkge1xyXG4gICAgY29uc3Qgc3RvcmVkRGF0YSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uZ2V0KFsnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJ10pO1xyXG4gICAgbGV0IG51bU9mSGFybWZ1bEltZ0luUGFnZSA9IHN0b3JlZERhdGEubnVtT2ZIYXJtZnVsSW1nSW5QYWdlIHx8IHt9O1xyXG5cclxuICAgIHJldHVybiBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA/IG51bU9mSGFybWZ1bEltZ0luUGFnZVt1cmxdIDogMDtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZFRvdGFsTnVtT2ZIYXJtZnVsSW1nKG51bSkge1xyXG5cclxuICAgIGNvbnN0IHRvdGFsTnVtT2ZIYXJtZnVsSW1nID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsndG90YWxOdW1PZkhhcm1mdWxJbWcnXSkudGhlbihyZXN1bHQgPT4gcmVzdWx0LnRvdGFsTnVtT2ZIYXJtZnVsSW1nKTtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7J3RvdGFsTnVtT2ZIYXJtZnVsSW1nJzoodG90YWxOdW1PZkhhcm1mdWxJbWcrIG51bSl9KTtcclxufVxyXG5cclxuIiwiXHJcbmltcG9ydCB7dXBkYXRlREIgfSBmcm9tICcuLi9tb2R1bGVzL2luZGV4RGIuanMnO1xyXG5pbXBvcnQge2NoZWNrVGltZUFuZFJlZmV0Y2h9IGZyb20gJy4uL21vZHVsZXMvcmVxdWVzdEltZ0FuYWx5emUuanMnO1xyXG5pbXBvcnQgeyBDc0JhdGNoRm9yV2FpdGluZyB9IGZyb20gJy4uL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzJztcclxuaW1wb3J0IHtzZXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uLCBhZGRUb3RhbE51bU9mSGFybWZ1bEltZ30gZnJvbSAnLi4vdXRpbHMvYmFja2dyb3VuZFV0aWxzLmpzJ1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb3BhZ2F0ZVJlc0JvZHlEYXRhKHJlc3BvbnNlRGF0YSkge1xyXG4gICAgY29uc3QgcmVhZHlUb1NlbmQgPSBuZXcgTWFwKCk7IC8vIHRhYmlkIDogW2ltZ0RhdGEsIC4uLi5dXHJcbiAgICBjb25zdCBudW1PZkhhcm1mdWxJbWdJblBhZ2VNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICBsZXQgdG90YWxOdW1PZkhhcm1mdWxXYWl0aW5nSW1nID0gMDtcclxuICAgIHVwZGF0ZURCKHJlc3BvbnNlRGF0YSk7XHJcblxyXG4gICAgZm9yIChjb25zdCBbdXJsLCBpbWdEYXRhXSBvZiBDc0JhdGNoRm9yV2FpdGluZykge1xyXG4gICAgICAgIGlmIChyZXNwb25zZURhdGEuaGFzKHVybFsxXSkpIHtcclxuICAgICAgICAgICAgY29uc3QgaW1nUmVzRGF0YSA9IHJlc3BvbnNlRGF0YS5nZXQodXJsWzFdKTtcclxuICAgICAgICAgICAgbGV0IGZyYW1lcztcclxuICAgICAgICAgICAgaW1nRGF0YS5zdGF0dXMgPSBpbWdSZXNEYXRhLnN0YXR1cztcclxuICAgICAgICAgICAgaW1nRGF0YS5oYXJtZnVsID0gaW1nUmVzRGF0YS5oYXJtZnVsO1xyXG5cclxuICAgICAgICAgICAgaWYgKGltZ1Jlc0RhdGEuaGFybWZ1bCkge1xyXG4gICAgICAgICAgICAgICAgaWYoIW51bU9mSGFybWZ1bEltZ0luUGFnZU1hcC5oYXModXJsWzBdKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwLnNldCh1cmxbMF0sMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwLnNldCh1cmxbMF0sIG51bU9mSGFybWZ1bEltZ0luUGFnZU1hcC5nZXQodXJsWzBdKSsxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFyZWFkeVRvU2VuZC5nZXQoaW1nRGF0YS50YWJJZCkpIHtcclxuICAgICAgICAgICAgICAgIGZyYW1lcyA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgICAgIGZyYW1lcy5zZXQoaW1nRGF0YS5mcmFtZUlkLCBbaW1nRGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgcmVhZHlUb1NlbmQuc2V0KGltZ0RhdGEudGFiSWQsIGZyYW1lcyk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZnJhbWVzID0gcmVhZHlUb1NlbmQuZ2V0KGltZ0RhdGEudGFiSWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmcmFtZXMuZ2V0KGltZ0RhdGEuZnJhbWVJZCkpIGZyYW1lcy5zZXQoaW1nRGF0YS5mcmFtZUlkLCBbaW1nRGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBmcmFtZXMuZ2V0KGltZ0RhdGEuZnJhbWVJZCkucHVzaChpbWdEYXRhKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgQ3NCYXRjaEZvcldhaXRpbmcuZGVsZXRlKHVybFsxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc2VuZFdhaXRpbmdDc0RhdGFUb0NzKHJlYWR5VG9TZW5kKTsvLy50aGVuKHJlcyA9PiB7IGNvbnNvbGUubG9nKFwicmVzcG9uc2Ugc3RhdHVzKFdhaXRpbmdDc0RhdGEgU2VuZGVkKTogXCIsIHJlcyk7IH0pY29udGVudHNjcmlwdOyZgCBydW50aW1lbWVzc2FnZSDqtZDsi6BcclxuICAgIC8vY2hlY2tUaW1lQW5kUmVmZXRjaCgpO1xyXG4gICAgXHJcbiAgICBmb3IoY29uc3QgW3BhZ2VVcmwsIGNvdW50XSBvZiBudW1PZkhhcm1mdWxJbWdJblBhZ2VNYXApIHtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKFwicGFnZUNvdW50SW5mb1xcblwiK3BhZ2VVcmwrJ1xcbicrY291bnQpO1xyXG4gICAgICAgIGF3YWl0IHNldE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24ocGFnZVVybCxjb3VudCk7Ly9tdXR1YWwgZXhjbHVzaW9u66GcIOyduO2VnCBhd2FpdC4g64KY7KSR7JeQIOqzteycoCBwcm9taXNl66W8IOyDneyEse2VtOyEnCDshJzruYTsiqTsm4zsu6Tsl5DshJwg6riw64uk66as64qUIOydvOydtCDsl4bqsowg66eM65OkIOyImOuPhCDsnojsnYxcclxuICAgICAgICB0b3RhbE51bU9mSGFybWZ1bFdhaXRpbmdJbWcrPSBjb3VudDtcclxuICAgIH1cclxuICAgYWRkVG90YWxOdW1PZkhhcm1mdWxJbWcodG90YWxOdW1PZkhhcm1mdWxXYWl0aW5nSW1nKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIu2YhOyerCDquLDri6Trpqzqs6Ag7J6I64qUIGNvbnRlbnQ6IFwiICsgQ3NCYXRjaEZvcldhaXRpbmcuc2l6ZSk7XHJcbn1cclxuXHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZW5kV2FpdGluZ0NzRGF0YVRvQ3MocmVhZHlEYXRhKSB7XHJcbiAgICBsZXQgc2VuZERhdGE7XHJcbiAgICBsZXQgc2VuZERhdGFPbmU7XHJcbiAgICBjb25zdCByZXN1bHQgPSBbXTtcclxuICAgIGZvciAoY29uc3QgdGFiSWQgb2YgcmVhZHlEYXRhLmtleXMoKSkge1xyXG4gICAgICAgIHNlbmREYXRhID0gcmVhZHlEYXRhLmdldCh0YWJJZCk7XHJcbiAgICAgICAgZm9yIChjb25zdCBmcmFtZUlkIG9mIHNlbmREYXRhLmtleXMoKSkge1xyXG4gICAgICAgICAgICBzZW5kRGF0YU9uZSA9IHNlbmREYXRhLmdldChmcmFtZUlkKTtcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCxcclxuICAgICAgICAgICAgICAgICAgICB7IHR5cGU6IFwiaW1nRGF0YVdhaXRpbmdGcm9tU2VydmljZVdvcmtcIiwgZGF0YTogc2VuZERhdGFPbmUgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZyYW1lSWQgfVxyXG4gICAgICAgICAgICAgICAgKSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghZS5tZXNzYWdlLmluY2x1ZGVzKCdDb3VsZCBub3QgZXN0YWJsaXNoIGNvbm5lY3Rpb24nKSkgY29uc29sZS5lcnJvcihcImNvbnRlbnRzY3JpcHQg7J2R64u1IOyYpOulmFt0eXBlOiB3YXRpbmcgZGF0YV06IFwiLCBlKTsvL1JlY2VpdmluZyBlbmQgZG9lcyBub3QgZXhpc3Qg4oaSIOyeoOyLnCDtm4Qg7J6s7Iuc64+EXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coXCJjb250ZW50c2NyaXB0IOydkeuLtSDqsrDqs7xbdHlwZTogd2F0aW5nIGRhdGFdXCIpO1xyXG4gICAgcmVzdWx0LmZvckVhY2gocmVzID0+IHsgY29uc29sZS5sb2cocmVzKTsgfSk7XHJcbiAgICBjb25zb2xlLmxvZyhcIuy0nSDsiJjrn4k6IFwiLCByZXN1bHQubGVuZ3RoKTtcclxuXHJcbiAgfVxyXG5cclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJcclxuaW1wb3J0ICogYXMgaW5kZXhEYiBmcm9tICcuL21vZHVsZXMvaW5kZXhEYi5qcyc7XHJcbmltcG9ydCB7IENzQmF0Y2hGb3JXYWl0aW5nLCBzZXRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlIH0gZnJvbSAnLi9nbG9iYWwvYmFja2dyb3VuZENvbmZpZy5qcyc7XHJcbmltcG9ydCB7IGZldGNoQmF0Y2ggfSBmcm9tICcuL21vZHVsZXMvcmVxdWVzdEltZ0FuYWx5emUuanMnO1xyXG5pbXBvcnQge3NldE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24sIGluaXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9ufSBmcm9tICcuL3V0aWxzL2JhY2tncm91bmRVdGlscy5qcydcclxuXHJcbmNvbnN0IGN1cnJlbnRUYWJzID0gbmV3IE1hcCgpO1xyXG5jb25zdCBjb250cm9sTWVudUltZ1N0YXR1c0xpc3QgPSBuZXcgTWFwKCk7XHJcbmNvbnN0IHJldHJ5VGhyZXNob2xkID0gMTUgKiAxMDAwO1xyXG5cclxuXHJcblxyXG5jb25zdCBjb250ZXh0Q29udHJvbE1lbnUgPSB7XHJcbiAgJ0ltZ1Nob3cnOiAn7J2066+47KeAIOuztOydtOq4sCcsXHJcbiAgJ0ltZ0hpZGUnOiAn7J2066+47KeAIOqwkOy2lOq4sCcsXHJcbn1cclxuXHJcbmxldCBjbGlja2VkSW1nU3JjID0gbnVsbDtcclxubGV0IGlzSW50ZXJjZXB0b3JBY3RpdmUgPSB0cnVlO1xyXG5sZXQgc3RvcmVkSW50ZXJjZXB0b3JTdGF0dXMgPSBudWxsO1xyXG4vL1xyXG5sZXQgdG90YWxpbWcgPSAwO1xyXG5sZXQgaW50ZXJjZXB0b3JTaXRlID0gbnVsbDtcclxubGV0IHRvdGFsTnVtT2ZIYXJtZnVsSW1nO1xyXG5cclxuXHJcblxyXG4vL+y0iOq4sO2ZlCDsvZTrk5xcclxuLy/ruYTrj5nquLAg7KSA67mEIOyekeyXheydtCDsmYTro4zrkJjslrTslbwg64uk7J2MIOy9lOuTnOulvCDsi6TtlontlaAg7IiYIOyeiOuKlCDtlITroZzrp4jsnbTsiqQg6rCd7LK0KHJlc29sdmVk6rCAIOuwmO2ZmOuQmOyWtOyVvCDtlagpLiDtlajsiJgg7J6Q7LK064qUIOuwlOuhnCDsi6TtlolcclxubGV0IFByb21pc2VGb3JJbml0ID0gaW5kZXhEYi5pbml0SW5kZXhEYigpO1xyXG5cclxuZnVuY3Rpb24gZ2V0UGFnZVVybEZyb21UYWJJZCh0YWJJZCkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHtcclxuICAgIGNocm9tZS50YWJzLmdldCh0YWJJZCwgKHRhYikgPT4ge1xyXG4gICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcclxuICAgICAgIGVsc2UgcmVzb2x2ZSh0YWIudXJsKTtcclxuICAgIH0pO1xyXG4gIH0pXHJcbn1cclxuXHJcblxyXG5hc3luYyBmdW5jdGlvbiBjaGVja0NzRGF0YSh0YWJJZCwgZnJhbWVJZCwgYmF0Y2gpIHtcclxuICBcclxuICB0cnkge1xyXG4gICAgYXdhaXQgUHJvbWlzZUZvckluaXQ7IC8vZGIgaW5pdCDtlITroZzrr7jsiqQg6riw64uk66a8LiBcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgXHJcbiAgXHJcbiAgXHJcbiAgY29uc3QgcGFnZVVybCA9IGF3YWl0IGdldFBhZ2VVcmxGcm9tVGFiSWQodGFiSWQpLnRoZW4ocGFnZVVybD0+cGFnZVVybCkuY2F0Y2goZXJyPT57Y29uc29sZS5lcnJvcihlcnIpO30pO1xyXG4gIFxyXG4gIFxyXG4gIGNvbnN0IENzQmF0Y2hGb3JEQkFkZCA9IFtdO1xyXG4gIFxyXG4gIGxldCBudW1PZkhhcm1mdWxJbWcgPSAwO1xyXG4gIFxyXG4gIGxldCBjc0JhdGNoRm9yUmVzcG9uc2UgPSBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgIFxyXG4gICAgYmF0Y2gubWFwKGFzeW5jIChpdGVtKSA9PiB7XHJcbiAgICAgIGNvbnN0IHR4ID0gaW5kZXhEYi5EQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgaWYgKGluZGV4RGIua2V5U2V0LmhhcyhpdGVtLnVybCkpIHtcclxuICAgICAgICAgIFxyXG5cclxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgaW5kZXhEYi5yZXFUYWJsZVByb21pc2Uoc3RvcmUuZ2V0KGl0ZW0udXJsKSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwidGFibGXsl5DshJwga2V5IOyhsO2ajO2VmOqzoCB2YWx1ZSDqsIDsoLjsmKTripQg7KSR7JeQIEVycm9yIOuwnOyDnTpcIiwgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBpZiAoIXZhbHVlLnJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi642w7J207YSwIOuyoOydtOyKpOyXkCDsnojsp4Drp4wg7J2R64u17J2EIOuwm+yngCDrqrvtlZwgIGltZyBpZDogXCIgKyBpdGVtLmlkKTtcclxuICAgICAgICAgICAgaWYgKHJldHJ5VGhyZXNob2xkIDwgKERhdGUubm93KCkgLSB2YWx1ZS5zYXZlVGltZSkpIHtcclxuICAgICAgICAgICAgICBDc0JhdGNoRm9yREJBZGQucHVzaChpdGVtKTsgLy/rhIjrrLQg7Jik656r64+Z7JWIIOydkeuLteydhCDrjIDquLDtlZjqs6Ag7J6I64qUIOuNsOydtO2EsOyYgOuLpOuptCwg7J6s7JqU7LKtIOuwsOy5mOyXkCDstpTqsIBcclxuICAgICAgICAgICAgICB2YWx1ZS5zYXZlVGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW5kZXhEYi5yZXFUYWJsZVByb21pc2Uoc3RvcmUucHV0KHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaXRlbS50YWJJZCA9IHRhYklkO1xyXG4gICAgICAgICAgICBpdGVtLmZyYW1lSWQgPSBmcmFtZUlkO1xyXG4gICAgICAgICAgICBDc0JhdGNoRm9yV2FpdGluZy5zZXQoW3BhZ2VVcmwsaXRlbS51cmxdLCBpdGVtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuuNsOydtO2EsCDrsqDsnbTsiqTsl5Ag7J6I64qUIGltZyBpZDogXCIgKyBpdGVtLmlkICsgXCLsg4Htg5wv7Jyg7ZW0L+ydkeuLtTogXCIgKyB2YWx1ZS5zdGF0dXMgKyBcIiZcIiArIHZhbHVlLmhhcm1mdWwgKyBcIiZcIiArIHZhbHVlLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLnN0YXR1cykge1xyXG4gICAgICAgICAgICAgIGl0ZW0uc3RhdHVzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICBpZiAodmFsdWUuaGFybWZ1bCkge1xyXG4gICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nKys7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmhhcm1mdWwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coXCLrjbDsnbTthLAg67Kg7J207Iqk7JeQIOyXhuuKlCBpbWcgaWQ6IFwiICsgaXRlbS5pZCk7XHJcbiAgICAgICAgICBjb25zdCBjYWNoQ2hlY2sgPSBhd2FpdCBjYWNoZXMubWF0Y2goaXRlbS51cmwpO1xyXG5cclxuICAgICAgICAgIGlmIChjYWNoQ2hlY2spIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjYWNoIO2ZleyduCDqsrDqs7wsIOydvOy5mO2VmOuKlCB1cmzsnojsnYxcIik7XHJcbiAgICAgICAgICAgIC8v7ZiE7J6sIOydtCDrtoDrtoTsnbQg7KCc64yA66GcIOuPmeyeke2VmOuKlOyngCwg7Jyg7Zqo7ISx7J20IOyeiOuKlOyngCDsnpgg66qo66W06rKg7J2MLiBcclxuICAgICAgICAgICAgLy/rp4zslb3sl5AgY2FjaOqwgCDsobTsnqztlZzri6TrqbQgZGLsl5Ag7ZW064u5IOydtOuvuOyngCDrjbDsnbTthLAg7LaU6rCALCDqt7jrpqzqs6AgXHJcbiAgICAgICAgICAgIC8vY3NCYXRjaEZvclJlc3BvbnNl7JeQ64+EIOy2lOqwgFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBpbmRleERiLmtleVNldC5hZGQoaXRlbS51cmwpO1xyXG4gICAgICAgICAgICAvL+uNsOydtO2EsCDsl4bsnYwuIERCIOy2lOqwgO2VmOqzoCBmZXRjaFxyXG5cclxuXHJcbiAgICAgICAgICAgIGl0ZW0udGFiSWQgPSB0YWJJZDtcclxuICAgICAgICAgICAgaXRlbS5mcmFtZUlkID0gZnJhbWVJZDtcclxuICAgICAgICAgICAgQ3NCYXRjaEZvcldhaXRpbmcuc2V0KFtwYWdlVXJsLGl0ZW0udXJsXSwgaXRlbSk7IC8vZmV0Y2jtlaAg642w7J207YSw64+EIOqysOq1rSByZXNwb25zZSA9IGZhbHNl7J24IOuNsOydtO2EsOyZgCDtlajqu5ggY3NiYXRjaGZvcndhaXRpbmfsl5DshJwg6riw64uk66a8XHJcblxyXG4gICAgICAgICAgICBDc0JhdGNoRm9yREJBZGQucHVzaChpdGVtKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLsnbTrr7jsp4Ag67mE6rWQ7KSRIOyXkOufrDogXCIsIGUsIFwiXFxuVVJMOiBcIiwgaXRlbS51cmwpO1xyXG4gICAgICB9XHJcbiAgICB9KSk7XHJcblxyXG4gIGlmIChDc0JhdGNoRm9yREJBZGQ/Lmxlbmd0aCAhPSAwKSB7XHJcblxyXG4gICAgY29uc3QgdHggPSBpbmRleERiLkRCLnRyYW5zYWN0aW9uKCdpbWdVUkwnLCAncmVhZHdyaXRlJyk7XHJcbiAgICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuXHJcbiAgICBDc0JhdGNoRm9yREJBZGQuZm9yRWFjaChpbWdkYXRhID0+IHtcclxuICAgICAgc3RvcmUucHV0KFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHVybDogaW1nZGF0YS51cmwsXHJcbiAgICAgICAgICBkb21haW46IChuZXcgVVJMKGltZ2RhdGEudXJsKSkuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcLi8sICcnKSwvL+yImOygleyYiOyglSxcclxuICAgICAgICAgIHJlc3BvbnNlOiBmYWxzZSxcclxuICAgICAgICAgIHN0YXR1czogZmFsc2UsICAgLy8g6rKA7IKs7JmE66OMXHJcbiAgICAgICAgICBoYXJtZnVsOiBmYWxzZSwgICAvLyDquLDrs7jqsJJcclxuICAgICAgICAgIHNhdmVUaW1lOiBEYXRlLm5vdygpXHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZmV0Y2hCYXRjaChDc0JhdGNoRm9yREJBZGQsIHRhYklkKTtcclxuICAgIC8vZGIg7LaU6rCA7ZaI7Jy864uIIGZldGNoLlxyXG4gIH1cclxuXHJcbiAgLy9jb25zb2xlLmxvZyhcInBhZ2VDb3VudEluZm9cXG5cIitwYWdlVXJsKydcXG4nK251bU9mSGFybWZ1bEltZyk7XHJcbiAgc2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbihwYWdlVXJsLCBudW1PZkhhcm1mdWxJbWcpO1xyXG5cclxuXHJcbiAgLy9jb25zdCBkZWxheSA9IGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAyMDApKTtcclxuXHJcbiAgY3NCYXRjaEZvclJlc3BvbnNlID0gY3NCYXRjaEZvclJlc3BvbnNlLmZpbHRlcih4ID0+IHggIT09IHVuZGVmaW5lZCk7XHJcbiAgY29uc29sZS5sb2coJ1JlY2VpdmluZyAgcmVxdWVzdDonLCBiYXRjaCk7XHJcbiAgY29uc29sZS5sb2coJ1NlbmRpbmcgcmVzcG9uc2U6JywgY3NCYXRjaEZvclJlc3BvbnNlKTtcclxuICByZXR1cm4gY3NCYXRjaEZvclJlc3BvbnNlOyAvL+uwm+ydgCDrsLDsuZgg7KSR7JeQ7IScIOuwlOuhnCDsnZHri7XtlaAg7J2066+47KeAIOqwneyytOunjCDrhKPslrTshJwgcmV0dXJuXHJcbn1cclxuXHJcblxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL2V2ZW50IGxpc3Rlci8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy/svZjthZDsuKAg7Iqk7YGs66a97Yq4IOumrOyKpOuEiFxyXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XHJcbiAgaWYgKG1lc3NhZ2Uuc291cmNlID09PSBcImNvbnRlbnRcIikge1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIHN3aXRjaCAobWVzc2FnZT8udHlwZSkge1xyXG5cclxuICAgICAgICBjYXNlIFwiaW1nRGF0YUZyb21Db250ZW50U2NyaXB0XCI6XHJcbiAgICAgICAgICBjaGVja0NzRGF0YShzZW5kZXI/LnRhYj8uaWQsIHNlbmRlcj8uZnJhbWVJZCwgbWVzc2FnZS5kYXRhKS50aGVuKGJhdGNoRnJvbVNjcmlwdCA9PiB7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJyZXNwb25zZVwiLFxyXG4gICAgICAgICAgICAgIGRhdGE6IGJhdGNoRnJvbVNjcmlwdCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBjYXNlIFwicmVnaXN0ZXJfZnJhbWVcIjpcclxuICAgICAgICAgIGlmICghY3VycmVudFRhYnMuZ2V0KHNlbmRlcj8udGFiPy5pZCkpIHtcclxuICAgICAgICAgICAgY3VycmVudFRhYnMuc2V0KHNlbmRlcj8udGFiPy5pZCwgW3NlbmRlcj8uZnJhbWVJZF0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudFRhYnMuZ2V0KHNlbmRlcj8udGFiPy5pZCkuaW5jbHVkZXMoc2VuZGVyPy5mcmFtZUlkKSkge1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRUYWJzLmdldChzZW5kZXI/LnRhYj8uaWQpLnB1c2goc2VuZGVyPy5mcmFtZUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGdldFBhZ2VVcmxGcm9tVGFiSWQoc2VuZGVyPy50YWI/LmlkKS50aGVuKHBhZ2VVcmw9PntcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocGFnZVVybCk7XHJcbiAgICAgICAgICAgIGluaXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uKHBhZ2VVcmwpO1xyXG4gICAgICAgICAgfSkuY2F0Y2goZXJyPT57Y29uc29sZS5lcnJvcihlcnIpO30pO1xyXG5cclxuICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiB0cnVlIH0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgXCJtYWluQ29udHJvbE1lbnVcIjpcclxuICAgICAgICAgIGlmIChtZXNzYWdlLmltZ1NyYykge1xyXG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMucmVtb3ZlQWxsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgIGlkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgICAgICAgICAgICAgICAgdGl0bGU6ICdJbWFnZUludGVyY2VwdG9yIC0g7Jyg7ZW0IOydtOuvuOyngCDssKjri6gg7ZSE66Gc6re4656oJyxcclxuICAgICAgICAgICAgICAgICAgY29udGV4dHM6IFsnYWxsJ11cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW21lbnVJZCwgbWVudVRpdGxlXSBvZiBPYmplY3QuZW50cmllcyhjb250ZXh0Q29udHJvbE1lbnUpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbWVudUlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudElkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogbWVudVRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdyYWRpbycsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dHM6IFsnYWxsJ11cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5oYXMobWVzc2FnZS5pbWdTcmMpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5zZXQobWVzc2FnZS5pbWdTcmMsIG1lc3NhZ2UuaXNTaG93ID09PSB0cnVlID8gJ0ltZ1Nob3cnIDogJ0ltZ0hpZGUnKTtcclxuICAgICAgICAgICAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy51cGRhdGUobWVzc2FnZS5pc1Nob3cgPT09IHRydWUgPyAnSW1nU2hvdycgOiAnSW1nSGlkZScsIHsgY2hlY2tlZDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJuZXcgaW1nXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGFub3RoZXJJdGVtU3RhdHVzID0gY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LmdldChtZXNzYWdlLmltZ1NyYykgPT09ICdJbWdTaG93JyA/ICdJbWdIaWRlJyA6ICdJbWdTaG93JztcclxuICAgICAgICAgICAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy51cGRhdGUoY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LmdldChtZXNzYWdlLmltZ1NyYykgPT09ICdJbWdTaG93JyA/ICdJbWdTaG93JyA6ICdJbWdIaWRlJywgeyBjaGVja2VkOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJpbWcg7KG07J6sOiBcIiArIG1lc3NhZ2UuaW1nU3JjKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjbGlja2VkSW1nU3JjID0gbWVzc2FnZS5pbWdTcmM7XHJcblxyXG5cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICBjYXNlIFwiY2hlY2tfYmxhY2tfbGlzdFwiOlxyXG4gICAgICAgICAgbGV0IGlzSW5CbGFja0xpc3QgPSBmYWxzZTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcmNlcHRvclNpdGUuaGFzKG1lc3NhZ2Uuc2l0ZSkpIHtcclxuICAgICAgICAgICAgICBjb25zdCB0YXJnZXRTaXRlID0gaW50ZXJjZXB0b3JTaXRlLmdldChtZXNzYWdlLnNpdGUpO1xyXG4gICAgICAgICAgICAgIGlmICghdGFyZ2V0U2l0ZVtcImFjdGl2ZVwiXSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLtl4jsmqnrkJjsp4Ag7JWK7J2AIOyCrOydtO2KuFwiKTtcclxuICAgICAgICAgICAgICAgIGlzSW5CbGFja0xpc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRTaXRlW1wicGFnZVwiXS5pbmNsdWRlcyhtZXNzYWdlLnBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7ZeI7Jqp65CY7KeAIOyViuydgCDtjpjsnbTsp4BcIik7XHJcbiAgICAgICAgICAgICAgICAgIGlzSW5CbGFja0xpc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2Uoe1xyXG4gICAgICAgICAgICAgIG9rOiB0cnVlLFxyXG4gICAgICAgICAgICAgIHJlc3VsdDogaXNJbkJsYWNrTGlzdFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XHJcbiAgICAgICAgICAgICAgb2s6IGZhbHNlLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG5cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG5cclxuXHJcblxyXG5jaHJvbWUucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihhc3luYyAoKSA9PiB7XHJcblxyXG4gIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcclxuICAgIGlkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgIHRpdGxlOiAnSW1hZ2VJbnRlcmNlcHRvciAtIOycoO2VtCDsnbTrr7jsp4Ag7LCo64uoIO2UhOuhnOq3uOueqCcsXHJcbiAgICBjb250ZXh0czogWydhbGwnXVxyXG4gIH0pO1xyXG5cclxuICBmb3IgKGNvbnN0IFttZW51SWQsIG1lbnVUaXRsZV0gb2YgT2JqZWN0LmVudHJpZXMoY29udGV4dENvbnRyb2xNZW51KSkge1xyXG4gICAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xyXG4gICAgICBpZDogbWVudUlkLFxyXG4gICAgICBwYXJlbnRJZDogJ21haW5Db250cm9sTWVudScsXHJcbiAgICAgIHRpdGxlOiBtZW51VGl0bGUsXHJcbiAgICAgIHR5cGU6ICdyYWRpbycsXHJcbiAgICAgIGNvbnRleHRzOiBbJ2FsbCddXHJcbiAgICB9KTtcclxuICB9XHJcbiAgc3RvcmVkSW50ZXJjZXB0b3JTdGF0dXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydpbnRlcmNlcHRvclN0YXR1cyddKTtcclxuICBsZXQgc2F2ZWRTdGF0dXMgPSBzdG9yZWRJbnRlcmNlcHRvclN0YXR1cy5pbnRlcmNlcHRvclN0YXR1cztcclxuICBpZiAoc2F2ZWRTdGF0dXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU3RhdHVzJzogMSB9KTtcclxuICAgIHNhdmVkU3RhdHVzID0gMTtcclxuICB9XHJcbiAgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IHNhdmVkU3RhdHVzID09PSAxID8gdHJ1ZSA6IGZhbHNlO1xyXG4gIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdtYWluQ29udHJvbE1lbnUnLCB7IGVuYWJsZWQ6IGlzSW50ZXJjZXB0b3JBY3RpdmUgfSk7XHJcblxyXG5cclxuICBjb25zdCBzdG9yZWRJbnRlcmNlcHRvclNpdGUgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydpbnRlcmNlcHRvclNpdGUnXSk7XHJcbiAgaWYgKHN0b3JlZEludGVyY2VwdG9yU2l0ZSA9PT0gdW5kZWZpbmVkIHx8IHN0b3JlZEludGVyY2VwdG9yU2l0ZS5pbnRlcmNlcHRvclNpdGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU2l0ZSc6IHt9IH0pO1xyXG4gICAgaW50ZXJjZXB0b3JTaXRlID0gbmV3IE1hcCgpO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGludGVyY2VwdG9yU2l0ZSA9IG5ldyBNYXAoT2JqZWN0LmVudHJpZXMoc3RvcmVkSW50ZXJjZXB0b3JTaXRlLmludGVyY2VwdG9yU2l0ZSkpO1xyXG4gIH0gIFxyXG5cclxuICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWyd0b3RhbE51bU9mSGFybWZ1bEltZyddKS50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICBpZiAoIXJlc3VsdC50b3RhbE51bU9mSGFybWZ1bEltZykge1xyXG4gICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAndG90YWxOdW1PZkhhcm1mdWxJbWcnOiAwIH0pO31cclxuICB9KTtcclxuXHJcblxyXG4gIGNvbnN0IHN0b3JlZEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydmaWx0ZXJpbmdTdGVwJ10pLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJpbmdTdGVwJzogMSB9KTtcclxuICAgIGxldCB2YWx1ZSA9IHJlc3VsdC5maWx0ZXJpbmdTdGVwO1xyXG4gICAgaWYgKHZhbHVlPT09dW5kZWZpbmVkKSB7XHJcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJpbmdTdGVwJzogMSB9KTtcclxuICAgICAgdmFsdWUgPSAxO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH0pO1xyXG4gIHNldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoc3RvcmVkQ3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSk7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn0pO1xyXG5cclxuXHJcbmNocm9tZS5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKChpdGVtLCB0YWIpID0+IHtcclxuXHJcbiAgaWYgKGNsaWNrZWRJbWdTcmMgPT09IG51bGwpIHtcclxuICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdJbWdTaG93JywgeyBjaGVja2VkOiB0cnVlIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29udHJvbElkID0gaXRlbS5tZW51SXRlbUlkO1xyXG4gIGNvbnN0IGltZ0luZm8gPSB7IHRhYklkOiB0YWIuaWQsIGZyYW1lSWQ6IGl0ZW0uZnJhbWVJZCwgdXJsOiBpdGVtLnNyY1VybCB9O1xyXG5cclxuICBpZiAoY29udHJvbElkID09PSBjb250cm9sTWVudUltZ1N0YXR1c0xpc3QuZ2V0KGNsaWNrZWRJbWdTcmMpKSByZXR1cm47XHJcblxyXG4gIHRyeSB7XHJcbiAgICAvL+y2lOu2gCBwcm9taXNl7LaU6rCAXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKGltZ0luZm8udGFiSWQsIHtcclxuICAgICAgc291cmNlOiBcInNlcnZpY2Vfd29ya2VyXCIsXHJcbiAgICAgIHR5cGU6ICdjb250cm9sX2ltZycsXHJcbiAgICAgIGlzU2hvdzogY29udHJvbElkID09PSAnSW1nU2hvdycgPyB0cnVlIDogZmFsc2VcclxuICAgIH0sIHsgZnJhbWVJZDogaW1nSW5mby5mcmFtZUlkIH0pO1xyXG5cclxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UubWVzc2FnZSk7XHJcbiAgICAgIC8vdGhyb3cgbmV3IEVycm9yKHJlc3BvbnNlLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5zZXQoY2xpY2tlZEltZ1NyYywgY29udHJvbElkKTtcclxuICAgIGNsaWNrZWRJbWdTcmMgPSBudWxsO1xyXG5cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgaWYgKCFlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCdDb3VsZCBub3QgZXN0YWJsaXNoIGNvbm5lY3Rpb24nKSkgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZSgnSW1nU2hvdycsIHsgY2hlY2tlZDogdHJ1ZSB9KTtcclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcblxyXG59KTtcclxuXHJcblxyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFjdGl2ZUludGVyY2VwdG9yKGZsYWcpIHtcclxuICBjb25zdCByZXN1bHQgPSB7IG9rOiB0cnVlLCBtZXNzYWdlOiBbXSB9O1xyXG5cclxuICBmb3IgKGNvbnN0IFt0YWJJZCwgZnJhbWVzXSBvZiBjdXJyZW50VGFicykge1xyXG4gICAgaWYgKCFmcmFtZXMpIGNvbnRpbnVlO1xyXG5cclxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwge1xyXG4gICAgICAgICAgc291cmNlOiBcInNlcnZpY2Vfd29ya2VyXCIsXHJcbiAgICAgICAgICB0eXBlOiAnYWN0aXZlX2ludGVyY2VwdG9yJyxcclxuICAgICAgICAgIGFjdGl2ZTogZmxhZ1xyXG4gICAgICAgIH0sIHsgZnJhbWVJZDogZnJhbWUgfSk7XHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgcmVzdWx0Lm9rID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2gocmVzcG9uc2UubWVzc2FnZSk7XHJcblxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmICghZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnQ291bGQgbm90IGVzdGFibGlzaCBjb25uZWN0aW9uJykpIHJlc3VsdC5vayA9IGZhbHNlO1xyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2goZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0RmlsdGVyU3RhdHVzKGZsYWcpIHtcclxuICBjb25zdCByZXN1bHQgPSB7IG9rOiB0cnVlLCBtZXNzYWdlOiBbXSB9O1xyXG5cclxuICBmb3IgKGNvbnN0IFt0YWJJZCwgZnJhbWVzXSBvZiBjdXJyZW50VGFicykge1xyXG4gICAgaWYgKCFmcmFtZXMpIGNvbnRpbnVlO1xyXG5cclxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwge1xyXG4gICAgICAgICAgc291cmNlOiBcInNlcnZpY2Vfd29ya2VyXCIsXHJcbiAgICAgICAgICB0eXBlOiAnc2V0X2ZpbHRlcl9zdGF0dXMnLFxyXG4gICAgICAgICAgRmlsdGVyU3RhdHVzOiBmbGFnXHJcbiAgICAgICAgfSwgeyBmcmFtZUlkOiBmcmFtZSB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgcmVzdWx0Lm9rID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2gocmVzcG9uc2UubWVzc2FnZSk7XHJcblxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmICghZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnQ291bGQgbm90IGVzdGFibGlzaCBjb25uZWN0aW9uJykpIHJlc3VsdC5vayA9IGZhbHNlO1xyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2goZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLy/tjJ3sl4Ug66as7Iqk64SIXHJcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICBpZiAobWVzc2FnZS5zb3VyY2UgPT09IFwicG9wdXBcIikge1xyXG4gICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsZXQgcmVzcG9uc2VTdGF0dXMgPSB0cnVlO1xyXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgICAgICBjYXNlIFwiYWN0aXZlX2ludGVyY2VwdG9yXCI6XHJcbiAgICAgICAgICAgIHJlc3BvbnNlU3RhdHVzID0gYXdhaXQgYWN0aXZlSW50ZXJjZXB0b3IobWVzc2FnZS5hY3RpdmUpO1xyXG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlU3RhdHVzLm9rKSBjb25zb2xlLmVycm9yKHJlc3BvbnNlU3RhdHVzLm9rKTtcclxuICAgICAgICAgICAgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IG1lc3NhZ2UuYWN0aXZlO1xyXG4gICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZSgnbWFpbkNvbnRyb2xNZW51JywgeyBlbmFibGVkOiBpc0ludGVyY2VwdG9yQWN0aXZlID8gdHJ1ZSA6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogcmVzcG9uc2VTdGF0dXMub2sgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGNhc2UgXCJzZXRfZmlsdGVyX3N0YXR1c1wiOlxyXG4gICAgICAgICAgICByZXNwb25zZVN0YXR1cyA9IGF3YWl0IHNldEZpbHRlclN0YXR1cyhtZXNzYWdlLkZpbHRlclN0YXR1cyk7XHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2VTdGF0dXMub2spIGNvbnNvbGUuZXJyb3IocmVzcG9uc2VTdGF0dXMubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiByZXNwb25zZVN0YXR1cy5vayB9KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlIFwicG9wdXBfZXJyb3JcIjpcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZnJvbSBwb3B1cDogXCIgKyBtZXNzYWdlLmVycm9yKTtcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbiBub3QgcmVhZCBwb3B1cCBtZXNzYWdlIHR5cGVcIik7XHJcbiAgICAgICAgICBjYXNlIFwic3luY19ibGFja19saXN0XCI6XHJcbiAgICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgICBpbnRlcmNlcHRvclNpdGUuc2V0KG1lc3NhZ2Uucm9vdEluc3RhbmNlWzBdLCBtZXNzYWdlLnJvb3RJbnN0YW5jZVsxXSk7XHJcbiAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU2l0ZSc6IE9iamVjdC5mcm9tRW50cmllcyhpbnRlcmNlcHRvclNpdGUpIH0pO1xyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlIFwic2V0X2ZpbHRlcmluZ19zdGVwXCI6XHJcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJpbmdTdGVwJzogbWVzc2FnZS52YWx1ZSB9KTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZS52YWx1ZSk7XHJcbiAgICAgICAgICAgIHNldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUobWVzc2FnZS52YWx1ZSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IGZhbHNlIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG59KTtcclxuXHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==