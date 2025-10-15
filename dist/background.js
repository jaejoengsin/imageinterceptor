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
/* harmony export */   fetchBatch: () => (/* binding */ fetchBatch),
/* harmony export */   refetchBatch: () => (/* binding */ refetchBatch)
/* harmony export */ });
/* harmony import */ var _utils_propagate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/propagate.js */ "./src/js/utils/propagate.js");
/* harmony import */ var _indexDb_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./indexDb.js */ "./src/js/modules/indexDb.js");
/* harmony import */ var _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../global/backgroundConfig.js */ "./src/js/global/backgroundConfig.js");
/* harmony import */ var _utils_discardUnnecessaryImgModule_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/discardUnnecessaryImgModule.js */ "./src/js/utils/discardUnnecessaryImgModule.js");




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
  const res = await fetch(url, { headers: { 'Referer': refererUrl } });
  return res.blob();
}



async function checkTimeAndRefetch() {
  const reFetchData = new Map();

  const tx = _indexDb_js__WEBPACK_IMPORTED_MODULE_1__.DB.transaction('imgURL', 'readwrite');
  const store = tx.objectStore('imgURL');

  for (const [url, imgData] of _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.CsBatchForWaiting) {
    try {
  
      let dbValue = await (0,_indexDb_js__WEBPACK_IMPORTED_MODULE_1__.reqTablePromise)(store.get(url[1]));

      // dbValue가 유효한 객체인지 확인
      if (dbValue && retryThreshold < (Date.now() - dbValue.saveTime)) {
        if (!reFetchData.get(imgData.tabId)) {
          reFetchData.set(imgData.tabId, [imgData]);
        } else {
          reFetchData.get(imgData.tabId).push(imgData);
        }

        dbValue.saveTime = Date.now();
        await (0,_indexDb_js__WEBPACK_IMPORTED_MODULE_1__.reqTablePromise)(store.put(dbValue));
      }
    } catch (error) {
      console.error( error);
      // 오류가 발생하면 이 반복문은 계속 진행됩니다.
    }
  }

  for (const [tabId, imgDataArr] of reFetchData) {
    console.log("resending data:" + reFetchData.size);
    refetchBatch(imgDataArr, tabId);
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


async function fetchBatch(CsImgData, tabId, frameId) {

  const unnecessaryCSImgData = [];
  let formData = new FormData();
  let tabUrl;
  try {
    const tab = await chrome.tabs.get(tabId);
    tabUrl = tab.url;

    await Promise.all(
      CsImgData.map(async imgdata => {
        if ((0,_utils_discardUnnecessaryImgModule_js__WEBPACK_IMPORTED_MODULE_3__.discardUnnecessaryImgbyUrl)(imgdata.url)) {
          unnecessaryCSImgData.push(imgdata);
          _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.CsBatchForWaiting.delete([imgdata.tabId, imgdata.url]);
          return;
        }

        const imgBlob = await fetchAndReturnBlobImg(imgdata.url, tabUrl);

        if (await (0,_utils_discardUnnecessaryImgModule_js__WEBPACK_IMPORTED_MODULE_3__.discardUnnecessaryImgBlob)(imgBlob)){
          unnecessaryCSImgData.push(imgdata);
          return;
        }

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

  if (unnecessaryCSImgData.length > 0) {
    console.log("tabid", tabId, "frameid", frameId);
    // sendWaitingCsDataToCs(new Map([
    //   [tabId, new Map([
    //     [frameId, unnecessaryCSImgData]
    //   ])]
    // ]));

    const unnecessaryCSImgDataForDB = new Map(unnecessaryCSImgData.map((el) => {
      return [el.url, { url: el.url, response: true, status: true, harmful: false }];
    }));
    (0,_utils_propagate_js__WEBPACK_IMPORTED_MODULE_0__.propagateResBodyData)(unnecessaryCSImgDataForDB,false);
  }

  if (unnecessaryCSImgData.length === CsImgData.length){
    console.log("no fetch data");
    return;
  }


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


async function refetchBatch(CsImgData, tabId) {

  let formData = new FormData();
  let tabUrl;
  try {
    const tab = await chrome.tabs.get(tabId);
    tabUrl = tab.url;

    await Promise.all(
      CsImgData.map(async imgdata => {
      
        const imgBlob = await fetchAndReturnBlobImg(imgdata.url, tabUrl);
        let resizedImgBlob;

        try {
          resizedImgBlob = await resizeAndSendBlob(imgBlob, 224, 224);
        }
        catch (err) {
          throw new Error("| resize과정에서 오류 발생 " + err);
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

  try {
    const start = performance.now();
    console.log(`<--refetch!-->\n total: ${CsImgData.length}\nlevel:${(0,_global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__.getCurrentFilteringStepValue)()}`);
    let res;
    if (tabUrl.includes("youtube.com")) {
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

/***/ "./src/js/utils/discardUnnecessaryImgModule.js":
/*!*****************************************************!*\
  !*** ./src/js/utils/discardUnnecessaryImgModule.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   discardUnnecessaryImgBlob: () => (/* binding */ discardUnnecessaryImgBlob),
/* harmony export */   discardUnnecessaryImgbyUrl: () => (/* binding */ discardUnnecessaryImgbyUrl)
/* harmony export */ });
//checking image 

const DISALLOWED_EXT = ['svg', 'svgz', 'ico', 'cur', 'png'];
const DISALLOWED_MIME = ['image/svg+xml', 'image/png', 'image/x-icon', 'image/vnd.microsoft.icon']; // 확장자에 대응하는 MIME
const MIN_WIDTH = 100;
const MIN_HEIGHT = 100;
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (예시)


// URL에서 확장자 추출 후 필터링
function discardUnnecessaryImgbyUrl(url) {
    try {
        const pathname = new URL(url).pathname.toLowerCase();
        const ext = pathname.split('.').pop().split('?')[0].split('#')[0];
        console.log("url 처리 후 결과:"+ ext);
        return DISALLOWED_EXT.includes(ext);
    } catch (e) {
        return false;
    }
}

// MIME 타입 필터링
function discardUnnecessaryImgByMime(mimeType) {
    if (typeof mimeType === 'string') {
        return DISALLOWED_MIME.some(t => mimeType.startsWith(t));
    }
    return false;
}


async function discardUnnecessaryImgBlob(blob) {
    // MIME 타입 필터
    if (discardUnnecessaryImgByMime(blob.type)) {
        return true;
    }
    // 파일 크기 검사
    if (blob.size > MAX_FILE_SIZE) {
        return true;
    }
    // ImageBitmap으로 픽셀 크기 검사
    const imageBitmap = await createImageBitmap(blob);
    const w = imageBitmap.width;  // ImageBitmap.width는 CSS 픽셀 단위의 너비를 반환:contentReference[oaicite:3]{index=3}
    const h = imageBitmap.height;
    return (w < MIN_WIDTH || h < MIN_HEIGHT || w > MAX_WIDTH || h > MAX_HEIGHT); //true -> discard
  }


/***/ }),

/***/ "./src/js/utils/propagate.js":
/*!***********************************!*\
  !*** ./src/js/utils/propagate.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   propagateResBodyData: () => (/* binding */ propagateResBodyData),
/* harmony export */   sendWaitingCsDataToCs: () => (/* binding */ sendWaitingCsDataToCs)
/* harmony export */ });
/* harmony import */ var _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../modules/indexDb.js */ "./src/js/modules/indexDb.js");
/* harmony import */ var _modules_requestImgAnalyze_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../modules/requestImgAnalyze.js */ "./src/js/modules/requestImgAnalyze.js");
/* harmony import */ var _global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../global/backgroundConfig.js */ "./src/js/global/backgroundConfig.js");
/* harmony import */ var _utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/backgroundUtils.js */ "./src/js/utils/backgroundUtils.js");






async function propagateResBodyData(responseData, refetch = true) {
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
    
    if (refetch) (0,_modules_requestImgAnalyze_js__WEBPACK_IMPORTED_MODULE_1__.checkTimeAndRefetch)();
    
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

let initWorkerFlag = false;
let initWorkerPromise = null;


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




chrome.runtime.onMessage.addListener((message,sender,sendResponse)=> {
  if (message.source === "content") {
    try{
      if (!initWorkerFlag) {
  
        initServiceWorker(message, sender, sendResponse).then(() => {
          callBackForContentScript(message, sender, sendResponse);
        });
  
      }
      else  callBackForContentScript(message,sender,sendResponse);
    }
    catch(e){
      console.error(e);
    }
    return true;
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


//popup 리스너
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
            try {
              interceptorSite.set(message.rootInstance[0], message.rootInstance[1]);
              chrome.storage.local.set({ 'interceptorSite': Object.fromEntries(interceptorSite) });
            } catch (e) {
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












//초기화 코드



//비동기 준비 작업이 완료되어야 다음 코드를 실행할 수 있는 프로마이스 객체(resolved가 반환되어야 함). 함수 자체는 바로 실행
let PromiseForDBInit = _modules_indexDb_js__WEBPACK_IMPORTED_MODULE_0__.initIndexDb();


async function initServiceWorker(message, sender, sendResponse) {

  if(initWorkerPromise === null){
    initWorkerPromise = new Promise(async (resolve, reject) => {
      
      try {
        
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
            chrome.storage.local.set({ 'totalNumOfHarmfulImg': 0 });
          }
        });
  
  
        const storedCurrentFilteringStepValue = await chrome.storage.local.get(['filteringStep']).then(result => {
          chrome.storage.local.set({ 'filteringStep': 1 });
          let value = result.filteringStep;
          if (value === undefined) {
            chrome.storage.local.set({ 'filteringStep': 1 });
            value = 1;
          }
          return value;
        });
        (0,_global_backgroundConfig_js__WEBPACK_IMPORTED_MODULE_1__.setCurrentFilteringStepValue)(storedCurrentFilteringStepValue);

        resolve();

        initWorkerFlag = true; //비동기 초기화 작업 끝내고 flag true로 변경

      }
      catch(e){
        reject(e);
      }
    });
  }
  try {
    await initWorkerPromise;
    initWorkerPromise = null;
  }
  catch (e) {
    console.error(e);
  }
}




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
    await PromiseForDBInit; //db init 프로미스 기다림. 
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

    (0,_modules_requestImgAnalyze_js__WEBPACK_IMPORTED_MODULE_2__.fetchBatch)(CsBatchForDBAdd, tabId, frameId);
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

function callBackForContentScript(message, sender, sendResponse) {
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

          getPageUrlFromTabId(sender?.tab?.id).then(pageUrl => {
            console.log(pageUrl);
            (0,_utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_3__.initNumOfHarmfulImgInStorageSession)(pageUrl);
          }).catch(err => { console.error(err); });

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
              
                console.log("허용되지 않은 사이트2");
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
            throw new Error(e);
          }

      }
    } catch (e) {
      console.error("error occured while responsing with script: ["+e+"]");
      sendResponse({
        ok: false,
      });
    }
}



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


})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLGdCQUFnQjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsSUFBSSxnQkFBZ0I7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvbW9kdWxlcy9pbmRleERiLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvbW9kdWxlcy9yZXF1ZXN0SW1nQW5hbHl6ZS5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL2JhY2tncm91bmRVdGlscy5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL2Rpc2NhcmRVbm5lY2Vzc2FyeUltZ01vZHVsZS5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL3Byb3BhZ2F0ZS5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9iYWNrZ3JvdW5kLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxyXG4vL2lucHV0IGRhdGEgPT4gW3NpdGV1cmwsIGltZ3VybF0gOntpbWdNZXRhRGF0YX1cclxuZXhwb3J0IGNvbnN0IENzQmF0Y2hGb3JXYWl0aW5nID0gbmV3IE1hcCgpOyBcclxuXHJcbi8vZGVmYXVsdCA9IDFcclxubGV0IGN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWU7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSh2YWx1ZSkge1xyXG4gIGN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUgPSB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWU7XHJcbn0iLCJleHBvcnQgbGV0IERCID0gbnVsbDtcclxuZXhwb3J0IGxldCBrZXlTZXQgPSBudWxsO1xyXG5leHBvcnQgbGV0IGtleVNldExvYWRlZCA9IGZhbHNlO1xyXG5cclxuXHJcblxyXG5leHBvcnQgIGFzeW5jIGZ1bmN0aW9uIGluaXRJbmRleERiKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBkZWxldGVJbWFnZVVybERCKCk7Ly/rgpjspJHsl5Ag7IKt7KCc7ZW07JW8IO2VqC4g7ISc67mE7IqkIOybjOy7pCDstIjquLDtmZTtlZjrqbQg66y07KGw6rG0IOq4sOyhtCBkYiDsgq3soJxcclxuICAgICAgICBEQiA9IGF3YWl0IG9wZW5JbWFnZVVybERCKCk7XHJcbiAgICAgICAgYXdhaXQgbG9hZEtleVNldChEQik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJkYuuhnOuTnOyZhOujjFwiKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLshJzruYTsiqTsm4zsu6Qg7LSI6riw7ZmUIC0gZGIg66Gc65OcIOuwjyDtgqTshYsg66Gc65OcIOykkeyXkCDsl5Drn6wg67Cc7IOdOlwiICsgZSk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZXJyb3Igd2hpbGUgbG9hZGluZyBkYiBvciBrZXlzZXQgXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcblxyXG4vKlxyXG5yZXNvbHZlKHZhbHVlKVxyXG46IOyekeyXheydtCDshLHqs7XtlojsnYQg65WMIFByb21pc2XsnZgg7IOB7YOc66W8ICfsnbTtlokoZnVsZmlsbGVkKScg7IOB7YOc66GcIOyghO2ZmOyLnO2CpOqzoCwg6rKw6rO866W8IHZhbHVl66GcIOyghOuLrO2VqeuLiOuLpC4g7ZW064u5IOqwkuydgFxyXG4udGhlbigp7J2YIOyyqyDrsojsp7gg7L2c67CxLCDruYTrj5nquLDsoIHsnLzroZwg7Iuk7ZaJXHJcbnJlamVjdChyZWFzb24pXHJcbjog7J6R7JeF7J20IOyLpO2MqO2WiOydhCDrlYwgUHJvbWlzZeydmCDsg4Htg5zrpbwgJ+qxsOu2gChyZWplY3RlZCknIOyDge2DnOuhnCDsoITtmZjsi5ztgqTqs6AsIOyXkOufrCjsnbTsnKAp66W8IHJlYXNvbuycvOuhnCDsoITri6ztlanri4jri6QuXHJcbu2VtOuLuSDqsJLsnYAgLmNhdGNoKCkg65iQ64qUIC50aGVuKCwgKSDrkZAg67KI7Ke4IOy9nOuwsSwg67mE64+Z6riw7KCB7Jy866GcIOyLpO2WiVxyXG4qL1xyXG5leHBvcnQgZnVuY3Rpb24gb3BlbkltYWdlVXJsREIoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIC8vaW1hZ2VVcmxEQuuKlCBkYuydtOumhC4g66eM7JW9IOyhtOyerO2VmOyngCDslYrsnLzrqbQg7IOd7ISxLCDsobTsnqztlZjrqbQg7ZW064u5IGRi66W8IOyXtOydjCBcclxuICAgICAgICAvL+uRkOuyiOynuCDsnbjsnpDsnbggMeydgCDrjbDsnbTthLAg67Kg7J207IqkIOuyhOyghC4g66eM7JW97JeQIGRi6rCAIOydtCDqsJLrs7Tri6Qg67KE7KCE7J20IOuCruuLpOuptCDsl4Xqt7jroIjsnbTrk5wg7J2067Kk7Yq46rCAIOuwnOyDneuQqC4ob251cGdyYWRlbmVlZGVkKVxyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSBpbmRleGVkREIub3BlbignaW1hZ2VVcmxEQicsIDEpO1xyXG4gICAgICAgIC8v7JeF6re466CI7J2065Oc6rCAIOuwnOyDne2VoCDqsr3smrAg7J2067Kk7Yq4IO2VuOuTpOufrOyXkOyEnCDsi6TtlontlaAg7L2c67CxIO2VqOyImCDsoJXsnZhcclxuICAgICAgICByZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBvcGVuIOyalOyyreycvOuhnCDsl7TrpqzqsbDrgpgg7IOd7ISx65CcIOuNsOydtO2EsOuyoOydtOyKpChJREJEYXRhYmFzZSkg6rCd7LK0LiBcclxuICAgICAgICAgICAgLy/snbQg6rCd7LK066GcIG9iamVjdFN0b3JlKO2FjOydtOu4lCDqsJnsnYAg6rCc64WQKeulvCDrp4zrk6TqsbDrgpgg7IKt7KCc7ZWY64qUIOuTsSDrjbDsnbTthLDrsqDsnbTsiqTsnZgg7Iqk7YKk66eI66W8IOyhsOyeke2VoCDsiJgg7J6I7J2MXHJcbiAgICAgICAgICAgIC8vIG9iamVjdFN0b3Jl7J2AIOydvOyiheydmCBcIu2FjOydtOu4lFwiIOqwnOuFkOydtOupsCDqtIDqs4TtmJVEQuydmCDthYzsnbTruJTrs7Tri6Qg7J6Q7Jyg66Gc7Jq0IO2Yle2DnOuhnCwg7J6Q67CU7Iqk7YGs66a97Yq4IOqwneyytCDri6jsnITroZwgXHJcbiAgICAgICAgICAgIC8v642w7J207YSw66W8IOyggOyepe2VoCDsiJgg7J6I7J2MXHJcbiAgICAgICAgICAgIC8va2V5UGF0aOuKlCDsoIDsnqXtlZjripQg6rCBIOqwneyytOyXkOyEnCDquLDrs7jtgqTroZwg7IKs7Jqp7ZWgIOyGjeyEsSDsnbTrpoRcclxuICAgICAgICAgICAgY29uc3QgZGIgPSBldmVudC50YXJnZXQucmVzdWx0O1xyXG4gICAgICAgICAgICAvLyBpbWFnZXMgb2JqZWN0U3RvcmUg7IOd7ISxLCBrZXlQYXRo64qUIGNhbm9uaWNhbFVybOuhnCFcclxuXHJcbiAgICAgICAgICAgIGlmICghZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucygnaW1nVVJMJykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBkYi5jcmVhdGVPYmplY3RTdG9yZSgnaW1nVVJMJywgeyBrZXlQYXRoOiAndXJsJyB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJlc29sdmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7IC8vIHByb21pc2UgdmFsdWXsl5AgZGIg7J247Iqk7YS07IqkIOuwmO2ZmOqwkiDsoIDsnqVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpOyAvLyBwcm9taXNlIHJlYXNvbuyXkCBldmVudC50YXJnZXQuZXJyb3Ig7KCA7J6lXHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlSW1hZ2VVcmxEQigpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgLy8gSW5kZXhlZERC7J2YIGRlbGV0ZURhdGFiYXNlIOuplOyEnOuTnOulvCDsgqzsmqntlZjsl6wg642w7J207YSw67Kg7J207Iqk66W8IOyCreygnO2VqeuLiOuLpC5cclxuICAgICAgICBjb25zdCByZXF1ZXN0ID0gaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKCdpbWFnZVVybERCJyk7XHJcblxyXG4gICAgICAgIC8vIOyCreygnCDshLHqs7Ug7IucIO2YuOy2nOuQmOuKlCDsnbTrsqTtirgg7ZW465Ok65+sXHJcbiAgICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfrjbDsnbTthLDrsqDsnbTsiqTqsIAg7ISx6rO17KCB7Jy866GcIOyCreygnOuQmOyXiOyKteuLiOuLpC4nKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIOyCreygnCDsi6TtjKgg7IucIO2YuOy2nOuQmOuKlCDsnbTrsqTtirgg7ZW465Ok65+sXHJcbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHJlamVjdCgn642w7J207YSw67Kg7J207IqkIOyCreygnCDsmKTrpZg6JywgZXZlbnQudGFyZ2V0LmVycm9yKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyDrjbDsnbTthLDrsqDsnbTsiqTqsIAg64uk66W4IO2DreyXkOyEnCDsl7TroKQg7J6I7Ja0IOyCreygnOqwgCDssKjri6jrkKAg65WMIO2YuOy2nOuQmOuKlCDsnbTrsqTtirgg7ZW465Ok65+sXHJcbiAgICAgICAgcmVxdWVzdC5vbmJsb2NrZWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign642w7J207YSw67Kg7J207Iqk6rCAIOuLpOuluCDsl7DqsrDsl5Ag7J2Y7ZW0IOywqOuLqOuQmOyXiOyKteuLiOuLpC4nKTtcclxuICAgICAgICAgICAgcmVqZWN0KCfrjbDsnbTthLDrsqDsnbTsiqTqsIAg64uk66W4IOyXsOqysOyXkCDsnZjtlbQg7LCo64uo65CY7JeI7Iq164uI64ukLicpO1xyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsS2V5c1Byb21pc2Uoc3RvcmUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmVxID0gc3RvcmUuZ2V0QWxsS2V5cygpO1xyXG4gICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSAoZSkgPT4gcmVzb2x2ZShlLnRhcmdldC5yZXN1bHQpOyAvLyDrsLDsl7Qg67CY7ZmYIVxyXG4gICAgICAgIHJlcS5vbmVycm9yID0gKGUpID0+IHJlamVjdChlLnRhcmdldC5lcnJvcik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkS2V5U2V0KCkge1xyXG4gICAgY29uc3QgdHggPSBEQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWRvbmx5Jyk7XHJcbiAgICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuICAgIC8vIOydtOuvuCDsoIDsnqXrkJwg66qo65OgIGNhbm9uaWNhbFVybOydhCDtlZzrsojsl5Ag7KGw7ZqMICjrjIDrn4kg7LKY66asIOyLnCDtmqjsnKjsoIEpXHJcbiAgICBjb25zdCBleGlzdGluZ0tleXMgPSBhd2FpdCBnZXRBbGxLZXlzUHJvbWlzZShzdG9yZSk7XHJcbiAgICAvLyDsnbTrr7gg7KG07J6s7ZWY64qU7KeAIFNldOycvOuhnCDqtIDrpqwo6rKA7IOJIOu5oOumhClcclxuICAgIGtleVNldCA9IG5ldyBTZXQoZXhpc3RpbmdLZXlzKTtcclxuICAgIGNvbnNvbGUubG9nKGtleVNldC5zaXplKTtcclxuICAgIGtleVNldExvYWRlZCA9IHRydWU7XHJcbn1cclxuXHJcbi8qKuOEuFxyXG4gKiBcclxuICogQHBhcmFtIHtPYmplY3R9IHRhYmxlTWV0aG9kUmVzdWx0IHRhYmxl7JeQIGdldCxwdXQg65OxIOu5hOuPmeq4sCDsmpTssq3snZgg67CY7ZmY6rCSICBcclxuICovXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVxVGFibGVQcm9taXNlKHRhYmxlTWV0aG9kUmVzdWx0KSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRhYmxlTWV0aG9kUmVzdWx0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWJsZU1ldGhvZFJlc3VsdC5vbmVycm9yID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIHJlamVjdChldmVudC50YXJnZXQuZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVEQihyZXNwb25zZURhdGEpIHtcclxuICAgIGNvbnN0IHR4ID0gREIudHJhbnNhY3Rpb24oJ2ltZ1VSTCcsICdyZWFkd3JpdGUnKTtcclxuICAgIGNvbnN0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ2ltZ1VSTCcpO1xyXG5cclxuICAgIGZvciAoY29uc3QgW3VybCwgaW1nUmVzRGF0YV0gb2YgcmVzcG9uc2VEYXRhKSB7XHJcbiAgICAgICAgbGV0IGRiVmFsdWUgPSBhd2FpdCByZXFUYWJsZVByb21pc2Uoc3RvcmUuZ2V0KHVybCkpLnRoZW4ocmVzdWx0ID0+IHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwidGFibGXsl5DshJwga2V5IOyhsO2ajO2VmOqzoCB2YWx1ZSDqsIDsoLjsmKTripQg7KSR7JeQIEVycm9yIOuwnOyDnTpcIiwgZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRiVmFsdWUucmVzcG9uc2UgPSBpbWdSZXNEYXRhLnJlc3BvbnNlO1xyXG4gICAgICAgIGRiVmFsdWUuc3RhdHVzID0gaW1nUmVzRGF0YS5zdGF0dXM7XHJcbiAgICAgICAgZGJWYWx1ZS5oYXJtZnVsID0gaW1nUmVzRGF0YS5oYXJtZnVsO1xyXG4gICAgICAgIGF3YWl0IHJlcVRhYmxlUHJvbWlzZShzdG9yZS5wdXQoZGJWYWx1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vdHgg7JmE66OMIOq4sOuLrOumtCDtlYTsmpQgeD8uLi5cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgcHJvcGFnYXRlUmVzQm9keURhdGEsIHNlbmRXYWl0aW5nQ3NEYXRhVG9Dc30gZnJvbSAnLi4vdXRpbHMvcHJvcGFnYXRlLmpzJztcclxuaW1wb3J0IHtEQiwgcmVxVGFibGVQcm9taXNlfSBmcm9tICcuL2luZGV4RGIuanMnO1xyXG5pbXBvcnQgeyBDc0JhdGNoRm9yV2FpdGluZywgZ2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSB9IGZyb20gJy4uL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzJztcclxuaW1wb3J0IHsgZGlzY2FyZFVubmVjZXNzYXJ5SW1nYnlVcmwsIGRpc2NhcmRVbm5lY2Vzc2FyeUltZ0Jsb2IgfSBmcm9tICcuLi91dGlscy9kaXNjYXJkVW5uZWNlc3NhcnlJbWdNb2R1bGUuanMnXHJcbmNvbnN0IHJldHJ5VGhyZXNob2xkID0gMTUgKiAxMDAwO1xyXG5cclxuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoQmF0Y2goQ3NJbWdEYXRhLCB0YWJJZCkge1xyXG5cclxuLy8gICBjb25zb2xlLmxvZyhcImZldGNoZGF0YTpcIiArIENzSW1nRGF0YS5sZW5ndGgpO1xyXG5cclxuLy8gICBsZXQgQ3NJbWdEYXRhRm9yRmV0Y2ggPSBudWxsO1xyXG4vLyAgIHRyeSB7XHJcbi8vICAgICBjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWUudGFicy5nZXQodGFiSWQpO1xyXG4vLyAgICAgY29uc3QgcmVmZXJlclVybCA9IHRhYi51cmw7XHJcblxyXG4vLyAgICAgQ3NJbWdEYXRhRm9yRmV0Y2ggPSBhd2FpdCBQcm9taXNlLmFsbChcclxuLy8gICAgICAgQ3NJbWdEYXRhLm1hcChhc3luYyBpbWdkYXRhID0+IHtcclxuLy8gICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZmV0Y2hBbmRSZXR1cm5CYXNlNjRJbWcoaW1nZGF0YS51cmwsIHJlZmVyZXJVcmwpO1xyXG4vLyAgICAgICAgIHJldHVybiB7XHJcbi8vICAgICAgICAgICB1cmw6IGltZ2RhdGEudXJsLFxyXG4vLyAgICAgICAgICAgY29udGVudDogY29udGVudCxcclxuLy8gICAgICAgICAgIHN0YXR1czogaW1nZGF0YS5zdGF0dXMsXHJcbi8vICAgICAgICAgICBoYXJtZnVsOiBpbWdkYXRhLmhhcm1mdWxcclxuLy8gICAgICAgICB9O1xyXG4vLyAgICAgICB9KVxyXG4vLyAgICAgKTtcclxuXHJcbi8vICAgfSBjYXRjaCAoZXJyKSB7XHJcbi8vICAgICBjb25zb2xlLmVycm9yKFwi7J2066+47KeAIOyLpOygnCDrjbDsnbTthLAgZmV0Y2gg6rO87KCVIOykkSDsl5Drn6wg67Cc7IOdOiBcIiwgZXJyKTtcclxuLy8gICB9XHJcblxyXG4vLyAgIGNvbnN0IGJvZHlEYXRhID0gSlNPTi5zdHJpbmdpZnkoeyBkYXRhOiBDc0ltZ0RhdGFGb3JGZXRjaCB9KTtcclxuXHJcbi8vICAgdHJ5IHtcclxuXHJcbi8vICAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4vLyAgICAgY29uc29sZS5sb2coXCJmZXRjaCE6IFwiLCBDc0ltZ0RhdGFGb3JGZXRjaC5sZW5ndGgpO1xyXG4vLyAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCJodHRwczovL2ltYWdlLWludGVyY2VwdG9yLXRlc3QtNjgzODU3MTk0Njk5LmFzaWEtbm9ydGhlYXN0My5ydW4uYXBwXCIsIHtcclxuLy8gICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuLy8gICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4vLyAgICAgICBib2R5OiBib2R5RGF0YVxyXG4vLyAgICAgfSk7XHJcblxyXG4vLyAgICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihcIuyEnOuyhCDsnZHri7Ug7Jik66WYXCIpOy8vIGNhdGNo66GcIOydtOuPmVxyXG4vLyAgICAgY29uc29sZS5sb2coYHJlc3BvbnNlIGRlbGF5dGltZTogJHsocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLyAxMDAwfWApO1xyXG5cclxuLy8gICAgIGNvbnN0IHJlc3BvbnNlQm9keURhdGEgPSBhd2FpdCByZXMuanNvbigpPy50aGVuKHJlc3VsdCA9PiB7IHJldHVybiByZXN1bHQ/LmRhdGE/LmltYWdlcyB9KTtcclxuLy8gICAgIGlmIChyZXNwb25zZUJvZHlEYXRhLmxlbmd0aCA+IDApIHtcclxuLy8gICAgICAgcHJvcGFnYXRlUmVzQm9keURhdGEobmV3IE1hcChyZXNwb25zZUJvZHlEYXRhLm1hcCgoZWwpID0+IHtcclxuLy8gICAgICAgICByZXR1cm4gW2VsLnVybCwgeyB1cmw6IGVsLnVybCwgcmVzcG9uc2U6IHRydWUsIHN0YXR1czogZWwuc3RhdHVzLCBoYXJtZnVsOiBlbC5oYXJtZnVsIH1dO1xyXG4vLyAgICAgICB9KSkpO1xyXG4vLyAgICAgfSBlbHNlIGNvbnNvbGUubG9nKFwiY2F1c2UgLSBmZXRjaCByZXNwb25zZTogYm9keWRhdGEg7JeG7J2MXCIpO1xyXG4vLyAgIH0gY2F0Y2ggKGVycikge1xyXG4vLyAgICAgY29uc29sZS5lcnJvcihcclxuLy8gICAgICAgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcclxuLy8gICAgICAgICA/IGBKU09OIHBhcnNpbmcgZmFpbGVkOiAke2Vyci5tZXNzYWdlfWBcclxuLy8gICAgICAgICA6IGBSZXF1ZXN0IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbi8vICAgICApO1xyXG4vLyAgIH1cclxuLy8gfVxyXG5cclxuXHJcbi8vLy8v7Iuk7ZeYIO2VqOyImFxyXG4vLyBCbG9i7J2EIEJhc2U2NCDrrLjsnpDsl7TroZwg67OA7ZmY7ZWY64qUIO2XrO2NvCDtlajsiJhcclxuIGZ1bmN0aW9uIGJsb2JUb0Jhc2U2NChibG9iKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTsgLy8gQmxvYuydhCDsnb3slrQgQmFzZTY0IOuNsOydtO2EsCBVUknroZwg67OA7ZmYIOyLnOyekVxyXG4gICAgcmVhZGVyLm9ubG9hZGVuZCA9ICgpID0+IHtcclxuICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KTsgLy8g67OA7ZmYIOyZhOujjCDsi5wgQmFzZTY0IOusuOyekOyXtCDrsJjtmZhcclxuICAgIH07XHJcbiAgICByZWFkZXIub25lcnJvciA9IChlcnJvcikgPT4ge1xyXG4gICAgICAgIHJlamVjdChlcnJvcik7IC8vIOyXkOufrCDrsJzsg50g7IucIOqxsOu2gFxyXG4gICAgfTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG4vLy8vL1xyXG4gYXN5bmMgZnVuY3Rpb24gZmV0Y2hBbmRSZXR1cm5CYXNlNjRJbWcodXJsLCByZWZlcmVyVXJsKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICdSZWZlcmVyJzogcmVmZXJlclVybFxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIGNvbnN0IHJlc0Jsb2IgPSBhd2FpdCByZXMuYmxvYigpO1xyXG4gICAgICBjb25zdCBCYXNlNjQgPSBhd2FpdCBibG9iVG9CYXNlNjQocmVzQmxvYikudGhlbihyZXNOb3RGaWx0ZXJkID0+IHsgcmV0dXJuIHJlc05vdEZpbHRlcmQuc3BsaXQoJywnKVsxXTsgfSk7XHJcbiAgICAgIHJldHVybiByZXNvbHZlKEJhc2U2NCk7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuXHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgfTtcclxuXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoQW5kUmV0dXJuQmxvYkltZyh1cmwsIHJlZmVyZXJVcmwpIHtcclxuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHsgaGVhZGVyczogeyAnUmVmZXJlcic6IHJlZmVyZXJVcmwgfSB9KTtcclxuICByZXR1cm4gcmVzLmJsb2IoKTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tUaW1lQW5kUmVmZXRjaCgpIHtcclxuICBjb25zdCByZUZldGNoRGF0YSA9IG5ldyBNYXAoKTtcclxuXHJcbiAgY29uc3QgdHggPSBEQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWR3cml0ZScpO1xyXG4gIGNvbnN0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ2ltZ1VSTCcpO1xyXG5cclxuICBmb3IgKGNvbnN0IFt1cmwsIGltZ0RhdGFdIG9mIENzQmF0Y2hGb3JXYWl0aW5nKSB7XHJcbiAgICB0cnkge1xyXG4gIFxyXG4gICAgICBsZXQgZGJWYWx1ZSA9IGF3YWl0IHJlcVRhYmxlUHJvbWlzZShzdG9yZS5nZXQodXJsWzFdKSk7XHJcblxyXG4gICAgICAvLyBkYlZhbHVl6rCAIOycoO2aqO2VnCDqsJ3ssrTsnbjsp4Ag7ZmV7J24XHJcbiAgICAgIGlmIChkYlZhbHVlICYmIHJldHJ5VGhyZXNob2xkIDwgKERhdGUubm93KCkgLSBkYlZhbHVlLnNhdmVUaW1lKSkge1xyXG4gICAgICAgIGlmICghcmVGZXRjaERhdGEuZ2V0KGltZ0RhdGEudGFiSWQpKSB7XHJcbiAgICAgICAgICByZUZldGNoRGF0YS5zZXQoaW1nRGF0YS50YWJJZCwgW2ltZ0RhdGFdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmVGZXRjaERhdGEuZ2V0KGltZ0RhdGEudGFiSWQpLnB1c2goaW1nRGF0YSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkYlZhbHVlLnNhdmVUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICBhd2FpdCByZXFUYWJsZVByb21pc2Uoc3RvcmUucHV0KGRiVmFsdWUpKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgY29uc29sZS5lcnJvciggZXJyb3IpO1xyXG4gICAgICAvLyDsmKTrpZjqsIAg67Cc7IOd7ZWY66m0IOydtCDrsJjrs7XrrLjsnYAg6rOE7IaNIOynhO2WieuQqeuLiOuLpC5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZvciAoY29uc3QgW3RhYklkLCBpbWdEYXRhQXJyXSBvZiByZUZldGNoRGF0YSkge1xyXG4gICAgY29uc29sZS5sb2coXCJyZXNlbmRpbmcgZGF0YTpcIiArIHJlRmV0Y2hEYXRhLnNpemUpO1xyXG4gICAgcmVmZXRjaEJhdGNoKGltZ0RhdGFBcnIsIHRhYklkKTtcclxuICB9XHJcbiAgYXdhaXQgdHguZG9uZT8uKCk7XHJcblxyXG59XHJcblxyXG4vL2NyZWF0ZUltYWdlQml0bWFw7Jy866GcIOyngOybkCDslYjtlZjripQg7J2066+47KeAOiBzdmdcclxuLy9pbWFnZSDqsJ3ssrTrpbwg7IOd7ISx7ZW07IScIOyasO2ajOyggeycvOuhnCDtlbTqsrDtlbTslbwg7ZWoLiDqt7jrn6zrgpgg67mE7Jyg7ZW0IOydtOuvuOyngCDtlYTthLDsl5DshJwg7ZW064u5IOycoO2YleydmCDsnbTrr7jsp4Drpbwg66+466asIOqxuOufrOuCvCDsmIjsoJXsnbTquLAg65WM66y47JeQIO2YhOyerCDsiJjsoJUg7JWI7ZWcIOyDge2DnFxyXG5hc3luYyBmdW5jdGlvbiByZXNpemVBbmRTZW5kQmxvYihibG9iLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAvLyBCbG9i7J2EIEltYWdlQml0bWFw7Jy866GcIOuzgO2ZmFxyXG4gICAgY29uc3QgaW1hZ2VCaXRtYXAgPSBhd2FpdCBjcmVhdGVJbWFnZUJpdG1hcChibG9iKTtcclxuXHJcbiAgICAvLyBPZmZzY3JlZW5DYW52YXMg7IOd7ISxXHJcbiAgICBjb25zdCBvZmZzY3JlZW4gPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgY29uc3QgY3R4ID0gb2Zmc2NyZWVuLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgLy8g7LqU67KE7Iqk7JeQIOq3uOumrOq4sFxyXG4gICAgY3R4LmRyYXdJbWFnZShpbWFnZUJpdG1hcCwgMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcblxyXG4gICAgLy8gQmxvYuycvOuhnCDrs4DtmZhcclxuICAgIGNvbnN0IHJlc2l6ZWRCbG9iID0gYXdhaXQgb2Zmc2NyZWVuLmNvbnZlcnRUb0Jsb2Ioe1xyXG4gICAgICAgIHR5cGU6ICdpbWFnZS93ZWJQJyxcclxuICAgICAgICBxdWFsaXR5OiAwLjk1XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVzaXplZEJsb2I7XHJcbiAgfVxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaEJhdGNoKENzSW1nRGF0YSwgdGFiSWQsIGZyYW1lSWQpIHtcclxuXHJcbiAgY29uc3QgdW5uZWNlc3NhcnlDU0ltZ0RhdGEgPSBbXTtcclxuICBsZXQgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICBsZXQgdGFiVXJsO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWUudGFicy5nZXQodGFiSWQpO1xyXG4gICAgdGFiVXJsID0gdGFiLnVybDtcclxuXHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgICAgQ3NJbWdEYXRhLm1hcChhc3luYyBpbWdkYXRhID0+IHtcclxuICAgICAgICBpZiAoZGlzY2FyZFVubmVjZXNzYXJ5SW1nYnlVcmwoaW1nZGF0YS51cmwpKSB7XHJcbiAgICAgICAgICB1bm5lY2Vzc2FyeUNTSW1nRGF0YS5wdXNoKGltZ2RhdGEpO1xyXG4gICAgICAgICAgQ3NCYXRjaEZvcldhaXRpbmcuZGVsZXRlKFtpbWdkYXRhLnRhYklkLCBpbWdkYXRhLnVybF0pO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaW1nQmxvYiA9IGF3YWl0IGZldGNoQW5kUmV0dXJuQmxvYkltZyhpbWdkYXRhLnVybCwgdGFiVXJsKTtcclxuXHJcbiAgICAgICAgaWYgKGF3YWl0IGRpc2NhcmRVbm5lY2Vzc2FyeUltZ0Jsb2IoaW1nQmxvYikpe1xyXG4gICAgICAgICAgdW5uZWNlc3NhcnlDU0ltZ0RhdGEucHVzaChpbWdkYXRhKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByZXNpemVkSW1nQmxvYjtcclxuXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgcmVzaXplZEltZ0Jsb2IgPSBhd2FpdCByZXNpemVBbmRTZW5kQmxvYihpbWdCbG9iLCAyMjQsIDIyNCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoKGVycil7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ8IHJlc2l6ZeqzvOygleyXkOyEnCDsmKTrpZgg67Cc7IOdIFwiKyBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbWdNZXRhSnNvbiA9IEpTT04uc3RyaW5naWZ5KFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmw6IGltZ2RhdGEudXJsLFxyXG4gICAgICAgICAgICBzdGF0dXM6IGltZ2RhdGEuc3RhdHVzLFxyXG4gICAgICAgICAgICBoYXJtZnVsOiBpbWdkYXRhLmhhcm1mdWwsXHJcbiAgICAgICAgICAgIGxldmVsOiBnZXRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlKClcclxuICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnaW1hZ2VzJywgcmVzaXplZEltZ0Jsb2IpO1xyXG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnaW1nTWV0YScsIGltZ01ldGFKc29uKTtcclxuICAgICAgfSlcclxuICAgICk7XHJcblxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcImJvZHkgZGF0YSDsspjrpqwg67CPIOykgOu5hCDqs7zsoJUg7KSRIOyXkOufrCDrsJzsg506XCIsIGVycik7XHJcbiAgfVxyXG5cclxuICBpZiAodW5uZWNlc3NhcnlDU0ltZ0RhdGEubGVuZ3RoID4gMCkge1xyXG4gICAgY29uc29sZS5sb2coXCJ0YWJpZFwiLCB0YWJJZCwgXCJmcmFtZWlkXCIsIGZyYW1lSWQpO1xyXG4gICAgLy8gc2VuZFdhaXRpbmdDc0RhdGFUb0NzKG5ldyBNYXAoW1xyXG4gICAgLy8gICBbdGFiSWQsIG5ldyBNYXAoW1xyXG4gICAgLy8gICAgIFtmcmFtZUlkLCB1bm5lY2Vzc2FyeUNTSW1nRGF0YV1cclxuICAgIC8vICAgXSldXHJcbiAgICAvLyBdKSk7XHJcblxyXG4gICAgY29uc3QgdW5uZWNlc3NhcnlDU0ltZ0RhdGFGb3JEQiA9IG5ldyBNYXAodW5uZWNlc3NhcnlDU0ltZ0RhdGEubWFwKChlbCkgPT4ge1xyXG4gICAgICByZXR1cm4gW2VsLnVybCwgeyB1cmw6IGVsLnVybCwgcmVzcG9uc2U6IHRydWUsIHN0YXR1czogdHJ1ZSwgaGFybWZ1bDogZmFsc2UgfV07XHJcbiAgICB9KSk7XHJcbiAgICBwcm9wYWdhdGVSZXNCb2R5RGF0YSh1bm5lY2Vzc2FyeUNTSW1nRGF0YUZvckRCLGZhbHNlKTtcclxuICB9XHJcblxyXG4gIGlmICh1bm5lY2Vzc2FyeUNTSW1nRGF0YS5sZW5ndGggPT09IENzSW1nRGF0YS5sZW5ndGgpe1xyXG4gICAgY29uc29sZS5sb2coXCJubyBmZXRjaCBkYXRhXCIpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcblxyXG4gIHRyeSB7XHJcblxyXG4gICAgY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgIGNvbnNvbGUubG9nKGA8LS1mZXRjaCEtLT5cXG4gdG90YWw6ICR7Q3NJbWdEYXRhLmxlbmd0aH1cXG5sZXZlbDoke2dldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoKSB9YCk7XHJcbiAgICBsZXQgcmVzO1xyXG4gICAgaWYgKHRhYlVybC5pbmNsdWRlcyhcInlvdXR1YmUuY29tXCIpICl7XHJcbiAgICAgIHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9pbWFnZS1pbnRlcmNlcHRvci15b3V0dWJlLTY4Mzg1NzE5NDY5OS5hc2lhLW5vcnRoZWFzdDMucnVuLmFwcFwiLCB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBib2R5OiBmb3JtRGF0YVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vaW1hZ2UtaW50ZXJjZXB0b3ItZGV2ZWxvcC02ODM4NTcxOTQ2OTkuYXNpYS1ub3J0aGVhc3QzLnJ1bi5hcHBcIiwge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgYm9keTogZm9ybURhdGFcclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihcIuyEnOuyhCDsnZHri7Ug7Jik66WYXCIpOy8vIGNhdGNo66GcIOydtOuPmVxyXG4gICAgY29uc29sZS5sb2coYHJlc3BvbnNlIGRlbGF5dGltZTogJHsocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLyAxMDAwfWApO1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlQm9keURhdGEgPSBhd2FpdCByZXMuanNvbigpPy50aGVuKHJlc3VsdCA9PiB7IHJldHVybiByZXN1bHQ/LmltYWdlIH0pO1xyXG4gICAgaWYgKHJlc3BvbnNlQm9keURhdGEubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgY29uc3QgcHJvY2Vzc2VkUmVzQm9keURhdGEgPSBuZXcgTWFwKHJlc3BvbnNlQm9keURhdGEubWFwKChlbCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbZWwudXJsLCB7IHVybDogZWwudXJsLCByZXNwb25zZTogdHJ1ZSwgc3RhdHVzOiBlbC5zdGF0dXMsIGhhcm1mdWw6IGVsLmhhcm1mdWwgfV07XHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICAgIHByb3BhZ2F0ZVJlc0JvZHlEYXRhKHByb2Nlc3NlZFJlc0JvZHlEYXRhKTtcclxuXHJcbiAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiY2F1c2UgLSBmZXRjaCByZXNwb25zZTogYm9keWRhdGEg7JeG7J2MXCIpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihcclxuICAgICAgZXJyIGluc3RhbmNlb2YgU3ludGF4RXJyb3JcclxuICAgICAgICA/IGBKU09OIHBhcnNpbmcgZmFpbGVkOiAke2Vyci5tZXNzYWdlfWBcclxuICAgICAgICA6IGBSZXF1ZXN0IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWZldGNoQmF0Y2goQ3NJbWdEYXRhLCB0YWJJZCkge1xyXG5cclxuICBsZXQgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICBsZXQgdGFiVXJsO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWUudGFicy5nZXQodGFiSWQpO1xyXG4gICAgdGFiVXJsID0gdGFiLnVybDtcclxuXHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgICAgQ3NJbWdEYXRhLm1hcChhc3luYyBpbWdkYXRhID0+IHtcclxuICAgICAgXHJcbiAgICAgICAgY29uc3QgaW1nQmxvYiA9IGF3YWl0IGZldGNoQW5kUmV0dXJuQmxvYkltZyhpbWdkYXRhLnVybCwgdGFiVXJsKTtcclxuICAgICAgICBsZXQgcmVzaXplZEltZ0Jsb2I7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICByZXNpemVkSW1nQmxvYiA9IGF3YWl0IHJlc2l6ZUFuZFNlbmRCbG9iKGltZ0Jsb2IsIDIyNCwgMjI0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwifCByZXNpemXqs7zsoJXsl5DshJwg7Jik66WYIOuwnOyDnSBcIiArIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGltZ01ldGFKc29uID0gSlNPTi5zdHJpbmdpZnkoXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogaW1nZGF0YS51cmwsXHJcbiAgICAgICAgICAgIHN0YXR1czogaW1nZGF0YS5zdGF0dXMsXHJcbiAgICAgICAgICAgIGhhcm1mdWw6IGltZ2RhdGEuaGFybWZ1bCxcclxuICAgICAgICAgICAgbGV2ZWw6IGdldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdpbWFnZXMnLCByZXNpemVkSW1nQmxvYik7XHJcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdpbWdNZXRhJywgaW1nTWV0YUpzb24pO1xyXG4gICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiYm9keSBkYXRhIOyymOumrCDrsI8g7KSA67mEIOqzvOyglSDspJEg7JeQ65+sIOuwnOyDnTpcIiwgZXJyKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgY29uc29sZS5sb2coYDwtLXJlZmV0Y2ghLS0+XFxuIHRvdGFsOiAke0NzSW1nRGF0YS5sZW5ndGh9XFxubGV2ZWw6JHtnZXRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlKCl9YCk7XHJcbiAgICBsZXQgcmVzO1xyXG4gICAgaWYgKHRhYlVybC5pbmNsdWRlcyhcInlvdXR1YmUuY29tXCIpKSB7XHJcbiAgICAgIHJlcyA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9pbWFnZS1pbnRlcmNlcHRvci15b3V0dWJlLTY4Mzg1NzE5NDY5OS5hc2lhLW5vcnRoZWFzdDMucnVuLmFwcFwiLCB7XHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBib2R5OiBmb3JtRGF0YVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vaW1hZ2UtaW50ZXJjZXB0b3ItZGV2ZWxvcC02ODM4NTcxOTQ2OTkuYXNpYS1ub3J0aGVhc3QzLnJ1bi5hcHBcIiwge1xyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgYm9keTogZm9ybURhdGFcclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihcIuyEnOuyhCDsnZHri7Ug7Jik66WYXCIpOy8vIGNhdGNo66GcIOydtOuPmVxyXG4gICAgY29uc29sZS5sb2coYHJlc3BvbnNlIGRlbGF5dGltZTogJHsocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgLyAxMDAwfWApO1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlQm9keURhdGEgPSBhd2FpdCByZXMuanNvbigpPy50aGVuKHJlc3VsdCA9PiB7IHJldHVybiByZXN1bHQ/LmltYWdlIH0pO1xyXG4gICAgaWYgKHJlc3BvbnNlQm9keURhdGEubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgY29uc3QgcHJvY2Vzc2VkUmVzQm9keURhdGEgPSBuZXcgTWFwKHJlc3BvbnNlQm9keURhdGEubWFwKChlbCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbZWwudXJsLCB7IHVybDogZWwudXJsLCByZXNwb25zZTogdHJ1ZSwgc3RhdHVzOiBlbC5zdGF0dXMsIGhhcm1mdWw6IGVsLmhhcm1mdWwgfV07XHJcbiAgICAgIH0pKTtcclxuXHJcbiAgICAgIHByb3BhZ2F0ZVJlc0JvZHlEYXRhKHByb2Nlc3NlZFJlc0JvZHlEYXRhKTtcclxuXHJcbiAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiY2F1c2UgLSBmZXRjaCByZXNwb25zZTogYm9keWRhdGEg7JeG7J2MXCIpO1xyXG5cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXHJcbiAgICAgIGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yXHJcbiAgICAgICAgPyBgSlNPTiBwYXJzaW5nIGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXHJcbiAgICAgICAgOiBgUmVxdWVzdCBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9YFxyXG4gICAgKTtcclxuICB9XHJcbn1cclxuXHJcblxyXG5cclxuXHJcbi8vIFJFUVVFU1QgREFUQVxyXG4vLyBbXHJcbi8vICAge1xyXG4vLyAgICAgY2Fub25pY2FsVXJsOiBpdGVtLmNhbm9uaWNhbFVybCxcclxuLy8gICAgICAgdXJsOiBpdGVtLnVybCxcclxuLy8gICAgICAgICBzdGF0dXM6IGZhbHNlLFxyXG4vLyAgICAgICAgICAgaGFybWZ1bDogZmFsc2VcclxuLy8gICB9XHJcbi8vIF1cclxuLy8gUkVTUE9OU0UgREFUQSBleGFtcGxlXHJcbi8vIHtcclxuLy8gICAgIFwiZGF0YVwiOiBbXHJcbi8vICAgICAgICAge1xyXG4vLyAgICAgICAgICAgICBcImNhbm9uaWNhbFVybFwiOiBcImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vcGFnZWFkLzFwLXVzZXItbGlzdC85NjI5ODU2NTYvP2JhY2tlbmQ9aW5uZXJ0dWJlJmNuYW1lPTEmY3Zlcj0yXzIwMjUwODA3JmRhdGE9YmFja2VuZCUzRGlubmVydHViZSUzQmNuYW1lJTNEMSUzQmN2ZXIlM0QyXzIwMjUwODA3JTNCZWwlM0RhZHVuaXQlM0JwdHlwZSUzRGZfYWR2aWV3JTNCdHlwZSUzRHZpZXclM0J1dHVpZCUzRHRkejlMV05OUUtVZzRYcG1hXzQwVWclM0J1dHZpZCUzRDRCeUowejNVTU5FJmlzX3Z0Yz0wJnB0eXBlPWZfYWR2aWV3JnJhbmRvbT00Mjg3NjY0OTYmdXR1aWQ9dGR6OUxXTk5RS1VnNFhwbWFfNDBVZ1wiLFxyXG4vLyAgICAgICAgICAgICBcInVybFwiOiBcImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vcGFnZWFkLzFwLXVzZXItbGlzdC85NjI5ODU2NTYvP2JhY2tlbmQ9aW5uZXJ0dWJlJmNuYW1lPTEmY3Zlcj0yXzIwMjUwODA3JmRhdGE9YmFja2VuZCUzRGlubmVydHViZSUzQmNuYW1lJTNEMSUzQmN2ZXIlM0QyXzIwMjUwODA3JTNCZWwlM0RhZHVuaXQlM0JwdHlwZSUzRGZfYWR2aWV3JTNCdHlwZSUzRHZpZXclM0J1dHVpZCUzRHRkejlMV05OUUtVZzRYcG1hXzQwVWclM0J1dHZpZCUzRDRCeUowejNVTU5FJmlzX3Z0Yz0wJnB0eXBlPWZfYWR2aWV3JnJhbmRvbT00Mjg3NjY0OTYmdXR1aWQ9dGR6OUxXTk5RS1VnNFhwbWFfNDBVZ1wiLFxyXG4vLyAgICAgICAgICAgICBcInN0YXR1c1wiOiB0cnVlLFxyXG4vLyAgICAgICAgICAgICBcImhhcm1mdWxcIjogZmFsc2UsXHJcbi8vICAgICAgICAgICAgIFwiY2F0ZWdvcnlcIjogXCJtZWRpY2FsXCIsXHJcbi8vICAgICAgICAgICAgIFwic2NvcmVcIjogMC40LFxyXG4vLyAgICAgICAgICAgICBcImRldGFpbHNcIjoge1xyXG4vLyAgICAgICAgICAgICAgICAgXCJhZHVsdFwiOiAxLFxyXG4vLyAgICAgICAgICAgICAgICAgXCJzcG9vZlwiOiAxLFxyXG4vLyAgICAgICAgICAgICAgICAgXCJtZWRpY2FsXCI6IDIsXHJcbi8vICAgICAgICAgICAgICAgICBcInZpb2xlbmNlXCI6IDIsXHJcbi8vICAgICAgICAgICAgICAgICBcInJhY3lcIjogMlxyXG4vLyAgICAgICAgICAgICB9LFxyXG4vLyAgICAgICAgICAgICBcInByb2Nlc3NlZFwiOiB0cnVlLFxyXG4vLyAgICAgICAgICAgICBcImVycm9yXCI6IGZhbHNlLFxyXG4vLyAgICAgICAgICAgICBcImVycm9yX21lc3NhZ2VcIjogbnVsbCxcclxuLy8gICAgICAgICAgICAgXCJlcnJvcl90eXBlXCI6IG51bGxcclxuLy8gICAgICAgICB9XHJcbi8vICAgICBdLFxyXG4vLyAgICAgXCJzdW1tYXJ5XCI6IHtcclxuLy8gICAgICAgICBcInRvdGFsXCI6IDEsXHJcbi8vICAgICAgICAgXCJwcm9jZXNzZWRcIjogMSxcclxuLy8gICAgICAgICBcImhhcm1mdWxcIjogMCxcclxuLy8gICAgICAgICBcInNhZmVcIjogMSxcclxuLy8gICAgICAgICBcImVycm9yc1wiOiAwLFxyXG4vLyAgICAgICAgIFwiZXJyb3JfdHlwZXNcIjoge31cclxuLy8gICAgIH0sXHJcbi8vICAgICBcIm1lc3NhZ2VcIjogXCLstJ0gMeqwnCDsnbTrr7jsp4Ag7KSRIDHqsJwg7LKY66asIOyZhOujjCAo67Cw7LmYIEFQSSDtmLjstpw6IDHtmozroZwgMeqwnCDsnbTrr7jsp4Ag64+Z7IucIOyymOumrClcIlxyXG4vLyB9XHJcbiIsIlxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24odXJsLCBudW1PZkhhcm1mdWxJbWcpIHtcclxuICBjb25zdCBzdG9yZWREYXRhID0gYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5nZXQoWydudW1PZkhhcm1mdWxJbWdJblBhZ2UnXSk7XHJcbiAgbGV0IG51bU9mSGFybWZ1bEltZ0luUGFnZSA9IHN0b3JlZERhdGEubnVtT2ZIYXJtZnVsSW1nSW5QYWdlIHx8IHt9O1xyXG5cclxuICBjb25zb2xlLmxvZyhudW1PZkhhcm1mdWxJbWdJblBhZ2UpO1xyXG5cclxuICBpZiAodXJsIGluIG51bU9mSGFybWZ1bEltZ0luUGFnZSkge1xyXG4gICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gKz0gbnVtT2ZIYXJtZnVsSW1nO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA9IG51bU9mSGFybWZ1bEltZztcclxuICB9XHJcblxyXG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uc2V0KHsgJ251bU9mSGFybWZ1bEltZ0luUGFnZSc6IG51bU9mSGFybWZ1bEltZ0luUGFnZSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uKHVybCkge1xyXG4gICAgY29uc3Qgc3RvcmVkRGF0YSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uZ2V0KFsnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJ10pO1xyXG5cclxuICAgICBsZXQgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlID0gc3RvcmVkRGF0YS5udW1PZkhhcm1mdWxJbWdJblBhZ2UgfHwge307XHJcbiAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gPSAwO1xyXG5cclxuICAgICAgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5zZXQoeyAnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJzogbnVtT2ZIYXJtZnVsSW1nSW5QYWdlIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TnVtT2ZIYXJtZnVsSW1nSW50aGlzcGFnZSh1cmwpIHtcclxuICAgIGNvbnN0IHN0b3JlZERhdGEgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLmdldChbJ251bU9mSGFybWZ1bEltZ0luUGFnZSddKTtcclxuICAgIGxldCBudW1PZkhhcm1mdWxJbWdJblBhZ2UgPSBzdG9yZWREYXRhLm51bU9mSGFybWZ1bEltZ0luUGFnZSB8fCB7fTtcclxuXHJcbiAgICByZXR1cm4gbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gPyBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA6IDA7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRUb3RhbE51bU9mSGFybWZ1bEltZyhudW0pIHtcclxuXHJcbiAgICBjb25zdCB0b3RhbE51bU9mSGFybWZ1bEltZyA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ3RvdGFsTnVtT2ZIYXJtZnVsSW1nJ10pLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC50b3RhbE51bU9mSGFybWZ1bEltZyk7XHJcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyd0b3RhbE51bU9mSGFybWZ1bEltZyc6KHRvdGFsTnVtT2ZIYXJtZnVsSW1nKyBudW0pfSk7XHJcbn1cclxuXHJcbiIsIi8vY2hlY2tpbmcgaW1hZ2UgXHJcblxyXG5jb25zdCBESVNBTExPV0VEX0VYVCA9IFsnc3ZnJywgJ3N2Z3onLCAnaWNvJywgJ2N1cicsICdwbmcnXTtcclxuY29uc3QgRElTQUxMT1dFRF9NSU1FID0gWydpbWFnZS9zdmcreG1sJywgJ2ltYWdlL3BuZycsICdpbWFnZS94LWljb24nLCAnaW1hZ2Uvdm5kLm1pY3Jvc29mdC5pY29uJ107IC8vIO2ZleyepeyekOyXkCDrjIDsnZHtlZjripQgTUlNRVxyXG5jb25zdCBNSU5fV0lEVEggPSAxMDA7XHJcbmNvbnN0IE1JTl9IRUlHSFQgPSAxMDA7XHJcbmNvbnN0IE1BWF9XSURUSCA9IDIwMDA7XHJcbmNvbnN0IE1BWF9IRUlHSFQgPSAyMDAwO1xyXG5jb25zdCBNQVhfRklMRV9TSVpFID0gNSAqIDEwMjQgKiAxMDI0OyAvLyA1wqBNQiAo7JiI7IucKVxyXG5cclxuXHJcbi8vIFVSTOyXkOyEnCDtmZXsnqXsnpAg7LaU7LacIO2bhCDtlYTthLDrp4FcclxuZXhwb3J0IGZ1bmN0aW9uIGRpc2NhcmRVbm5lY2Vzc2FyeUltZ2J5VXJsKHVybCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwYXRobmFtZSA9IG5ldyBVUkwodXJsKS5wYXRobmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGNvbnN0IGV4dCA9IHBhdGhuYW1lLnNwbGl0KCcuJykucG9wKCkuc3BsaXQoJz8nKVswXS5zcGxpdCgnIycpWzBdO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwidXJsIOyymOumrCDtm4Qg6rKw6rO8OlwiKyBleHQpO1xyXG4gICAgICAgIHJldHVybiBESVNBTExPV0VEX0VYVC5pbmNsdWRlcyhleHQpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gTUlNRSDtg4DsnoUg7ZWE7YSw66eBXHJcbmZ1bmN0aW9uIGRpc2NhcmRVbm5lY2Vzc2FyeUltZ0J5TWltZShtaW1lVHlwZSkge1xyXG4gICAgaWYgKHR5cGVvZiBtaW1lVHlwZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXR1cm4gRElTQUxMT1dFRF9NSU1FLnNvbWUodCA9PiBtaW1lVHlwZS5zdGFydHNXaXRoKHQpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkaXNjYXJkVW5uZWNlc3NhcnlJbWdCbG9iKGJsb2IpIHtcclxuICAgIC8vIE1JTUUg7YOA7J6FIO2VhO2EsFxyXG4gICAgaWYgKGRpc2NhcmRVbm5lY2Vzc2FyeUltZ0J5TWltZShibG9iLnR5cGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICAvLyDtjIzsnbwg7YGs6riwIOqygOyCrFxyXG4gICAgaWYgKGJsb2Iuc2l6ZSA+IE1BWF9GSUxFX1NJWkUpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIC8vIEltYWdlQml0bWFw7Jy866GcIO2UveyFgCDtgazquLAg6rKA7IKsXHJcbiAgICBjb25zdCBpbWFnZUJpdG1hcCA9IGF3YWl0IGNyZWF0ZUltYWdlQml0bWFwKGJsb2IpO1xyXG4gICAgY29uc3QgdyA9IGltYWdlQml0bWFwLndpZHRoOyAgLy8gSW1hZ2VCaXRtYXAud2lkdGjripQgQ1NTIO2UveyFgCDri6jsnITsnZgg64SI67mE66W8IOuwmO2ZmDpjb250ZW50UmVmZXJlbmNlW29haWNpdGU6M117aW5kZXg9M31cclxuICAgIGNvbnN0IGggPSBpbWFnZUJpdG1hcC5oZWlnaHQ7XHJcbiAgICByZXR1cm4gKHcgPCBNSU5fV0lEVEggfHwgaCA8IE1JTl9IRUlHSFQgfHwgdyA+IE1BWF9XSURUSCB8fCBoID4gTUFYX0hFSUdIVCk7IC8vdHJ1ZSAtPiBkaXNjYXJkXHJcbiAgfVxyXG4iLCJcclxuaW1wb3J0IHt1cGRhdGVEQiB9IGZyb20gJy4uL21vZHVsZXMvaW5kZXhEYi5qcyc7XHJcbmltcG9ydCB7Y2hlY2tUaW1lQW5kUmVmZXRjaH0gZnJvbSAnLi4vbW9kdWxlcy9yZXF1ZXN0SW1nQW5hbHl6ZS5qcyc7XHJcbmltcG9ydCB7IENzQmF0Y2hGb3JXYWl0aW5nIH0gZnJvbSAnLi4vZ2xvYmFsL2JhY2tncm91bmRDb25maWcuanMnO1xyXG5pbXBvcnQge3NldE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24sIGFkZFRvdGFsTnVtT2ZIYXJtZnVsSW1nfSBmcm9tICcuLi91dGlscy9iYWNrZ3JvdW5kVXRpbHMuanMnXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvcGFnYXRlUmVzQm9keURhdGEocmVzcG9uc2VEYXRhLCByZWZldGNoID0gdHJ1ZSkge1xyXG4gICAgY29uc3QgcmVhZHlUb1NlbmQgPSBuZXcgTWFwKCk7IC8vIHRhYmlkIDogW2ltZ0RhdGEsIC4uLi5dXHJcbiAgICBjb25zdCBudW1PZkhhcm1mdWxJbWdJblBhZ2VNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICBsZXQgdG90YWxOdW1PZkhhcm1mdWxXYWl0aW5nSW1nID0gMDtcclxuICAgIHVwZGF0ZURCKHJlc3BvbnNlRGF0YSk7XHJcblxyXG4gICAgZm9yIChjb25zdCBbdXJsLCBpbWdEYXRhXSBvZiBDc0JhdGNoRm9yV2FpdGluZykge1xyXG4gICAgICAgIGlmIChyZXNwb25zZURhdGEuaGFzKHVybFsxXSkpIHtcclxuICAgICAgICAgICAgY29uc3QgaW1nUmVzRGF0YSA9IHJlc3BvbnNlRGF0YS5nZXQodXJsWzFdKTtcclxuICAgICAgICAgICAgbGV0IGZyYW1lcztcclxuICAgICAgICAgICAgaW1nRGF0YS5zdGF0dXMgPSBpbWdSZXNEYXRhLnN0YXR1cztcclxuICAgICAgICAgICAgaW1nRGF0YS5oYXJtZnVsID0gaW1nUmVzRGF0YS5oYXJtZnVsO1xyXG5cclxuICAgICAgICAgICAgaWYgKGltZ1Jlc0RhdGEuaGFybWZ1bCkge1xyXG4gICAgICAgICAgICAgICAgaWYoIW51bU9mSGFybWZ1bEltZ0luUGFnZU1hcC5oYXModXJsWzBdKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwLnNldCh1cmxbMF0sMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwLnNldCh1cmxbMF0sIG51bU9mSGFybWZ1bEltZ0luUGFnZU1hcC5nZXQodXJsWzBdKSsxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFyZWFkeVRvU2VuZC5nZXQoaW1nRGF0YS50YWJJZCkpIHtcclxuICAgICAgICAgICAgICAgIGZyYW1lcyA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgICAgIGZyYW1lcy5zZXQoaW1nRGF0YS5mcmFtZUlkLCBbaW1nRGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgcmVhZHlUb1NlbmQuc2V0KGltZ0RhdGEudGFiSWQsIGZyYW1lcyk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZnJhbWVzID0gcmVhZHlUb1NlbmQuZ2V0KGltZ0RhdGEudGFiSWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmcmFtZXMuZ2V0KGltZ0RhdGEuZnJhbWVJZCkpIGZyYW1lcy5zZXQoaW1nRGF0YS5mcmFtZUlkLCBbaW1nRGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBmcmFtZXMuZ2V0KGltZ0RhdGEuZnJhbWVJZCkucHVzaChpbWdEYXRhKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgQ3NCYXRjaEZvcldhaXRpbmcuZGVsZXRlKHVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc2VuZFdhaXRpbmdDc0RhdGFUb0NzKHJlYWR5VG9TZW5kKTsvLy50aGVuKHJlcyA9PiB7IGNvbnNvbGUubG9nKFwicmVzcG9uc2Ugc3RhdHVzKFdhaXRpbmdDc0RhdGEgU2VuZGVkKTogXCIsIHJlcyk7IH0pY29udGVudHNjcmlwdOyZgCBydW50aW1lbWVzc2FnZSDqtZDsi6BcclxuICAgIFxyXG4gICAgaWYgKHJlZmV0Y2gpIGNoZWNrVGltZUFuZFJlZmV0Y2goKTtcclxuICAgIFxyXG4gICAgZm9yKGNvbnN0IFtwYWdlVXJsLCBjb3VudF0gb2YgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlTWFwKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcInBhZ2VDb3VudEluZm9cXG5cIitwYWdlVXJsKydcXG4nK2NvdW50KTtcclxuICAgICAgICBhd2FpdCBzZXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uKHBhZ2VVcmwsY291bnQpOy8vbXV0dWFsIGV4Y2x1c2lvbuuhnCDsnbjtlZwgYXdhaXQuIOuCmOykkeyXkCDqs7XsnKAgcHJvbWlzZeulvCDsg53shLHtlbTshJwg7ISc67mE7Iqk7JuM7Luk7JeQ7IScIOq4sOuLpOumrOuKlCDsnbzsnbQg7JeG6rKMIOunjOuTpCDsiJjrj4Qg7J6I7J2MXHJcbiAgICAgICAgdG90YWxOdW1PZkhhcm1mdWxXYWl0aW5nSW1nKz0gY291bnQ7XHJcbiAgICB9XHJcbiAgIGFkZFRvdGFsTnVtT2ZIYXJtZnVsSW1nKHRvdGFsTnVtT2ZIYXJtZnVsV2FpdGluZ0ltZyk7XHJcblxyXG4gICAgY29uc29sZS5sb2coXCLtmITsnqwg6riw64uk66as6rOgIOyeiOuKlCBjb250ZW50OiBcIiArIENzQmF0Y2hGb3JXYWl0aW5nLnNpemUpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRXYWl0aW5nQ3NEYXRhVG9DcyhyZWFkeURhdGEpIHtcclxuICAgIGxldCBzZW5kRGF0YTtcclxuICAgIGxldCBzZW5kRGF0YU9uZTtcclxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xyXG4gICAgZm9yIChjb25zdCB0YWJJZCBvZiByZWFkeURhdGEua2V5cygpKSB7XHJcbiAgICAgICAgc2VuZERhdGEgPSByZWFkeURhdGEuZ2V0KHRhYklkKTtcclxuICAgICAgICBmb3IgKGNvbnN0IGZyYW1lSWQgb2Ygc2VuZERhdGEua2V5cygpKSB7XHJcbiAgICAgICAgICAgIHNlbmREYXRhT25lID0gc2VuZERhdGEuZ2V0KGZyYW1lSWQpO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGF3YWl0IGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYklkLFxyXG4gICAgICAgICAgICAgICAgICAgIHsgdHlwZTogXCJpbWdEYXRhV2FpdGluZ0Zyb21TZXJ2aWNlV29ya1wiLCBkYXRhOiBzZW5kRGF0YU9uZSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZnJhbWVJZCB9XHJcbiAgICAgICAgICAgICAgICApKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlLm1lc3NhZ2UuaW5jbHVkZXMoJ0NvdWxkIG5vdCBlc3RhYmxpc2ggY29ubmVjdGlvbicpKSBjb25zb2xlLmVycm9yKFwiY29udGVudHNjcmlwdCDsnZHri7Ug7Jik66WYW3R5cGU6IHdhdGluZyBkYXRhXTogXCIsIGUpOy8vUmVjZWl2aW5nIGVuZCBkb2VzIG5vdCBleGlzdCDihpIg7J6g7IucIO2bhCDsnqzsi5zrj4RcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhcImNvbnRlbnRzY3JpcHQg7J2R64u1IOqysOqzvFt0eXBlOiB3YXRpbmcgZGF0YV1cIik7XHJcbiAgICByZXN1bHQuZm9yRWFjaChyZXMgPT4geyBjb25zb2xlLmxvZyhyZXMpOyB9KTtcclxuICAgIGNvbnNvbGUubG9nKFwi7LSdIOyImOufiTogXCIsIHJlc3VsdC5sZW5ndGgpO1xyXG5cclxuICB9XHJcblxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIlxyXG5jb25zdCBjdXJyZW50VGFicyA9IG5ldyBNYXAoKTtcclxuY29uc3QgY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0ID0gbmV3IE1hcCgpO1xyXG5jb25zdCByZXRyeVRocmVzaG9sZCA9IDE1ICogMTAwMDtcclxuXHJcbmxldCBpbml0V29ya2VyRmxhZyA9IGZhbHNlO1xyXG5sZXQgaW5pdFdvcmtlclByb21pc2UgPSBudWxsO1xyXG5cclxuXHJcbmNvbnN0IGNvbnRleHRDb250cm9sTWVudSA9IHtcclxuICAnSW1nU2hvdyc6ICfsnbTrr7jsp4Ag67O07J206riwJyxcclxuICAnSW1nSGlkZSc6ICfsnbTrr7jsp4Ag6rCQ7LaU6riwJyxcclxufVxyXG5cclxubGV0IGNsaWNrZWRJbWdTcmMgPSBudWxsO1xyXG5sZXQgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IHRydWU7XHJcbmxldCBzdG9yZWRJbnRlcmNlcHRvclN0YXR1cyA9IG51bGw7XHJcbi8vXHJcbmxldCB0b3RhbGltZyA9IDA7XHJcbmxldCBpbnRlcmNlcHRvclNpdGUgPSBudWxsO1xyXG5sZXQgdG90YWxOdW1PZkhhcm1mdWxJbWc7XHJcblxyXG5cclxuXHJcblxyXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2Usc2VuZGVyLHNlbmRSZXNwb25zZSk9PiB7XHJcbiAgaWYgKG1lc3NhZ2Uuc291cmNlID09PSBcImNvbnRlbnRcIikge1xyXG4gICAgdHJ5e1xyXG4gICAgICBpZiAoIWluaXRXb3JrZXJGbGFnKSB7XHJcbiAgXHJcbiAgICAgICAgaW5pdFNlcnZpY2VXb3JrZXIobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgY2FsbEJhY2tGb3JDb250ZW50U2NyaXB0KG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKTtcclxuICAgICAgICB9KTtcclxuICBcclxuICAgICAgfVxyXG4gICAgICBlbHNlICBjYWxsQmFja0ZvckNvbnRlbnRTY3JpcHQobWVzc2FnZSxzZW5kZXIsc2VuZFJlc3BvbnNlKTtcclxuICAgIH1cclxuICAgIGNhdGNoKGUpe1xyXG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIFxyXG59KTtcclxuXHJcbmNocm9tZS5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKGFzeW5jICgpID0+IHtcclxuXHJcbiAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xyXG4gICAgaWQ6ICdtYWluQ29udHJvbE1lbnUnLFxyXG4gICAgdGl0bGU6ICdJbWFnZUludGVyY2VwdG9yIC0g7Jyg7ZW0IOydtOuvuOyngCDssKjri6gg7ZSE66Gc6re4656oJyxcclxuICAgIGNvbnRleHRzOiBbJ2FsbCddXHJcbiAgfSk7XHJcblxyXG4gIGZvciAoY29uc3QgW21lbnVJZCwgbWVudVRpdGxlXSBvZiBPYmplY3QuZW50cmllcyhjb250ZXh0Q29udHJvbE1lbnUpKSB7XHJcbiAgICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XHJcbiAgICAgIGlkOiBtZW51SWQsXHJcbiAgICAgIHBhcmVudElkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgICAgdGl0bGU6IG1lbnVUaXRsZSxcclxuICAgICAgdHlwZTogJ3JhZGlvJyxcclxuICAgICAgY29udGV4dHM6IFsnYWxsJ11cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn0pO1xyXG5cclxuXHJcbmNocm9tZS5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKChpdGVtLCB0YWIpID0+IHtcclxuXHJcbiAgaWYgKGNsaWNrZWRJbWdTcmMgPT09IG51bGwpIHtcclxuICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdJbWdTaG93JywgeyBjaGVja2VkOiB0cnVlIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgY29udHJvbElkID0gaXRlbS5tZW51SXRlbUlkO1xyXG4gIGNvbnN0IGltZ0luZm8gPSB7IHRhYklkOiB0YWIuaWQsIGZyYW1lSWQ6IGl0ZW0uZnJhbWVJZCwgdXJsOiBpdGVtLnNyY1VybCB9O1xyXG5cclxuICBjb25zb2xlLmxvZyhcIuy7qO2FjeyKpO2KuCDtgbTrpq1cIik7XHJcbiAgaWYgKGNvbnRyb2xJZCA9PT0gY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LmdldChjbGlja2VkSW1nU3JjKSkgcmV0dXJuO1xyXG5cclxuXHJcbiAgdHJ5IHtcclxuICAgIC8v7LaU67aAIHByb21pc2XstpTqsIBcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UoaW1nSW5mby50YWJJZCwge1xyXG4gICAgICBzb3VyY2U6IFwic2VydmljZV93b3JrZXJcIixcclxuICAgICAgdHlwZTogJ2NvbnRyb2xfaW1nJyxcclxuICAgICAgaXNTaG93OiBjb250cm9sSWQgPT09ICdJbWdTaG93JyA/IHRydWUgOiBmYWxzZVxyXG4gICAgfSwgeyBmcmFtZUlkOiBpbWdJbmZvLmZyYW1lSWQgfSk7XHJcblxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICBjb25zb2xlLmxvZyhyZXNwb25zZS5tZXNzYWdlKTtcclxuICAgICAgLy90aHJvdyBuZXcgRXJyb3IocmVzcG9uc2UubWVzc2FnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LnNldChjbGlja2VkSW1nU3JjLCBjb250cm9sSWQpO1xyXG4gICAgY2xpY2tlZEltZ1NyYyA9IG51bGw7XHJcblxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBpZiAoIWVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoJ0NvdWxkIG5vdCBlc3RhYmxpc2ggY29ubmVjdGlvbicpKSBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdJbWdTaG93JywgeyBjaGVja2VkOiB0cnVlIH0pO1xyXG4gIH1cclxuICByZXR1cm4gdHJ1ZTtcclxuXHJcbn0pO1xyXG5cclxuXHJcbi8vcG9wdXAg66as7Iqk64SIXHJcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICBpZiAobWVzc2FnZS5zb3VyY2UgPT09IFwicG9wdXBcIikge1xyXG4gICAgKGFzeW5jICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBsZXQgcmVzcG9uc2VTdGF0dXMgPSB0cnVlO1xyXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XHJcbiAgICAgICAgICBjYXNlIFwiYWN0aXZlX2ludGVyY2VwdG9yXCI6XHJcbiAgICAgICAgICAgIHJlc3BvbnNlU3RhdHVzID0gYXdhaXQgYWN0aXZlSW50ZXJjZXB0b3IobWVzc2FnZS5hY3RpdmUpO1xyXG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlU3RhdHVzLm9rKSBjb25zb2xlLmVycm9yKHJlc3BvbnNlU3RhdHVzLm9rKTtcclxuICAgICAgICAgICAgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IG1lc3NhZ2UuYWN0aXZlO1xyXG4gICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZSgnbWFpbkNvbnRyb2xNZW51JywgeyBlbmFibGVkOiBpc0ludGVyY2VwdG9yQWN0aXZlID8gdHJ1ZSA6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogcmVzcG9uc2VTdGF0dXMub2sgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGNhc2UgXCJzZXRfZmlsdGVyX3N0YXR1c1wiOlxyXG4gICAgICAgICAgICByZXNwb25zZVN0YXR1cyA9IGF3YWl0IHNldEZpbHRlclN0YXR1cyhtZXNzYWdlLkZpbHRlclN0YXR1cyk7XHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2VTdGF0dXMub2spIGNvbnNvbGUuZXJyb3IocmVzcG9uc2VTdGF0dXMubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiByZXNwb25zZVN0YXR1cy5vayB9KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlIFwicG9wdXBfZXJyb3JcIjpcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZnJvbSBwb3B1cDogXCIgKyBtZXNzYWdlLmVycm9yKTtcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNhbiBub3QgcmVhZCBwb3B1cCBtZXNzYWdlIHR5cGVcIik7XHJcbiAgICAgICAgICBjYXNlIFwic3luY19ibGFja19saXN0XCI6XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgaW50ZXJjZXB0b3JTaXRlLnNldChtZXNzYWdlLnJvb3RJbnN0YW5jZVswXSwgbWVzc2FnZS5yb290SW5zdGFuY2VbMV0pO1xyXG4gICAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdpbnRlcmNlcHRvclNpdGUnOiBPYmplY3QuZnJvbUVudHJpZXMoaW50ZXJjZXB0b3JTaXRlKSB9KTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgXCJzZXRfZmlsdGVyaW5nX3N0ZXBcIjpcclxuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ZpbHRlcmluZ1N0ZXAnOiBtZXNzYWdlLnZhbHVlIH0pO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlLnZhbHVlKTtcclxuICAgICAgICAgICAgc2V0Q3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZShtZXNzYWdlLnZhbHVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogZmFsc2UgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbn0pO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5pbXBvcnQgKiBhcyBpbmRleERiIGZyb20gJy4vbW9kdWxlcy9pbmRleERiLmpzJztcclxuaW1wb3J0IHsgQ3NCYXRjaEZvcldhaXRpbmcsIHNldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUgfSBmcm9tICcuL2dsb2JhbC9iYWNrZ3JvdW5kQ29uZmlnLmpzJztcclxuaW1wb3J0IHsgZmV0Y2hCYXRjaCB9IGZyb20gJy4vbW9kdWxlcy9yZXF1ZXN0SW1nQW5hbHl6ZS5qcyc7XHJcbmltcG9ydCB7c2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbiwgaW5pdE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb259IGZyb20gJy4vdXRpbHMvYmFja2dyb3VuZFV0aWxzLmpzJ1xyXG5cclxuXHJcbi8v7LSI6riw7ZmUIOy9lOuTnFxyXG5cclxuXHJcblxyXG4vL+u5hOuPmeq4sCDspIDruYQg7J6R7JeF7J20IOyZhOujjOuQmOyWtOyVvCDri6TsnYwg7L2U65Oc66W8IOyLpO2Wie2VoCDsiJgg7J6I64qUIO2UhOuhnOuniOydtOyKpCDqsJ3ssrQocmVzb2x2ZWTqsIAg67CY7ZmY65CY7Ja07JW8IO2VqCkuIO2VqOyImCDsnpDssrTripQg67CU66GcIOyLpO2WiVxyXG5sZXQgUHJvbWlzZUZvckRCSW5pdCA9IGluZGV4RGIuaW5pdEluZGV4RGIoKTtcclxuXHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbml0U2VydmljZVdvcmtlcihtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xyXG5cclxuICBpZihpbml0V29ya2VyUHJvbWlzZSA9PT0gbnVsbCl7XHJcbiAgICBpbml0V29ya2VyUHJvbWlzZSA9IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc3RvcmVkSW50ZXJjZXB0b3JTdGF0dXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydpbnRlcmNlcHRvclN0YXR1cyddKTtcclxuICAgICAgICBsZXQgc2F2ZWRTdGF0dXMgPSBzdG9yZWRJbnRlcmNlcHRvclN0YXR1cy5pbnRlcmNlcHRvclN0YXR1cztcclxuICAgICAgICBpZiAoc2F2ZWRTdGF0dXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU3RhdHVzJzogMSB9KTtcclxuICAgICAgICAgIHNhdmVkU3RhdHVzID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IHNhdmVkU3RhdHVzID09PSAxID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMudXBkYXRlKCdtYWluQ29udHJvbE1lbnUnLCB7IGVuYWJsZWQ6IGlzSW50ZXJjZXB0b3JBY3RpdmUgfSk7XHJcbiAgXHJcbiAgXHJcbiAgICAgICAgY29uc3Qgc3RvcmVkSW50ZXJjZXB0b3JTaXRlID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnaW50ZXJjZXB0b3JTaXRlJ10pO1xyXG4gICAgICAgIGlmIChzdG9yZWRJbnRlcmNlcHRvclNpdGUgPT09IHVuZGVmaW5lZCB8fCBzdG9yZWRJbnRlcmNlcHRvclNpdGUuaW50ZXJjZXB0b3JTaXRlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdpbnRlcmNlcHRvclNpdGUnOiB7fSB9KTtcclxuICAgICAgICAgIGludGVyY2VwdG9yU2l0ZSA9IG5ldyBNYXAoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBpbnRlcmNlcHRvclNpdGUgPSBuZXcgTWFwKE9iamVjdC5lbnRyaWVzKHN0b3JlZEludGVyY2VwdG9yU2l0ZS5pbnRlcmNlcHRvclNpdGUpKTtcclxuICAgICAgICB9XHJcbiAgXHJcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsndG90YWxOdW1PZkhhcm1mdWxJbWcnXSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgaWYgKCFyZXN1bHQudG90YWxOdW1PZkhhcm1mdWxJbWcpIHtcclxuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ3RvdGFsTnVtT2ZIYXJtZnVsSW1nJzogMCB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICBcclxuICBcclxuICAgICAgICBjb25zdCBzdG9yZWRDdXJyZW50RmlsdGVyaW5nU3RlcFZhbHVlID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnZmlsdGVyaW5nU3RlcCddKS50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAnZmlsdGVyaW5nU3RlcCc6IDEgfSk7XHJcbiAgICAgICAgICBsZXQgdmFsdWUgPSByZXN1bHQuZmlsdGVyaW5nU3RlcDtcclxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJpbmdTdGVwJzogMSB9KTtcclxuICAgICAgICAgICAgdmFsdWUgPSAxO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldEN1cnJlbnRGaWx0ZXJpbmdTdGVwVmFsdWUoc3RvcmVkQ3VycmVudEZpbHRlcmluZ1N0ZXBWYWx1ZSk7XHJcblxyXG4gICAgICAgIHJlc29sdmUoKTtcclxuXHJcbiAgICAgICAgaW5pdFdvcmtlckZsYWcgPSB0cnVlOyAvL+u5hOuPmeq4sCDstIjquLDtmZQg7J6R7JeFIOuBneuCtOqzoCBmbGFnIHRydWXroZwg67OA6rK9XHJcblxyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoKGUpe1xyXG4gICAgICAgIHJlamVjdChlKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBpbml0V29ya2VyUHJvbWlzZTtcclxuICAgIGluaXRXb3JrZXJQcm9taXNlID0gbnVsbDtcclxuICB9XHJcbiAgY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBnZXRQYWdlVXJsRnJvbVRhYklkKHRhYklkKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xyXG4gICAgY2hyb21lLnRhYnMuZ2V0KHRhYklkLCAodGFiKSA9PiB7XHJcbiAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgZWxzZSByZXNvbHZlKHRhYi51cmwpO1xyXG4gICAgfSk7XHJcbiAgfSlcclxufVxyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNoZWNrQ3NEYXRhKHRhYklkLCBmcmFtZUlkLCBiYXRjaCkge1xyXG4gIFxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBQcm9taXNlRm9yREJJbml0OyAvL2RiIGluaXQg7ZSE66Gc66+47IqkIOq4sOuLpOumvC4gXHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBhZ2VVcmwgPSBhd2FpdCBnZXRQYWdlVXJsRnJvbVRhYklkKHRhYklkKS50aGVuKHBhZ2VVcmw9PnBhZ2VVcmwpLmNhdGNoKGVycj0+e2NvbnNvbGUuZXJyb3IoZXJyKTt9KTsgIFxyXG4gIFxyXG4gIGNvbnN0IENzQmF0Y2hGb3JEQkFkZCA9IFtdO1xyXG4gIFxyXG4gIGxldCBudW1PZkhhcm1mdWxJbWcgPSAwO1xyXG4gIFxyXG4gIGxldCBjc0JhdGNoRm9yUmVzcG9uc2UgPSBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgIFxyXG4gICAgYmF0Y2gubWFwKGFzeW5jIChpdGVtKSA9PiB7XHJcbiAgICAgIGNvbnN0IHR4ID0gaW5kZXhEYi5EQi50cmFuc2FjdGlvbignaW1nVVJMJywgJ3JlYWR3cml0ZScpO1xyXG4gICAgICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgaWYgKGluZGV4RGIua2V5U2V0LmhhcyhpdGVtLnVybCkpIHtcclxuICAgICAgICAgIFxyXG5cclxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgaW5kZXhEYi5yZXFUYWJsZVByb21pc2Uoc3RvcmUuZ2V0KGl0ZW0udXJsKSkudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwidGFibGXsl5DshJwga2V5IOyhsO2ajO2VmOqzoCB2YWx1ZSDqsIDsoLjsmKTripQg7KSR7JeQIEVycm9yIOuwnOyDnTpcIiwgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBpZiAoIXZhbHVlLnJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi642w7J207YSwIOuyoOydtOyKpOyXkCDsnojsp4Drp4wg7J2R64u17J2EIOuwm+yngCDrqrvtlZwgIGltZyBpZDogXCIgKyBpdGVtLmlkKTtcclxuICAgICAgICAgICAgaWYgKHJldHJ5VGhyZXNob2xkIDwgKERhdGUubm93KCkgLSB2YWx1ZS5zYXZlVGltZSkpIHtcclxuICAgICAgICAgICAgICBDc0JhdGNoRm9yREJBZGQucHVzaChpdGVtKTsgLy/rhIjrrLQg7Jik656r64+Z7JWIIOydkeuLteydhCDrjIDquLDtlZjqs6Ag7J6I64qUIOuNsOydtO2EsOyYgOuLpOuptCwg7J6s7JqU7LKtIOuwsOy5mOyXkCDstpTqsIBcclxuICAgICAgICAgICAgICB2YWx1ZS5zYXZlVGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgYXdhaXQgaW5kZXhEYi5yZXFUYWJsZVByb21pc2Uoc3RvcmUucHV0KHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaXRlbS50YWJJZCA9IHRhYklkO1xyXG4gICAgICAgICAgICBpdGVtLmZyYW1lSWQgPSBmcmFtZUlkO1xyXG4gICAgICAgICAgICBDc0JhdGNoRm9yV2FpdGluZy5zZXQoW3BhZ2VVcmwsaXRlbS51cmxdLCBpdGVtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuuNsOydtO2EsCDrsqDsnbTsiqTsl5Ag7J6I64qUIGltZyBpZDogXCIgKyBpdGVtLmlkICsgXCLsg4Htg5wv7Jyg7ZW0L+ydkeuLtTogXCIgKyB2YWx1ZS5zdGF0dXMgKyBcIiZcIiArIHZhbHVlLmhhcm1mdWwgKyBcIiZcIiArIHZhbHVlLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLnN0YXR1cykge1xyXG4gICAgICAgICAgICAgIGl0ZW0uc3RhdHVzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICBpZiAodmFsdWUuaGFybWZ1bCkge1xyXG4gICAgICAgICAgICAgICAgbnVtT2ZIYXJtZnVsSW1nKys7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmhhcm1mdWwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coXCLrjbDsnbTthLAg67Kg7J207Iqk7JeQIOyXhuuKlCBpbWcgaWQ6IFwiICsgaXRlbS5pZCk7XHJcbiAgICAgICAgICBjb25zdCBjYWNoQ2hlY2sgPSBhd2FpdCBjYWNoZXMubWF0Y2goaXRlbS51cmwpO1xyXG5cclxuICAgICAgICAgIGlmIChjYWNoQ2hlY2spIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjYWNoIO2ZleyduCDqsrDqs7wsIOydvOy5mO2VmOuKlCB1cmzsnojsnYxcIik7XHJcbiAgICAgICAgICAgIC8v7ZiE7J6sIOydtCDrtoDrtoTsnbQg7KCc64yA66GcIOuPmeyeke2VmOuKlOyngCwg7Jyg7Zqo7ISx7J20IOyeiOuKlOyngCDsnpgg66qo66W06rKg7J2MLiBcclxuICAgICAgICAgICAgLy/rp4zslb3sl5AgY2FjaOqwgCDsobTsnqztlZzri6TrqbQgZGLsl5Ag7ZW064u5IOydtOuvuOyngCDrjbDsnbTthLAg7LaU6rCALCDqt7jrpqzqs6AgXHJcbiAgICAgICAgICAgIC8vY3NCYXRjaEZvclJlc3BvbnNl7JeQ64+EIOy2lOqwgFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBpbmRleERiLmtleVNldC5hZGQoaXRlbS51cmwpO1xyXG4gICAgICAgICAgICAvL+uNsOydtO2EsCDsl4bsnYwuIERCIOy2lOqwgO2VmOqzoCBmZXRjaFxyXG5cclxuXHJcbiAgICAgICAgICAgIGl0ZW0udGFiSWQgPSB0YWJJZDtcclxuICAgICAgICAgICAgaXRlbS5mcmFtZUlkID0gZnJhbWVJZDtcclxuICAgICAgICAgICAgQ3NCYXRjaEZvcldhaXRpbmcuc2V0KFtwYWdlVXJsLGl0ZW0udXJsXSwgaXRlbSk7IC8vZmV0Y2jtlaAg642w7J207YSw64+EIOqysOq1rSByZXNwb25zZSA9IGZhbHNl7J24IOuNsOydtO2EsOyZgCDtlajqu5ggY3NiYXRjaGZvcndhaXRpbmfsl5DshJwg6riw64uk66a8XHJcblxyXG4gICAgICAgICAgICBDc0JhdGNoRm9yREJBZGQucHVzaChpdGVtKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCLsnbTrr7jsp4Ag67mE6rWQ7KSRIOyXkOufrDogXCIsIGUsIFwiXFxuVVJMOiBcIiwgaXRlbS51cmwpO1xyXG4gICAgICB9XHJcbiAgICB9KSk7XHJcblxyXG4gIGlmIChDc0JhdGNoRm9yREJBZGQ/Lmxlbmd0aCAhPSAwKSB7XHJcblxyXG4gICAgY29uc3QgdHggPSBpbmRleERiLkRCLnRyYW5zYWN0aW9uKCdpbWdVUkwnLCAncmVhZHdyaXRlJyk7XHJcbiAgICBjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdpbWdVUkwnKTtcclxuXHJcbiAgICBDc0JhdGNoRm9yREJBZGQuZm9yRWFjaChpbWdkYXRhID0+IHtcclxuICAgICAgc3RvcmUucHV0KFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHVybDogaW1nZGF0YS51cmwsXHJcbiAgICAgICAgICBkb21haW46IChuZXcgVVJMKGltZ2RhdGEudXJsKSkuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcLi8sICcnKSwvL+yImOygleyYiOyglSxcclxuICAgICAgICAgIHJlc3BvbnNlOiBmYWxzZSxcclxuICAgICAgICAgIHN0YXR1czogZmFsc2UsICAgLy8g6rKA7IKs7JmE66OMXHJcbiAgICAgICAgICBoYXJtZnVsOiBmYWxzZSwgICAvLyDquLDrs7jqsJJcclxuICAgICAgICAgIHNhdmVUaW1lOiBEYXRlLm5vdygpXHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZmV0Y2hCYXRjaChDc0JhdGNoRm9yREJBZGQsIHRhYklkLCBmcmFtZUlkKTtcclxuICAgIC8vZGIg7LaU6rCA7ZaI7Jy864uIIGZldGNoLlxyXG4gIH1cclxuXHJcbiAgLy9jb25zb2xlLmxvZyhcInBhZ2VDb3VudEluZm9cXG5cIitwYWdlVXJsKydcXG4nK251bU9mSGFybWZ1bEltZyk7XHJcbiAgc2V0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbihwYWdlVXJsLCBudW1PZkhhcm1mdWxJbWcpO1xyXG5cclxuXHJcbiAgLy9jb25zdCBkZWxheSA9IGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAyMDApKTtcclxuXHJcbiAgY3NCYXRjaEZvclJlc3BvbnNlID0gY3NCYXRjaEZvclJlc3BvbnNlLmZpbHRlcih4ID0+IHggIT09IHVuZGVmaW5lZCk7XHJcbiAgY29uc29sZS5sb2coJ1JlY2VpdmluZyAgcmVxdWVzdDonLCBiYXRjaCk7XHJcbiAgY29uc29sZS5sb2coJ1NlbmRpbmcgcmVzcG9uc2U6JywgY3NCYXRjaEZvclJlc3BvbnNlKTtcclxuICByZXR1cm4gY3NCYXRjaEZvclJlc3BvbnNlOyAvL+uwm+ydgCDrsLDsuZgg7KSR7JeQ7IScIOuwlOuhnCDsnZHri7XtlaAg7J2066+47KeAIOqwneyytOunjCDrhKPslrTshJwgcmV0dXJuXHJcbn1cclxuXHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vZXZlbnQgbGlzdGVyLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vL+y9mO2FkOy4oCDsiqTtgazrpr3tirgg66as7Iqk64SIXHJcblxyXG5mdW5jdGlvbiBjYWxsQmFja0ZvckNvbnRlbnRTY3JpcHQobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHN3aXRjaCAobWVzc2FnZT8udHlwZSkge1xyXG5cclxuICAgICAgICBjYXNlIFwiaW1nRGF0YUZyb21Db250ZW50U2NyaXB0XCI6XHJcbiAgICAgICAgICBjaGVja0NzRGF0YShzZW5kZXI/LnRhYj8uaWQsIHNlbmRlcj8uZnJhbWVJZCwgbWVzc2FnZS5kYXRhKS50aGVuKGJhdGNoRnJvbVNjcmlwdCA9PiB7XHJcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJyZXNwb25zZVwiLFxyXG4gICAgICAgICAgICAgIGRhdGE6IGJhdGNoRnJvbVNjcmlwdCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBjYXNlIFwicmVnaXN0ZXJfZnJhbWVcIjpcclxuICAgICAgICAgIGlmICghY3VycmVudFRhYnMuZ2V0KHNlbmRlcj8udGFiPy5pZCkpIHtcclxuICAgICAgICAgICAgY3VycmVudFRhYnMuc2V0KHNlbmRlcj8udGFiPy5pZCwgW3NlbmRlcj8uZnJhbWVJZF0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudFRhYnMuZ2V0KHNlbmRlcj8udGFiPy5pZCkuaW5jbHVkZXMoc2VuZGVyPy5mcmFtZUlkKSkge1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRUYWJzLmdldChzZW5kZXI/LnRhYj8uaWQpLnB1c2goc2VuZGVyPy5mcmFtZUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGdldFBhZ2VVcmxGcm9tVGFiSWQoc2VuZGVyPy50YWI/LmlkKS50aGVuKHBhZ2VVcmwgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwYWdlVXJsKTtcclxuICAgICAgICAgICAgaW5pdE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24ocGFnZVVybCk7XHJcbiAgICAgICAgICB9KS5jYXRjaChlcnIgPT4geyBjb25zb2xlLmVycm9yKGVycik7IH0pO1xyXG5cclxuICAgICAgICAgIHNlbmRSZXNwb25zZSh7IG9rOiB0cnVlIH0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgXCJpbWFnZUNsaWNrZWRcIjpcclxuICAgICAgICAgIGlmIChtZXNzYWdlLmltZ1NyYykge1xyXG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMucmVtb3ZlQWxsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgIGlkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgICAgICAgICAgICAgICAgdGl0bGU6ICdJbWFnZUludGVyY2VwdG9yIC0g7Jyg7ZW0IOydtOuvuOyngCDssKjri6gg7ZSE66Gc6re4656oJyxcclxuICAgICAgICAgICAgICAgICAgY29udGV4dHM6IFsnYWxsJ11cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW21lbnVJZCwgbWVudVRpdGxlXSBvZiBPYmplY3QuZW50cmllcyhjb250ZXh0Q29udHJvbE1lbnUpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbWVudUlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudElkOiAnbWFpbkNvbnRyb2xNZW51JyxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogbWVudVRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdyYWRpbycsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dHM6IFsnYWxsJ11cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5oYXMobWVzc2FnZS5pbWdTcmMpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRyb2xNZW51SW1nU3RhdHVzTGlzdC5zZXQobWVzc2FnZS5pbWdTcmMsIG1lc3NhZ2UuaXNTaG93ID09PSB0cnVlID8gJ0ltZ1Nob3cnIDogJ0ltZ0hpZGUnKTtcclxuICAgICAgICAgICAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy51cGRhdGUobWVzc2FnZS5pc1Nob3cgPT09IHRydWUgPyAnSW1nU2hvdycgOiAnSW1nSGlkZScsIHsgY2hlY2tlZDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJuZXcgaW1nXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGFub3RoZXJJdGVtU3RhdHVzID0gY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LmdldChtZXNzYWdlLmltZ1NyYykgPT09ICdJbWdTaG93JyA/ICdJbWdIaWRlJyA6ICdJbWdTaG93JztcclxuICAgICAgICAgICAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy51cGRhdGUoY29udHJvbE1lbnVJbWdTdGF0dXNMaXN0LmdldChtZXNzYWdlLmltZ1NyYykgPT09ICdJbWdTaG93JyA/ICdJbWdTaG93JyA6ICdJbWdIaWRlJywgeyBjaGVja2VkOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJpbWcg7KG07J6sOiBcIiArIG1lc3NhZ2UuaW1nU3JjKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjbGlja2VkSW1nU3JjID0gbWVzc2FnZS5pbWdTcmM7XHJcblxyXG5cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICBjYXNlIFwiY2hlY2tfYmxhY2tfbGlzdFwiOlxyXG4gICAgICAgICBcclxuICAgICAgICAgIGxldCBpc0luQmxhY2tMaXN0ID0gZmFsc2U7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJjZXB0b3JTaXRlLmhhcyhtZXNzYWdlLnNpdGUpKSB7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0U2l0ZSA9IGludGVyY2VwdG9yU2l0ZS5nZXQobWVzc2FnZS5zaXRlKTtcclxuICAgICAgICAgICAgICBpZiAoIXRhcmdldFNpdGVbXCJhY3RpdmVcIl0pIHtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7ZeI7Jqp65CY7KeAIOyViuydgCDsgqzsnbTtirgyXCIpO1xyXG4gICAgICAgICAgICAgICAgaXNJbkJsYWNrTGlzdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFNpdGVbXCJwYWdlXCJdLmluY2x1ZGVzKG1lc3NhZ2UucGF0aCkpIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIu2XiOyaqeuQmOyngCDslYrsnYAg7Y6Y7J207KeAXCIpO1xyXG4gICAgICAgICAgICAgICAgICBpc0luQmxhY2tMaXN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcclxuICAgICAgICAgICAgICBvazogdHJ1ZSxcclxuICAgICAgICAgICAgICByZXN1bHQ6IGlzSW5CbGFja0xpc3RcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBvY2N1cmVkIHdoaWxlIHJlc3BvbnNpbmcgd2l0aCBzY3JpcHQ6IFtcIitlK1wiXVwiKTtcclxuICAgICAgc2VuZFJlc3BvbnNlKHtcclxuICAgICAgICBvazogZmFsc2UsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFjdGl2ZUludGVyY2VwdG9yKGZsYWcpIHtcclxuICBjb25zdCByZXN1bHQgPSB7IG9rOiB0cnVlLCBtZXNzYWdlOiBbXSB9O1xyXG5cclxuICBmb3IgKGNvbnN0IFt0YWJJZCwgZnJhbWVzXSBvZiBjdXJyZW50VGFicykge1xyXG4gICAgaWYgKCFmcmFtZXMpIGNvbnRpbnVlO1xyXG5cclxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwge1xyXG4gICAgICAgICAgc291cmNlOiBcInNlcnZpY2Vfd29ya2VyXCIsXHJcbiAgICAgICAgICB0eXBlOiAnYWN0aXZlX2ludGVyY2VwdG9yJyxcclxuICAgICAgICAgIGFjdGl2ZTogZmxhZ1xyXG4gICAgICAgIH0sIHsgZnJhbWVJZDogZnJhbWUgfSk7XHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgcmVzdWx0Lm9rID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2gocmVzcG9uc2UubWVzc2FnZSk7XHJcblxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmICghZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnQ291bGQgbm90IGVzdGFibGlzaCBjb25uZWN0aW9uJykpIHJlc3VsdC5vayA9IGZhbHNlO1xyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2goZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0RmlsdGVyU3RhdHVzKGZsYWcpIHtcclxuICBjb25zdCByZXN1bHQgPSB7IG9rOiB0cnVlLCBtZXNzYWdlOiBbXSB9O1xyXG5cclxuICBmb3IgKGNvbnN0IFt0YWJJZCwgZnJhbWVzXSBvZiBjdXJyZW50VGFicykge1xyXG4gICAgaWYgKCFmcmFtZXMpIGNvbnRpbnVlO1xyXG5cclxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwge1xyXG4gICAgICAgICAgc291cmNlOiBcInNlcnZpY2Vfd29ya2VyXCIsXHJcbiAgICAgICAgICB0eXBlOiAnc2V0X2ZpbHRlcl9zdGF0dXMnLFxyXG4gICAgICAgICAgRmlsdGVyU3RhdHVzOiBmbGFnXHJcbiAgICAgICAgfSwgeyBmcmFtZUlkOiBmcmFtZSB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgcmVzdWx0Lm9rID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2gocmVzcG9uc2UubWVzc2FnZSk7XHJcblxyXG4gICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmICghZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnQ291bGQgbm90IGVzdGFibGlzaCBjb25uZWN0aW9uJykpIHJlc3VsdC5vayA9IGZhbHNlO1xyXG4gICAgICAgIHJlc3VsdC5tZXNzYWdlLnB1c2goZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9