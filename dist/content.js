/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/global/buffer.js":
/*!*********************************!*\
  !*** ./src/js/global/buffer.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const dataBuffer = [];

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (dataBuffer);

/***/ }),

/***/ "./src/js/global/contentConfig.js":
/*!****************************************!*\
  !*** ./src/js/global/contentConfig.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getInterceptorActive: () => (/* binding */ getInterceptorActive),
/* harmony export */   getPermissionForMasking: () => (/* binding */ getPermissionForMasking),
/* harmony export */   isInterceptorActive: () => (/* binding */ isInterceptorActive),
/* harmony export */   permissionForMasking: () => (/* binding */ permissionForMasking),
/* harmony export */   setInterceptorActive: () => (/* binding */ setInterceptorActive),
/* harmony export */   setPermissionForMasking: () => (/* binding */ setPermissionForMasking)
/* harmony export */ });


let permissionForMasking = true;
let isInterceptorActive = true;

function setPermissionForMasking(flag) { permissionForMasking = flag; }
function setInterceptorActive(flag) { isInterceptorActive = flag; }
function getInterceptorActive() { return isInterceptorActive; }
function getPermissionForMasking() { return permissionForMasking; }



/***/ }),

/***/ "./src/js/modules/imgObs.js":
/*!**********************************!*\
  !*** ./src/js/modules/imgObs.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/contentUtils.js */ "./src/js/utils/contentUtils.js");
/* harmony import */ var _utils_url_filterModule_based_safe_pattern_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/url_filterModule_based_safe_pattern.js */ "./src/js/utils/url_filterModule_based_safe_pattern.js");
/* harmony import */ var _global_contentConfig_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../global/contentConfig.js */ "./src/js/global/contentConfig.js");
/* harmony import */ var _global_buffer_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../global/buffer.js */ "./src/js/global/buffer.js");
/* harmony import */ var _utils_flush_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/flush.js */ "./src/js/utils/flush.js");








let totalimg = 0;
let NoNSafeImgCount = 0;

//상대경로 -> 절대경로
function toAbsoluteUrl(url, baseUrl = document.baseURI) {
  try {
    return new URL(url, baseUrl);
  } catch {
    return url;
  }
}

/**.
 * @param {object} img - dom 이미지 노드
 * @param {string} type - 정적 교체/동적 교체 기록
 */
function checkConditionAndSend(img, type) {
  const url = img.currentSrc || img.src;
  let absUrl;
  if (!url || url === '') {
    console.error("error: url NOT FOUND\nID:", img.dataset.imgId);

    return;          // 빈 URL 걸러냄
  }
  try {
    absUrl = toAbsoluteUrl(url, document.baseURI);
    if (_utils_url_filterModule_based_safe_pattern_js__WEBPACK_IMPORTED_MODULE_1__.filter_based_safeUrlPattern(absUrl)) {
      img.dataset.masking = "None";
      NoNSafeImgCount++;
      img.dataset.imgId = "except";
      console.log("비유해 이미지:", absUrl.toString(), " 총합:", NoNSafeImgCount);
      return;
    }
  } catch (e) {
    console.error("URL 정규화 과정&비유해이미지 필터링 중 오류 발생: - ", e);
    console.error("오류를 발생시킨 이미지의 url:", url);
    return;
  }
  img.dataset.type = type; //static | dynamic img

  _global_buffer_js__WEBPACK_IMPORTED_MODULE_3__["default"].push({ id: img.dataset.imgId, url: absUrl.toString(), harmful: false, status: false });
  (0,_utils_flush_js__WEBPACK_IMPORTED_MODULE_4__.maybeFlush)();
}

//currentsrc에 값이 생길때까지 다음 repaint 턴을 비동기적으로 기다리고, 반복.
function checkCurrentSrc(img, callback, timeout = 1000) { //lazy loading으로 인해 기다리는 시간이 얼마나 지속되느냐에 따라 currentSrc를 얻을 수도 있고 못 얻을 수도 있음. 특히 유튜브 같은
  //동적 사이트 대상
  const start = performance.now();
  function check() {
    if (img.currentSrc && img.currentSrc !== '') {
      callback(img);
    } else if (performance.now() - start > timeout) {
      console.log("!warning!: currentSrc 값 생성 전에 제한 시간을 초과하였습니다. 추후 이미지 마스킹 해제에 실패할 수 도 있습니다")
      callback(img);
    } else {
      requestAnimationFrame(check);
    }
  }

  requestAnimationFrame(check);
}

/**
 * 
 * @param {HTMLElement} node img node
 * @param {number} topMargin 상단 여백을 뷰포트 높이의 배수로 설정. 기본값은 2
 * @param {number} bottomMargin 하단 여백을 뷰포트 높이의 배수로 설정. 기본값 1
 * @returns {boolean} 요소가 지정된 범위 안에 있으면 true, 아니면 false.
 */
function isElementInViewport(node, topMargin = 1, bottomMargin = 1) {
  const rect = node.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // 뷰포트 상단에서 topMargin 배수만큼 떨어진 위치
  const topThreshold = viewportHeight * topMargin;
  // 뷰포트 하단에서 bottomMargin 배수만큼 떨어진 위치
  const bottomThreshold = -viewportHeight * bottomMargin;

  // 요소의 상단이 topThreshold보다 작고, 요소의 하단이 bottomThreshold보다 커야 합니다.
  return rect.top < topThreshold && rect.bottom > bottomThreshold;
}

//checkCurrentSrc로 requestAnimationFrame 시점에 maskandsend 호출. currentSrc를 안정적으로 얻기 위함.
//언제 다시 이미지가 들어올지 모르므로 일단 disconnect는 안함
//이미지 노드에 srcset이 존재하거나 source 태그가 존재할 경우 브라우저가 srcset을 선택하여 렌더링할 수 도 있음. 이 경우
// srcset이 서비스 워커 데이터 베이스에 등록되며 어떤 srcset이 등록되는지 예측할 수 없으므로 src를 기준으로 함. 따라서 이 경우 src의 url로 데이터베이스 재등록 및 해당 url로 재요청

class imageObservers {

  constructor() {

    this.imgIdList = [];
    this.IsObsvActive = false;

    this.imgViewObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const imgObj = entry.target;
        if (!isElementInViewport(imgObj)) return;
        // console.log("imgviewObserver observe entry, id: ",imgObj.dataset.imgId);
        checkCurrentSrc(imgObj, htmlImgElement => {
          checkConditionAndSend(htmlImgElement, 'dynamicIMG'); //maskAndSend를 바로 호출해도 문제 없는 것을 확인하였으나 안정성을 위해 이렇게 함
        });
        this.imgViewObserver.unobserve(imgObj);
        let rmIdx = this.imgIdList.indexOf(imgObj.dataset.imgId);
        if (rmIdx !== -1) {
          this.imgIdList.splice(rmIdx, 1);
        }

      });

    }, {
      root: null,
      rootMargin: "40% 0px 0px 0px",
      threshold: 0, //rootMargin: 0px, threshold: 0으로 해도 작동이 가능하나, 안정성을 위해 일단 수치를 조금 높인 상태
    });

    this.imgObserver = new MutationObserver(mutations => {
      const elements = [];
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;  // element만 처리
            if (node.tagName === 'IMG') {

              if (!node.dataset.imgId) {
                (0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_0__.createRandomImgID)(node);
                elements.push(node);
                // console.log("이미지의 id는: ", node.dataset.imgId);
              }
              else return;

            } else {
              // <img>가 아닌 요소가 들어온 경우: 자식 img 검색
              node.querySelectorAll('img').forEach(img => {
                // img.style.setProperty('visibility', 'hidden', 'important');
                // img.style.setProperty('opacity', '0', 'important');
                if (!img.dataset.imgId) {
                  (0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_0__.createRandomImgID)(img);
                  elements.push(img);
                  // console.log("이미지의 id는: ", img.dataset.imgId);
                }


              });
            }
          });
        }

      });
      totalimg += elements.length;
      // console.log("total IMG: ", totalimg)

      elements.forEach(el => {
        requestAnimationFrame(() => {
            if ((0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_2__.getPermissionForMasking)()) el.dataset.masking = 'imgMasking';
          else el.dataset.masking = '';
          // el.classList.add('imgMasking');//다음 렌더 사이클에서 마스킹
          this.imgIdList.push(el.dataset.imgId);
          this.imgViewObserver.observe(el);//렌더링, 레이아웃 정리가 제대로 이루어지지 않은 상태에서 감지될 수 있으므로 한 프레임 쉬고 호출

        });
      });
    });
  }

  imgObserve() {
    this.imgObserver.observe(document.body, {
      childList: true, //자식
      subtree: true, //자손

    });
  }

  disconntectObeserver() {

    this.IsObsvActive = false;
    this.imgViewObserver.disconnect();
    const remainImgs = this.imgObserver.takeRecords();
    this.imgObserver.disconnect();
    console.log(this.imgIdList.length);

    const maskedImgs = document.querySelectorAll(`img[data-img-id]`);
    maskedImgs.forEach(img => {
      img.dataset.masking = "None";
    });
    // if(this.imgIdList.length > 0){

    //   this.imgIdList.forEach(id => {

    //       const img = document.querySelector(`img[data-img-id="${id}"]`);
    //       if(img){
    //         img.dataset.masking = "None";
    //       }
    //   });

    // }

    if (remainImgs.length > 0) {
      remainImgs.forEach(remainImg => {
        remainImg.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;  // element만 처리
          if (node.tagName === 'IMG') {

            if (!node.dataset.imgId) {
              this.imgIdList.push((0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_0__.createRandomImgID)(node));
            }
            else return;

          } else {

            node.querySelectorAll('img').forEach(img => {
              if (!img.dataset.imgId) {
                this.imgIdList.push((0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_0__.createRandomImgID)(img));
              }
            });

          }

        });
      });

    }
    // if(dataBuffer.length>0){
    //   console.log(dataBuffer.length);
    //   dataBuffer.forEach(item => {
    //     const id = item.id;
    //     const img = document.querySelector(`img[data-img-id="${id}"]`);
    //     if (img) {
    //       img.dataset.masking = "None";
    //     }

    //   });
    // }
  }

  reconnectObeserver() {

    this.IsObsvActive = true;
    this.imgObserve();

    if (this.imgIdList.length > 0) {
      this.imgIdList.forEach(id => {
        const img = document.querySelector(`img[data-img-id="${id}"]`);
        if (img) {
          img.dataset.masking = "imgMasking";
          this.imgViewObserver.observe(img);
        }
      })
    }
    if (_global_buffer_js__WEBPACK_IMPORTED_MODULE_3__["default"].length > 0) {
      _global_buffer_js__WEBPACK_IMPORTED_MODULE_3__["default"].forEach(item => {
        const img = document.querySelector(`img[data-img-id="${item.id}"]`);
        if (img) img.dataset.masking = "imgMasking";
        (0,_utils_flush_js__WEBPACK_IMPORTED_MODULE_4__.maybeFlush)();

      });
    }
    console.log("observer reconnected");
  }
}


const IMGObs = new imageObservers();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (IMGObs);

/***/ }),

/***/ "./src/js/utils/contentUtils.js":
/*!**************************************!*\
  !*** ./src/js/utils/contentUtils.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   changeImg: () => (/* binding */ changeImg),
/* harmony export */   createRandomImgID: () => (/* binding */ createRandomImgID)
/* harmony export */ });
//콘텐츠 스크립트에서 사용하는 utils


const harmfulImgMark = chrome.runtime.getURL('icons/main_icon.png');
function changeImg(img, flag) {
    if (flag) {
        img.src = harmfulImgMark;
        //기존 코드
        img.style.backgroundColor = 'white';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center';
        // img.style.position = "absolute";          // 절대 위치
        // img.style.top = "0";                      // 상단
        // img.style.right = "0";                    // 우측
        // img.style.width = "50px";                 // 최대 폭
        // img.style.height = "50px";                // 최대 높이
        
        img.style.background = "white"; 
    }
    else {
        img.style.backgroundColor = '';
        img.style.objectFit = '';
        img.style.objectPosition = '';
        //추가
        // img.style.position = ""; 
        // img.style.width = "";                 // 최대 폭
        // img.style.height = "";  
        //
        img.src = img.dataset.originalSrc;

    }

}


/**.
 * @param {htmlImgElement} img - dom 이미지 객체
 */
function createRandomImgID(img) {
    const ID = crypto.randomUUID();
    img.dataset.imgId = ID;
    return ID;
}


  

/***/ }),

/***/ "./src/js/utils/flush.js":
/*!*******************************!*\
  !*** ./src/js/utils/flush.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   maybeFlush: () => (/* binding */ maybeFlush)
/* harmony export */ });
/* harmony import */ var _trackAndReplaceImg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./trackAndReplaceImg */ "./src/js/utils/trackAndReplaceImg.js");
/* harmony import */ var _terminate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./terminate */ "./src/js/utils/terminate.js");
/* harmony import */ var _global_buffer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../global/buffer */ "./src/js/global/buffer.js");
/* harmony import */ var _global_contentConfig__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../global/contentConfig */ "./src/js/global/contentConfig.js");






const MAX_N = 16, IDLE = 200;

let idleT = null;

function maybeFlush() {
    if (_global_buffer__WEBPACK_IMPORTED_MODULE_2__["default"].length >= MAX_N) Flush();
    clearTimeout(idleT);
    idleT = setTimeout(Flush, IDLE);
}


function Flush() {
    if (!_global_buffer__WEBPACK_IMPORTED_MODULE_2__["default"].length || !(0,_global_contentConfig__WEBPACK_IMPORTED_MODULE_3__.getInterceptorActive)()) return;
    if (!chrome?.runtime) {
        //함수 호출?
        (0,_terminate__WEBPACK_IMPORTED_MODULE_1__.terminateContentScript)('can not use chrome.runtime anymore. extension may be reloaded or disabled');
    }
    const batchFromContentScript = _global_buffer__WEBPACK_IMPORTED_MODULE_2__["default"].splice(0, _global_buffer__WEBPACK_IMPORTED_MODULE_2__["default"].length).filter(item => document.querySelector(`img[data-img-id="${item.id}"]`)); // 0부터 dataBuffer.length번째 인덱스(전체)를 복사한 객체 반환 & 해당 크기만큼 기존 객체 내 원소 삭제 -> 0으로 초기화

    try {
        chrome.runtime.sendMessage({
            source: "content",
            type: "imgDataFromContentScript",
            data: batchFromContentScript, // 20개만 보내고, 배열은 자동으로 비움
        },
            function (response) {
                const err = chrome.runtime.lastError;
                if (err) {
                    throw new Error('chrome.runtime 메세지 송신이 불가능합니다. extension을 새로고침하였을 가능성이 높습니다');
                }
                console.log("service worker 송신:" + batchFromContentScript.length + "--------------" + "수신" + response.data.length);
                (0,_trackAndReplaceImg__WEBPACK_IMPORTED_MODULE_0__.trackAndReplaceImg)(response);

            })
    } catch (e) {
        (0,_terminate__WEBPACK_IMPORTED_MODULE_1__.terminateContentScript)(e.message);
    }
}



/***/ }),

/***/ "./src/js/utils/terminate.js":
/*!***********************************!*\
  !*** ./src/js/utils/terminate.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   terminateContentScript: () => (/* binding */ terminateContentScript)
/* harmony export */ });
/* harmony import */ var _modules_imgObs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../modules/imgObs */ "./src/js/modules/imgObs.js");
/* harmony import */ var _global_contentConfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../global/contentConfig */ "./src/js/global/contentConfig.js");



/**
 * 
 * @param {err} errMessage 
 */
function terminateContentScript(errMessage) {
    if (/Extension context invalidated/i.test(errMessage)) console.error(" extension may be reloaded or disabled. so this contentscript can no longer be operated and will be termainated");
    else {
        console.error("!terminateContentScript becaouse this Error: ", errMessage, " !");
    }
    if (_modules_imgObs__WEBPACK_IMPORTED_MODULE_0__["default"]) {
        _modules_imgObs__WEBPACK_IMPORTED_MODULE_0__["default"].disconntectObeserver();
        (0,_global_contentConfig__WEBPACK_IMPORTED_MODULE_1__.setInterceptorActive)(false);
        console.log("program off");
    }
}



/***/ }),

/***/ "./src/js/utils/trackAndReplaceImg.js":
/*!********************************************!*\
  !*** ./src/js/utils/trackAndReplaceImg.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   trackAndReplaceImg: () => (/* binding */ trackAndReplaceImg)
/* harmony export */ });
/* harmony import */ var _contentUtils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./contentUtils.js */ "./src/js/utils/contentUtils.js");
/* harmony import */ var _global_contentConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../global/contentConfig.js */ "./src/js/global/contentConfig.js");




let ALLremoveFalse = 0;
let ALLremoveTrue = 0;
function trackAndReplaceImg(responseFromSW) {


    const responseBatch = responseFromSW.data; // 배열 [{ id, url, ... }, ...]
    let removeFalse = 0;
    let removeTrue = 0;
    let totalStatus = 0;
    let succeedStatus = 0;
    let isHarmful = 0;

    responseBatch.forEach(item => {
        totalStatus++;

        console.log("id: " + item.id);
        try {

            if (item.status) {
                succeedStatus++;
                const object = document.querySelector(`img[data-img-id="${item.id}"]`);

                if (item.harmful) {
                    if (object) {

                        removeTrue++;
                        // object.style.removeProperty('visibility');
                        // object.style.removeProperty('opacity');

                        console.log("유해 이미지: " + item.url);
                        //object.style.border = "8px solid red";
                        object.dataset.originalSrc = object.src;
                        if ((0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_1__.getPermissionForMasking)()) {
                            (0,_contentUtils_js__WEBPACK_IMPORTED_MODULE_0__.changeImg)(object, true);
                            // myImage.style.backgroundColor = 'white';
                            // myImage.style.objectFit = 'contain';
                            // imageElement.style.objectPosition = 'center'; 
                            // object.src = harmfulImgMark;

                        }

                        // object.classList.remove('imgMasking');

                        object.dataset.masking = "None";

                        object.dataset.type += " Harmful";

                    }
                    else {
                        removeFalse = removeFalse + 1;
                        console.log("실패 id: " + item.id);
                    }

                    isHarmful++;
                }

                else {



                    if (object) {

                        removeTrue++;
                        // object.style.removeProperty('visibility');
                        // object.style.removeProperty('opacity');

                        // object.classList.remove('imgMasking');

                        object.dataset.masking = "None";

                        console.log("성공 id: " + item.id);
                        //object.style.border = "8px solid blue";

                    }
                    else {
                        removeFalse = removeFalse + 1;
                        console.log("실패 id: " + item.id);
                    }

                }

            }
            else {

                const object = document.querySelector(`img[data-img-id="${item.id}"]`);
                if (object) {
                    removeTrue++;
                    // object.style.removeProperty('visibility');
                    // object.style.removeProperty('opacity');

                    object.dataset.masking = "None";

                    // object.classList.remove('imgMasking');
                    console.log("성공 id: " + item.id);
                    //object.style.border = "8px solid blue";

                }
                else {
                    removeFalse = removeFalse + 1;
                    console.log("실패 id: " + item.id);
                }

            }
        }
        catch (e) {
            throw new Error("응답 데이터 마스킹 해제 중에 오류 발생: " + e.message);
        }
    }
    );
    ALLremoveFalse += removeFalse;
    ALLremoveTrue += removeTrue;
    console.log(`서비스 워커 응답 이미지 결과: ${totalStatus}/${succeedStatus}/${(totalStatus - succeedStatus)}/${isHarmful}[총합/이미지 분석 성공/이미지 분석 실패/유해이미지]`);
    console.log(`마스킹 해제 결과: ${totalStatus}/${removeTrue}/${removeFalse}/${isHarmful}[총합/성공/실패/유해이미지]`);
    console.log(`누적 합계: ${ALLremoveTrue}/${ALLremoveFalse}/${(ALLremoveTrue + ALLremoveFalse)}[누적 성공/누적 실패/총 누적 합] | 성공률: ${(ALLremoveTrue / (ALLremoveFalse + ALLremoveTrue)).toFixed(2)}`);

}


/***/ }),

/***/ "./src/js/utils/url_filterModule_based_safe_pattern.js":
/*!*************************************************************!*\
  !*** ./src/js/utils/url_filterModule_based_safe_pattern.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SAFE_RULES: () => (/* binding */ SAFE_RULES),
/* harmony export */   filter_based_safeUrlPattern: () => (/* binding */ filter_based_safeUrlPattern)
/* harmony export */ });
// url_filterModule_based_safe_pattern.js ─────────────────────────────
//data url(base64), blob data, url 끝에 붙는 확장자, CSS 스프라이트
const protoData   = new URLPattern({ protocol: 'data'   });
const protoBlob   = new URLPattern({ protocol: 'blob'   });
const extPattern  = new URLPattern({ pathname: '/*. :ext(svg|svgz|ico|cur|png)' });
const spritePat   = new URLPattern({ pathname: '*sprite*.{avif,webp}' });

//키워드
// 유해 이미지가 포함될 가능성이 낮은 키워드
const nameRegex   = /(?:\/|^)(logo|favicon|sprite|icons?|badge|twemoji|flag|emoji|spinner|loading|placeholder|blank|transparent|1x1|pixel|spacer|ajax-loader)[\w\-.]*\.(png|gif|svg|ico|cur|webp|avif)$/i;
//트래킹 픽셀/애널리틱스 - 1xx 크기의 gif일 확률이 높은 키워드
const trackRegex  = /(?:pixel|track|open)\.gif$/i;
//안전한 광고 키워드
const adSafeRegex = /adsafeprotected|brandshield|doubleclick.*gstatic|imagecache\/protect/i;

//화이트리스트 도메인 - 아이콘, 썸네일 등을 제공하는 도메인 제외
const WHITELIST = new Set([
  'gstatic.com', 'yt3.ggpht.com',
  'twemoji.maxcdn.com', 'cdnjs.cloudflare.com', 'www.gravatar.com',
]);


/* 스킴 & 확장자 검사 함수---------------------------------------------------- */
function matchProtocolOrExt(u) {
  return protoData.test(u) || protoBlob.test(u) ||
         extPattern.test(u) || spritePat.test(u);
}

/* ❷ 키워드 검사 함수 ---------------------------------------------------- */
function matchKeyword(u) {
  return nameRegex.test(u.pathname);
}

/* ❸ 작게 명시된 쿼리 파라미터 (≤64)기반 검사 함수 -------------------------------- */
function matchTinySize(u) {
  return ['w','h','width','height','size','s','quality','q']
    .some(k => {
      const v = parseInt(u.searchParams.get(k), 10);
      return !Number.isNaN(v) && v <= 64;
    });
}

/* 화이트리스트 CDN 검사 함수 ------------------------------------------------- */
function matchWhitelist(u) {
  const host = u.hostname.replace(/^www\./, '');
  return [...WHITELIST].some(h => host === h || host.endsWith(`.${h}`));
}

/* ❺ 트래킹 픽셀 & 안전한 광고 검사 함수 -------------------------------------- */
function matchTracking(u) { return trackRegex.test(u.pathname); }
function matchAdSafe (u) { return adSafeRegex.test(u.href);    }

/* 규칙 검사를 위한 함수 모음 (함수 원형 배열) ------------------------------------------- */
const SAFE_RULES = [
  matchProtocolOrExt,
  matchKeyword,
  matchTinySize,
  matchWhitelist,
  matchTracking,
  matchAdSafe,
];

/* ❼ 단일 헬퍼 -------------------------------------------------------- */
function filter_based_safeUrlPattern(url) {
  let result;
  try{
   result = SAFE_RULES.some(fn => fn(url));
  } catch(e) {
    console("비유해 이미지 필터링 중 오류 발생, url: ", url);
    return false;
  }
  return result;
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
/*!***************************!*\
  !*** ./src/js/content.js ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_trackAndReplaceImg_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/trackAndReplaceImg.js */ "./src/js/utils/trackAndReplaceImg.js");
/* harmony import */ var _utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/contentUtils.js */ "./src/js/utils/contentUtils.js");
/* harmony import */ var _modules_imgObs_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./modules/imgObs.js */ "./src/js/modules/imgObs.js");
/* harmony import */ var _global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./global/contentConfig.js */ "./src/js/global/contentConfig.js");
/* harmony import */ var _global_buffer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./global/buffer.js */ "./src/js/global/buffer.js");







let testcnt = 0;
let clickedImg = null;

//dom 로드 완료까지 오버레이 삽입, 유지
// if (window.top === window.self) {
//   const overlayDiv = document.createElement('div');
//   overlayDiv.id = 'extensionOverlay';
//   document.documentElement.appendChild(overlayDiv); // html 바로 아래에 추가
//   window.pageOverlay = overlayDiv;
// }


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Collect_staticImg() {
  const staticImgs = document.querySelectorAll('img');
  console.log("정적파일 합" + staticImgs.length);

  staticImgs.forEach(img => {
    const currentImg = img; // 'this' 컨텍스트 문제 해결을 위한 캡처
    if (!currentImg.dataset.imgId) {
      currentImg.dataset.masking = 'imgMasking';
      // currentImg.classList.add('imgMasking');
      (0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_1__.createRandomImgID)(currentImg);
      _modules_imgObs_js__WEBPACK_IMPORTED_MODULE_2__["default"].imgViewObserver.observe(currentImg);

    }

  })

}


//이벤트 리스너용 함수
function stopOrStarImgsMasking(flag) {
  console.log("filterstatus" + flag);
  if (!flag) {
    const maskedImgs = document.querySelectorAll(`img[data-masking="imgMasking"]`);
    console.log(maskedImgs.length);
    maskedImgs.forEach(img => {
      img.dataset.masking = "None";
    });


    const harmfulImgs = document.querySelectorAll('[data-type*="Harmful"]');
    console.log(harmfulImgs.length);
    harmfulImgs.forEach(img => {
      (0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_1__.changeImg)(img, false);
      //img.src = img.dataset.originalSrc;
    });
  }
  else {
    const harmfulImgs = document.querySelectorAll('[data-type*="Harmful"]');
    harmfulImgs.forEach(img => {
      //img.src = harmfulImgMark;
      (0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_1__.changeImg)(img, true);
    });

    _modules_imgObs_js__WEBPACK_IMPORTED_MODULE_2__["default"].imgIdList.forEach(id => {
      const waitingImg = document.querySelector(`img[data-img-id="${id}"]`);
      if (waitingImg) waitingImg.dataset.masking = "imgMasking";
    });

    if (_global_buffer_js__WEBPACK_IMPORTED_MODULE_4__["default"].length > 0) {
      _global_buffer_js__WEBPACK_IMPORTED_MODULE_4__["default"].forEach(item => {
        const img = document.querySelector(`img[data-img-id="${item.id}"]`);
        if (img) img.dataset.masking = "imgMasking";
      });
    }

  }
}

function controlClickedImg(isShow) {

  if (clickedImg === null) return false;

  if (isShow) {
    clickedImg.dataset.masking = "None";
    (0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_1__.changeImg)(clickedImg, false);
    //clickedImg.src = clickedImg.dataset.originalSrc;
    //harmful을 없애야 함
    if (clickedImg.dataset.type.includes('Harmful')) clickedImg.dataset.type = clickedImg.dataset.type.replace('Harmful', '').trim();
  }
  else {
    clickedImg.dataset.masking = "None";
    clickedImg.dataset.originalSrc = clickedImg.src;
    if (!clickedImg.dataset.type.includes('Harmful')) clickedImg.dataset.type += " Harmful";
    (0,_utils_contentUtils_js__WEBPACK_IMPORTED_MODULE_1__.changeImg)(clickedImg, true);
    //clickedImg.src = harmfulImgMark;
  }

  clickedImg === null;
  return true;
}
////


//document.addEventListener('DOMContentLoaded', pageInit());
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', pageInit);
}
else {
  pageInit();
}


//초기화 함수
async function pageInit() {

  let isInBlackList = await new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ source: "content", type: "check_black_list", site: window.location.origin, page: window.location.pathname },
        function (response) {
          if (response.ok) {
            resolve(response.result);
          }
        }
      );
    }
    catch(e){
      console.error(e);
      resolve(false);
    }
  });

  //초기화 시작//
  if (!isInBlackList) {
    console.log("블랙리스트에 없는 사이트, 설정 코드 실행");

    const registerResult = await chrome.runtime.sendMessage({ source: "content",type: "register_frame" });
    if (!registerResult.ok) {
      console.error("can not register frame to service worker");
      return;
    }

    const storedFilterStatus = await chrome.storage.local.get(['filterStatus']);
    let isFilteringOn = storedFilterStatus.filterStatus;
    if (isFilteringOn === undefined) {
      chrome.storage.local.set({ 'filterStatus': true });
      isFilteringOn = true;
    }
    (0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__.setPermissionForMasking)(isFilteringOn);

    const storedInterceptorStatus = await chrome.storage.local.get(['interceptorStatus']);
    let savedStatus = storedInterceptorStatus.interceptorStatus;
    if (savedStatus === undefined) {
      chrome.storage.local.set({ 'interceptorStatus': 1 });
      savedStatus = 1;
    }
    (0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__.setInterceptorActive)(savedStatus === 1 ? true : false);


    setEnventListers();


    if (document.readyState != "loading") {
      if ((0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__.getInterceptorActive)()) {
        _modules_imgObs_js__WEBPACK_IMPORTED_MODULE_2__["default"].imgObserve();
        Collect_staticImg();
      }
    }

  }
  // if (window.top === window.self) {
  //   const overlay = document.getElementById('extensionOverlay');
  //   if (overlay) {
  //     console.log("overay remove starts");

  //     overlay.classList.add('fade-out');
  //     setTimeout(() => {
  //       document.documentElement.style.pointerEvents = 'auto';
  //       overlay.remove();// DOM에서 제거하여 완전하게 사라지게 함
  //       // document.documentElement.style.visibility = 'visible';
  //       console.log("overay removed");
  //     }, 550); //500ms(0.5초)
  //   }
  // }

}




function setEnventListers() {

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "imgDataWaitingFromServiceWork") {
      console.log("서비스워커에서 대기하던 데이터가 들어왔습니다");
      try {
        console.log("service work에서 서버의 유해 이미지 분석 결과를 기다리던 Data: " + message.data.length);

        (0,_utils_trackAndReplaceImg_js__WEBPACK_IMPORTED_MODULE_0__.trackAndReplaceImg)(message);

        sendResponse({
          type: "response",
          ok: true,
        });
      } catch (e) {
        console.error("error ocurr[ =while confirming waiting data from service worker]", e);
      }
    };
  });


  let count = 0;
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.source === 'service_worker') {

      try {
        switch (message.type) {
          case 'active_interceptor':

            console.log(message.active);
            if (message.active) {
              _modules_imgObs_js__WEBPACK_IMPORTED_MODULE_2__["default"].reconnectObeserver();
              (0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__.setInterceptorActive)(true);
              console.log("program on");
            }
            else {
              _modules_imgObs_js__WEBPACK_IMPORTED_MODULE_2__["default"].disconntectObeserver();
              (0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__.setInterceptorActive)(false);
              console.log("program off");
            }
            sendResponse({ ok: true, message: "success" });
            break;


          case 'set_filter_status':
            //observer가 준비되었는지 확인하는 코드 나중에 추가해야 함
            (0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__.setPermissionForMasking)(message.FilterStatus);
            stopOrStarImgsMasking(message.FilterStatus);
            sendResponse({ ok: true, message: "success" });

            break;

          case 'control_img':
            console.log("이미지 컨트롤");
            if (!(0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__.getInterceptorActive)()) sendResponse({ ok: false, message: "interceptor is not active" });

            const result = controlClickedImg(message.isShow);
            console.log(result);
            if (!result) throw new Error("can not control single img masking");
            sendResponse({ ok: true, message: "success" });

            break;

          default:
            throw new Error("can not read message type from service worker");
        }
      } catch (e) {
        console.error(e);
        sendResponse({ ok: false, message: e });
      }
    }



    
  });
  
  
  
  //컨텍스트 메뉴 노출//
  document.addEventListener('contextmenu', function (event) {


    if (!(0,_global_contentConfig_js__WEBPACK_IMPORTED_MODULE_3__.getInterceptorActive)()) return;

    const target = event.target;
    // 탐색을 위한 큐를 생성
    const queue = [target];
    const visited = new Set(); // 중복 방문 방지를 위한 Set

    while (queue.length > 0) {
      const currentNode = queue.shift(); // 큐의 맨 앞 노드

      // 이미 방문한 노드는 건너뜀
      if (visited.has(currentNode)) {
        continue;
      }
      visited.add(currentNode);


      // 현재 노드가 이미지인지 확인
      if (currentNode.tagName === 'IMG') {
        clickedImg = currentNode;
        chrome.runtime.sendMessage({
          source: "content",
          type: "imageClicked",
          imgSrc: currentNode.src,
          isShow: currentNode.dataset.type.includes('Harmful') ? false : true
        });
        // 이미지를 찾았으므로 탐색을 종료
        return;
      }

      // 자식 노드가 있다면 큐에 추가
      const children = currentNode.children;
      if (children && children.length > 0) {
        for (const child of children) {
          queue.push(child);
        }
      }
    }

    clickedImg = null;

  }, true);

}






})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyw4RUFBb0I7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBLHlDQUF5QztBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL2dsb2JhbC9idWZmZXIuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9nbG9iYWwvY29udGVudENvbmZpZy5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL21vZHVsZXMvaW1nT2JzLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvdXRpbHMvY29udGVudFV0aWxzLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvdXRpbHMvZmx1c2guanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy91dGlscy90ZXJtaW5hdGUuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy91dGlscy90cmFja0FuZFJlcGxhY2VJbWcuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy91dGlscy91cmxfZmlsdGVyTW9kdWxlX2Jhc2VkX3NhZmVfcGF0dGVybi5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9jb250ZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGRhdGFCdWZmZXIgPSBbXTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRhdGFCdWZmZXI7IiwiXHJcblxyXG5leHBvcnQgbGV0IHBlcm1pc3Npb25Gb3JNYXNraW5nID0gdHJ1ZTtcclxuZXhwb3J0IGxldCBpc0ludGVyY2VwdG9yQWN0aXZlID0gdHJ1ZTtcclxuXHJcbmZ1bmN0aW9uIHNldFBlcm1pc3Npb25Gb3JNYXNraW5nKGZsYWcpIHsgcGVybWlzc2lvbkZvck1hc2tpbmcgPSBmbGFnOyB9XHJcbmZ1bmN0aW9uIHNldEludGVyY2VwdG9yQWN0aXZlKGZsYWcpIHsgaXNJbnRlcmNlcHRvckFjdGl2ZSA9IGZsYWc7IH1cclxuZnVuY3Rpb24gZ2V0SW50ZXJjZXB0b3JBY3RpdmUoKSB7IHJldHVybiBpc0ludGVyY2VwdG9yQWN0aXZlOyB9XHJcbmZ1bmN0aW9uIGdldFBlcm1pc3Npb25Gb3JNYXNraW5nKCkgeyByZXR1cm4gcGVybWlzc2lvbkZvck1hc2tpbmc7IH1cclxuXHJcbmV4cG9ydCB7IHNldFBlcm1pc3Npb25Gb3JNYXNraW5nLCBzZXRJbnRlcmNlcHRvckFjdGl2ZSwgZ2V0SW50ZXJjZXB0b3JBY3RpdmUsIGdldFBlcm1pc3Npb25Gb3JNYXNraW5nIH07IiwiaW1wb3J0IHsgY3JlYXRlUmFuZG9tSW1nSUQgfSBmcm9tIFwiLi4vdXRpbHMvY29udGVudFV0aWxzLmpzXCI7XHJcbmltcG9ydCAqIGFzIGZpbHRlck1vZHVsZSBmcm9tIFwiLi4vdXRpbHMvdXJsX2ZpbHRlck1vZHVsZV9iYXNlZF9zYWZlX3BhdHRlcm4uanNcIjtcclxuaW1wb3J0IHsgZ2V0UGVybWlzc2lvbkZvck1hc2tpbmd9IGZyb20gXCIuLi9nbG9iYWwvY29udGVudENvbmZpZy5qc1wiO1xyXG5pbXBvcnQgZGF0YUJ1ZmZlciBmcm9tIFwiLi4vZ2xvYmFsL2J1ZmZlci5qc1wiO1xyXG5pbXBvcnQgeyBtYXliZUZsdXNoIH0gZnJvbSBcIi4uL3V0aWxzL2ZsdXNoLmpzXCI7XHJcblxyXG5cclxuXHJcbmxldCB0b3RhbGltZyA9IDA7XHJcbmxldCBOb05TYWZlSW1nQ291bnQgPSAwO1xyXG5cclxuLy/sg4HrjIDqsr3roZwgLT4g7KCI64yA6rK966GcXHJcbmZ1bmN0aW9uIHRvQWJzb2x1dGVVcmwodXJsLCBiYXNlVXJsID0gZG9jdW1lbnQuYmFzZVVSSSkge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gbmV3IFVSTCh1cmwsIGJhc2VVcmwpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIHVybDtcclxuICB9XHJcbn1cclxuXHJcbi8qKi5cclxuICogQHBhcmFtIHtvYmplY3R9IGltZyAtIGRvbSDsnbTrr7jsp4Ag64W465OcXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0g7KCV7KCBIOq1kOyytC/rj5nsoIEg6rWQ7LK0IOq4sOuhnVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tDb25kaXRpb25BbmRTZW5kKGltZywgdHlwZSkge1xyXG4gIGNvbnN0IHVybCA9IGltZy5jdXJyZW50U3JjIHx8IGltZy5zcmM7XHJcbiAgbGV0IGFic1VybDtcclxuICBpZiAoIXVybCB8fCB1cmwgPT09ICcnKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiZXJyb3I6IHVybCBOT1QgRk9VTkRcXG5JRDpcIiwgaW1nLmRhdGFzZXQuaW1nSWQpO1xyXG5cclxuICAgIHJldHVybjsgICAgICAgICAgLy8g67mIIFVSTCDqsbjrn6zrg4RcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGFic1VybCA9IHRvQWJzb2x1dGVVcmwodXJsLCBkb2N1bWVudC5iYXNlVVJJKTtcclxuICAgIGlmIChmaWx0ZXJNb2R1bGUuZmlsdGVyX2Jhc2VkX3NhZmVVcmxQYXR0ZXJuKGFic1VybCkpIHtcclxuICAgICAgaW1nLmRhdGFzZXQubWFza2luZyA9IFwiTm9uZVwiO1xyXG4gICAgICBOb05TYWZlSW1nQ291bnQrKztcclxuICAgICAgaW1nLmRhdGFzZXQuaW1nSWQgPSBcImV4Y2VwdFwiO1xyXG4gICAgICBjb25zb2xlLmxvZyhcIuu5hOycoO2VtCDsnbTrr7jsp4A6XCIsIGFic1VybC50b1N0cmluZygpLCBcIiDstJ3tlak6XCIsIE5vTlNhZmVJbWdDb3VudCk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiVVJMIOygleq3nO2ZlCDqs7zsoJUm67mE7Jyg7ZW07J2066+47KeAIO2VhO2EsOungSDspJEg7Jik66WYIOuwnOyDnTogLSBcIiwgZSk7XHJcbiAgICBjb25zb2xlLmVycm9yKFwi7Jik66WY66W8IOuwnOyDneyLnO2CqCDsnbTrr7jsp4DsnZggdXJsOlwiLCB1cmwpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBpbWcuZGF0YXNldC50eXBlID0gdHlwZTsgLy9zdGF0aWMgfCBkeW5hbWljIGltZ1xyXG5cclxuICBkYXRhQnVmZmVyLnB1c2goeyBpZDogaW1nLmRhdGFzZXQuaW1nSWQsIHVybDogYWJzVXJsLnRvU3RyaW5nKCksIGhhcm1mdWw6IGZhbHNlLCBzdGF0dXM6IGZhbHNlIH0pO1xyXG4gIG1heWJlRmx1c2goKTtcclxufVxyXG5cclxuLy9jdXJyZW50c3Jj7JeQIOqwkuydtCDsg53quLjrlYzquYzsp4Ag64uk7J2MIHJlcGFpbnQg7YS07J2EIOu5hOuPmeq4sOyggeycvOuhnCDquLDri6Trpqzqs6AsIOuwmOuztS5cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50U3JjKGltZywgY2FsbGJhY2ssIHRpbWVvdXQgPSAxMDAwKSB7IC8vbGF6eSBsb2FkaW5n7Jy866GcIOyduO2VtCDquLDri6TrpqzripQg7Iuc6rCE7J20IOyWvOuniOuCmCDsp4Dsho3rkJjripDrg5Dsl5Ag65Sw6528IGN1cnJlbnRTcmPrpbwg7Ja77J2EIOyImOuPhCDsnojqs6Ag66q7IOyWu+ydhCDsiJjrj4Qg7J6I7J2MLiDtirntnogg7Jyg7Yqc67iMIOqwmeydgFxyXG4gIC8v64+Z7KCBIOyCrOydtO2KuCDrjIDsg4FcclxuICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gIGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgaWYgKGltZy5jdXJyZW50U3JjICYmIGltZy5jdXJyZW50U3JjICE9PSAnJykge1xyXG4gICAgICBjYWxsYmFjayhpbWcpO1xyXG4gICAgfSBlbHNlIGlmIChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0ID4gdGltZW91dCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIiF3YXJuaW5nITogY3VycmVudFNyYyDqsJIg7IOd7ISxIOyghOyXkCDsoJztlZwg7Iuc6rCE7J2EIOy0iOqzvO2VmOyYgOyKteuLiOuLpC4g7LaU7ZuEIOydtOuvuOyngCDrp4jsiqTtgrkg7ZW07KCc7JeQIOyLpO2MqO2VoCDsiJgg64+EIOyeiOyKteuLiOuLpFwiKVxyXG4gICAgICBjYWxsYmFjayhpbWcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNoZWNrKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShjaGVjayk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZSBpbWcgbm9kZVxyXG4gKiBAcGFyYW0ge251bWJlcn0gdG9wTWFyZ2luIOyDgeuLqCDsl6zrsLHsnYQg67ew7Y+s7Yq4IOuGkuydtOydmCDrsLDsiJjroZwg7ISk7KCVLiDquLDrs7jqsJLsnYAgMlxyXG4gKiBAcGFyYW0ge251bWJlcn0gYm90dG9tTWFyZ2luIO2VmOuLqCDsl6zrsLHsnYQg67ew7Y+s7Yq4IOuGkuydtOydmCDrsLDsiJjroZwg7ISk7KCVLiDquLDrs7jqsJIgMVxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0g7JqU7IaM6rCAIOyngOygleuQnCDrspTsnIQg7JWI7JeQIOyeiOycvOuptCB0cnVlLCDslYTri4jrqbQgZmFsc2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0KG5vZGUsIHRvcE1hcmdpbiA9IDEsIGJvdHRvbU1hcmdpbiA9IDEpIHtcclxuICBjb25zdCByZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICBjb25zdCB2aWV3cG9ydEhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG5cclxuICAvLyDrt7Dtj6ztirgg7IOB64uo7JeQ7IScIHRvcE1hcmdpbiDrsLDsiJjrp4ztgbwg65ao7Ja07KeEIOychOy5mFxyXG4gIGNvbnN0IHRvcFRocmVzaG9sZCA9IHZpZXdwb3J0SGVpZ2h0ICogdG9wTWFyZ2luO1xyXG4gIC8vIOu3sO2PrO2KuCDtlZjri6jsl5DshJwgYm90dG9tTWFyZ2luIOuwsOyImOunjO2BvCDrlqjslrTsp4Qg7JyE7LmYXHJcbiAgY29uc3QgYm90dG9tVGhyZXNob2xkID0gLXZpZXdwb3J0SGVpZ2h0ICogYm90dG9tTWFyZ2luO1xyXG5cclxuICAvLyDsmpTshozsnZgg7IOB64uo7J20IHRvcFRocmVzaG9sZOuztOuLpCDsnpHqs6AsIOyalOyGjOydmCDtlZjri6jsnbQgYm90dG9tVGhyZXNob2xk67O064ukIOy7pOyVvCDtlanri4jri6QuXHJcbiAgcmV0dXJuIHJlY3QudG9wIDwgdG9wVGhyZXNob2xkICYmIHJlY3QuYm90dG9tID4gYm90dG9tVGhyZXNob2xkO1xyXG59XHJcblxyXG4vL2NoZWNrQ3VycmVudFNyY+uhnCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUg7Iuc7KCQ7JeQIG1hc2thbmRzZW5kIO2YuOy2nC4gY3VycmVudFNyY+ulvCDslYjsoJXsoIHsnLzroZwg7Ja76riwIOychO2VqC5cclxuLy/slrjsoJwg64uk7IucIOydtOuvuOyngOqwgCDrk6TslrTsmKzsp4Ag66qo66W066+A66GcIOydvOuLqCBkaXNjb25uZWN064qUIOyViO2VqFxyXG4vL+ydtOuvuOyngCDrhbjrk5zsl5Agc3Jjc2V07J20IOyhtOyerO2VmOqxsOuCmCBzb3VyY2Ug7YOc6re46rCAIOyhtOyerO2VoCDqsr3smrAg67iM65287Jqw7KCA6rCAIHNyY3NldOydhCDshKDtg53tlZjsl6wg66CM642U66eB7ZWgIOyImCDrj4Qg7J6I7J2MLiDsnbQg6rK97JqwXHJcbi8vIHNyY3NldOydtCDshJzruYTsiqQg7JuM7LukIOuNsOydtO2EsCDrsqDsnbTsiqTsl5Ag65Ox66Gd65CY66mwIOyWtOuWpCBzcmNzZXTsnbQg65Ox66Gd65CY64qU7KeAIOyYiOy4oe2VoCDsiJgg7JeG7Jy866+A66GcIHNyY+ulvCDquLDspIDsnLzroZwg7ZWoLiDrlLDrnbzshJwg7J20IOqyveyasCBzcmPsnZggdXJs66GcIOuNsOydtO2EsOuyoOydtOyKpCDsnqzrk7HroZ0g67CPIO2VtOuLuSB1cmzroZwg7J6s7JqU7LKtXHJcblxyXG5jbGFzcyBpbWFnZU9ic2VydmVycyB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgIHRoaXMuaW1nSWRMaXN0ID0gW107XHJcbiAgICB0aGlzLklzT2JzdkFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMuaW1nVmlld09ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKGVudHJpZXMgPT4ge1xyXG4gICAgICBlbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xyXG4gICAgICAgIGlmICghZW50cnkuaXNJbnRlcnNlY3RpbmcpIHJldHVybjtcclxuICAgICAgICBjb25zdCBpbWdPYmogPSBlbnRyeS50YXJnZXQ7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KGltZ09iaikpIHJldHVybjtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImltZ3ZpZXdPYnNlcnZlciBvYnNlcnZlIGVudHJ5LCBpZDogXCIsaW1nT2JqLmRhdGFzZXQuaW1nSWQpO1xyXG4gICAgICAgIGNoZWNrQ3VycmVudFNyYyhpbWdPYmosIGh0bWxJbWdFbGVtZW50ID0+IHtcclxuICAgICAgICAgIGNoZWNrQ29uZGl0aW9uQW5kU2VuZChodG1sSW1nRWxlbWVudCwgJ2R5bmFtaWNJTUcnKTsgLy9tYXNrQW5kU2VuZOulvCDrsJTroZwg7Zi47Lac7ZW064+EIOusuOygnCDsl4bripQg6rKD7J2EIO2ZleyduO2VmOyYgOycvOuCmCDslYjsoJXshLHsnYQg7JyE7ZW0IOydtOugh+qyjCDtlahcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmltZ1ZpZXdPYnNlcnZlci51bm9ic2VydmUoaW1nT2JqKTtcclxuICAgICAgICBsZXQgcm1JZHggPSB0aGlzLmltZ0lkTGlzdC5pbmRleE9mKGltZ09iai5kYXRhc2V0LmltZ0lkKTtcclxuICAgICAgICBpZiAocm1JZHggIT09IC0xKSB7XHJcbiAgICAgICAgICB0aGlzLmltZ0lkTGlzdC5zcGxpY2Uocm1JZHgsIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH0sIHtcclxuICAgICAgcm9vdDogbnVsbCxcclxuICAgICAgcm9vdE1hcmdpbjogXCI0MCUgMHB4IDBweCAwcHhcIixcclxuICAgICAgdGhyZXNob2xkOiAwLCAvL3Jvb3RNYXJnaW46IDBweCwgdGhyZXNob2xkOiAw7Jy866GcIO2VtOuPhCDsnpHrj5nsnbQg6rCA64ql7ZWY64KYLCDslYjsoJXshLHsnYQg7JyE7ZW0IOydvOuLqCDsiJjsuZjrpbwg7KGw6riIIOuGkuyduCDsg4Htg5xcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuaW1nT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihtdXRhdGlvbnMgPT4ge1xyXG4gICAgICBjb25zdCBlbGVtZW50cyA9IFtdO1xyXG4gICAgICBtdXRhdGlvbnMuZm9yRWFjaChtdXRhdGlvbiA9PiB7XHJcbiAgICAgICAgaWYgKG11dGF0aW9uLnR5cGUgPT09ICdjaGlsZExpc3QnKSB7XHJcbiAgICAgICAgICBtdXRhdGlvbi5hZGRlZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlICE9PSAxKSByZXR1cm47ICAvLyBlbGVtZW5066eMIOyymOumrFxyXG4gICAgICAgICAgICBpZiAobm9kZS50YWdOYW1lID09PSAnSU1HJykge1xyXG5cclxuICAgICAgICAgICAgICBpZiAoIW5vZGUuZGF0YXNldC5pbWdJZCkge1xyXG4gICAgICAgICAgICAgICAgY3JlYXRlUmFuZG9tSW1nSUQobm9kZSk7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLsnbTrr7jsp4DsnZggaWTripQ6IFwiLCBub2RlLmRhdGFzZXQuaW1nSWQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gPGltZz7qsIAg7JWE64uMIOyalOyGjOqwgCDrk6TslrTsmKgg6rK97JqwOiDsnpDsi50gaW1nIOqygOyDiVxyXG4gICAgICAgICAgICAgIG5vZGUucXVlcnlTZWxlY3RvckFsbCgnaW1nJykuZm9yRWFjaChpbWcgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gaW1nLnN0eWxlLnNldFByb3BlcnR5KCd2aXNpYmlsaXR5JywgJ2hpZGRlbicsICdpbXBvcnRhbnQnKTtcclxuICAgICAgICAgICAgICAgIC8vIGltZy5zdHlsZS5zZXRQcm9wZXJ0eSgnb3BhY2l0eScsICcwJywgJ2ltcG9ydGFudCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpbWcuZGF0YXNldC5pbWdJZCkge1xyXG4gICAgICAgICAgICAgICAgICBjcmVhdGVSYW5kb21JbWdJRChpbWcpO1xyXG4gICAgICAgICAgICAgICAgICBlbGVtZW50cy5wdXNoKGltZyk7XHJcbiAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwi7J2066+47KeA7J2YIGlk64qUOiBcIiwgaW1nLmRhdGFzZXQuaW1nSWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG4gICAgICB0b3RhbGltZyArPSBlbGVtZW50cy5sZW5ndGg7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwidG90YWwgSU1HOiBcIiwgdG90YWxpbWcpXHJcblxyXG4gICAgICBlbGVtZW50cy5mb3JFYWNoKGVsID0+IHtcclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZ2V0UGVybWlzc2lvbkZvck1hc2tpbmcoKSkgZWwuZGF0YXNldC5tYXNraW5nID0gJ2ltZ01hc2tpbmcnO1xyXG4gICAgICAgICAgZWxzZSBlbC5kYXRhc2V0Lm1hc2tpbmcgPSAnJztcclxuICAgICAgICAgIC8vIGVsLmNsYXNzTGlzdC5hZGQoJ2ltZ01hc2tpbmcnKTsvL+uLpOydjCDroIzrjZQg7IKs7J207YG07JeQ7IScIOuniOyKpO2CuVxyXG4gICAgICAgICAgdGhpcy5pbWdJZExpc3QucHVzaChlbC5kYXRhc2V0LmltZ0lkKTtcclxuICAgICAgICAgIHRoaXMuaW1nVmlld09ic2VydmVyLm9ic2VydmUoZWwpOy8v66CM642U66eBLCDroIjsnbTslYTsm4Mg7KCV66as6rCAIOygnOuMgOuhnCDsnbTro6jslrTsp4Dsp4Ag7JWK7J2AIOyDge2DnOyXkOyEnCDqsJDsp4DrkKAg7IiYIOyeiOycvOuvgOuhnCDtlZwg7ZSE66CI7J6EIOyJrOqzoCDtmLjstpxcclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpbWdPYnNlcnZlKCkge1xyXG4gICAgdGhpcy5pbWdPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcclxuICAgICAgY2hpbGRMaXN0OiB0cnVlLCAvL+yekOyLnVxyXG4gICAgICBzdWJ0cmVlOiB0cnVlLCAvL+yekOyGkFxyXG5cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZGlzY29ubnRlY3RPYmVzZXJ2ZXIoKSB7XHJcblxyXG4gICAgdGhpcy5Jc09ic3ZBY3RpdmUgPSBmYWxzZTtcclxuICAgIHRoaXMuaW1nVmlld09ic2VydmVyLmRpc2Nvbm5lY3QoKTtcclxuICAgIGNvbnN0IHJlbWFpbkltZ3MgPSB0aGlzLmltZ09ic2VydmVyLnRha2VSZWNvcmRzKCk7XHJcbiAgICB0aGlzLmltZ09ic2VydmVyLmRpc2Nvbm5lY3QoKTtcclxuICAgIGNvbnNvbGUubG9nKHRoaXMuaW1nSWRMaXN0Lmxlbmd0aCk7XHJcblxyXG4gICAgY29uc3QgbWFza2VkSW1ncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYGltZ1tkYXRhLWltZy1pZF1gKTtcclxuICAgIG1hc2tlZEltZ3MuZm9yRWFjaChpbWcgPT4ge1xyXG4gICAgICBpbWcuZGF0YXNldC5tYXNraW5nID0gXCJOb25lXCI7XHJcbiAgICB9KTtcclxuICAgIC8vIGlmKHRoaXMuaW1nSWRMaXN0Lmxlbmd0aCA+IDApe1xyXG5cclxuICAgIC8vICAgdGhpcy5pbWdJZExpc3QuZm9yRWFjaChpZCA9PiB7XHJcblxyXG4gICAgLy8gICAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW2RhdGEtaW1nLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgIC8vICAgICAgIGlmKGltZyl7XHJcbiAgICAvLyAgICAgICAgIGltZy5kYXRhc2V0Lm1hc2tpbmcgPSBcIk5vbmVcIjtcclxuICAgIC8vICAgICAgIH1cclxuICAgIC8vICAgfSk7XHJcblxyXG4gICAgLy8gfVxyXG5cclxuICAgIGlmIChyZW1haW5JbWdzLmxlbmd0aCA+IDApIHtcclxuICAgICAgcmVtYWluSW1ncy5mb3JFYWNoKHJlbWFpbkltZyA9PiB7XHJcbiAgICAgICAgcmVtYWluSW1nLmFkZGVkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcclxuICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlICE9PSAxKSByZXR1cm47ICAvLyBlbGVtZW5066eMIOyymOumrFxyXG4gICAgICAgICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ0lNRycpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghbm9kZS5kYXRhc2V0LmltZ0lkKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5pbWdJZExpc3QucHVzaChjcmVhdGVSYW5kb21JbWdJRChub2RlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSByZXR1cm47XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIG5vZGUucXVlcnlTZWxlY3RvckFsbCgnaW1nJykuZm9yRWFjaChpbWcgPT4ge1xyXG4gICAgICAgICAgICAgIGlmICghaW1nLmRhdGFzZXQuaW1nSWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW1nSWRMaXN0LnB1c2goY3JlYXRlUmFuZG9tSW1nSUQoaW1nKSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICB9XHJcbiAgICAvLyBpZihkYXRhQnVmZmVyLmxlbmd0aD4wKXtcclxuICAgIC8vICAgY29uc29sZS5sb2coZGF0YUJ1ZmZlci5sZW5ndGgpO1xyXG4gICAgLy8gICBkYXRhQnVmZmVyLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAvLyAgICAgY29uc3QgaWQgPSBpdGVtLmlkO1xyXG4gICAgLy8gICAgIGNvbnN0IGltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGltZ1tkYXRhLWltZy1pZD1cIiR7aWR9XCJdYCk7XHJcbiAgICAvLyAgICAgaWYgKGltZykge1xyXG4gICAgLy8gICAgICAgaW1nLmRhdGFzZXQubWFza2luZyA9IFwiTm9uZVwiO1xyXG4gICAgLy8gICAgIH1cclxuXHJcbiAgICAvLyAgIH0pO1xyXG4gICAgLy8gfVxyXG4gIH1cclxuXHJcbiAgcmVjb25uZWN0T2Jlc2VydmVyKCkge1xyXG5cclxuICAgIHRoaXMuSXNPYnN2QWN0aXZlID0gdHJ1ZTtcclxuICAgIHRoaXMuaW1nT2JzZXJ2ZSgpO1xyXG5cclxuICAgIGlmICh0aGlzLmltZ0lkTGlzdC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuaW1nSWRMaXN0LmZvckVhY2goaWQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGltZ1tkYXRhLWltZy1pZD1cIiR7aWR9XCJdYCk7XHJcbiAgICAgICAgaWYgKGltZykge1xyXG4gICAgICAgICAgaW1nLmRhdGFzZXQubWFza2luZyA9IFwiaW1nTWFza2luZ1wiO1xyXG4gICAgICAgICAgdGhpcy5pbWdWaWV3T2JzZXJ2ZXIub2JzZXJ2ZShpbWcpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIGlmIChkYXRhQnVmZmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgZGF0YUJ1ZmZlci5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGNvbnN0IGltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGltZ1tkYXRhLWltZy1pZD1cIiR7aXRlbS5pZH1cIl1gKTtcclxuICAgICAgICBpZiAoaW1nKSBpbWcuZGF0YXNldC5tYXNraW5nID0gXCJpbWdNYXNraW5nXCI7XHJcbiAgICAgICAgbWF5YmVGbHVzaCgpO1xyXG5cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhcIm9ic2VydmVyIHJlY29ubmVjdGVkXCIpO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbmNvbnN0IElNR09icyA9IG5ldyBpbWFnZU9ic2VydmVycygpO1xyXG5leHBvcnQgZGVmYXVsdCBJTUdPYnM7IiwiLy/svZjthZDsuKAg7Iqk7YGs66a97Yq47JeQ7IScIOyCrOyaqe2VmOuKlCB1dGlsc1xyXG5cclxuXHJcbmNvbnN0IGhhcm1mdWxJbWdNYXJrID0gY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKCdpY29ucy9tYWluX2ljb24ucG5nJyk7XHJcbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VJbWcoaW1nLCBmbGFnKSB7XHJcbiAgICBpZiAoZmxhZykge1xyXG4gICAgICAgIGltZy5zcmMgPSBoYXJtZnVsSW1nTWFyaztcclxuICAgICAgICAvL+q4sOyhtCDsvZTrk5xcclxuICAgICAgICBpbWcuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3doaXRlJztcclxuICAgICAgICBpbWcuc3R5bGUub2JqZWN0Rml0ID0gJ2NvbnRhaW4nO1xyXG4gICAgICAgIGltZy5zdHlsZS5vYmplY3RQb3NpdGlvbiA9ICdjZW50ZXInO1xyXG4gICAgICAgIC8vIGltZy5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjsgICAgICAgICAgLy8g7KCI64yAIOychOy5mFxyXG4gICAgICAgIC8vIGltZy5zdHlsZS50b3AgPSBcIjBcIjsgICAgICAgICAgICAgICAgICAgICAgLy8g7IOB64uoXHJcbiAgICAgICAgLy8gaW1nLnN0eWxlLnJpZ2h0ID0gXCIwXCI7ICAgICAgICAgICAgICAgICAgICAvLyDsmrDsuKFcclxuICAgICAgICAvLyBpbWcuc3R5bGUud2lkdGggPSBcIjUwcHhcIjsgICAgICAgICAgICAgICAgIC8vIOy1nOuMgCDtj61cclxuICAgICAgICAvLyBpbWcuc3R5bGUuaGVpZ2h0ID0gXCI1MHB4XCI7ICAgICAgICAgICAgICAgIC8vIOy1nOuMgCDrhpLsnbRcclxuICAgICAgICBcclxuICAgICAgICBpbWcuc3R5bGUuYmFja2dyb3VuZCA9IFwid2hpdGVcIjsgXHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpbWcuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XHJcbiAgICAgICAgaW1nLnN0eWxlLm9iamVjdEZpdCA9ICcnO1xyXG4gICAgICAgIGltZy5zdHlsZS5vYmplY3RQb3NpdGlvbiA9ICcnO1xyXG4gICAgICAgIC8v7LaU6rCAXHJcbiAgICAgICAgLy8gaW1nLnN0eWxlLnBvc2l0aW9uID0gXCJcIjsgXHJcbiAgICAgICAgLy8gaW1nLnN0eWxlLndpZHRoID0gXCJcIjsgICAgICAgICAgICAgICAgIC8vIOy1nOuMgCDtj61cclxuICAgICAgICAvLyBpbWcuc3R5bGUuaGVpZ2h0ID0gXCJcIjsgIFxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgaW1nLnNyYyA9IGltZy5kYXRhc2V0Lm9yaWdpbmFsU3JjO1xyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcblxyXG4vKiouXHJcbiAqIEBwYXJhbSB7aHRtbEltZ0VsZW1lbnR9IGltZyAtIGRvbSDsnbTrr7jsp4Ag6rCd7LK0XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmFuZG9tSW1nSUQoaW1nKSB7XHJcbiAgICBjb25zdCBJRCA9IGNyeXB0by5yYW5kb21VVUlEKCk7XHJcbiAgICBpbWcuZGF0YXNldC5pbWdJZCA9IElEO1xyXG4gICAgcmV0dXJuIElEO1xyXG59XHJcblxyXG5cclxuICAiLCJpbXBvcnQgeyB0cmFja0FuZFJlcGxhY2VJbWcgfSBmcm9tIFwiLi90cmFja0FuZFJlcGxhY2VJbWdcIjtcclxuaW1wb3J0IHsgdGVybWluYXRlQ29udGVudFNjcmlwdCB9IGZyb20gXCIuL3Rlcm1pbmF0ZVwiO1xyXG5pbXBvcnQgZGF0YUJ1ZmZlciBmcm9tIFwiLi4vZ2xvYmFsL2J1ZmZlclwiO1xyXG5pbXBvcnQgeyBnZXRJbnRlcmNlcHRvckFjdGl2ZSB9IGZyb20gXCIuLi9nbG9iYWwvY29udGVudENvbmZpZ1wiO1xyXG5cclxuXHJcbmNvbnN0IE1BWF9OID0gMTYsIElETEUgPSAyMDA7XHJcblxyXG5sZXQgaWRsZVQgPSBudWxsO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1heWJlRmx1c2goKSB7XHJcbiAgICBpZiAoZGF0YUJ1ZmZlci5sZW5ndGggPj0gTUFYX04pIEZsdXNoKCk7XHJcbiAgICBjbGVhclRpbWVvdXQoaWRsZVQpO1xyXG4gICAgaWRsZVQgPSBzZXRUaW1lb3V0KEZsdXNoLCBJRExFKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIEZsdXNoKCkge1xyXG4gICAgaWYgKCFkYXRhQnVmZmVyLmxlbmd0aCB8fCAhZ2V0SW50ZXJjZXB0b3JBY3RpdmUoKSkgcmV0dXJuO1xyXG4gICAgaWYgKCFjaHJvbWU/LnJ1bnRpbWUpIHtcclxuICAgICAgICAvL+2VqOyImCDtmLjstpw/XHJcbiAgICAgICAgdGVybWluYXRlQ29udGVudFNjcmlwdCgnY2FuIG5vdCB1c2UgY2hyb21lLnJ1bnRpbWUgYW55bW9yZS4gZXh0ZW5zaW9uIG1heSBiZSByZWxvYWRlZCBvciBkaXNhYmxlZCcpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgYmF0Y2hGcm9tQ29udGVudFNjcmlwdCA9IGRhdGFCdWZmZXIuc3BsaWNlKDAsIGRhdGFCdWZmZXIubGVuZ3RoKS5maWx0ZXIoaXRlbSA9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBpbWdbZGF0YS1pbWctaWQ9XCIke2l0ZW0uaWR9XCJdYCkpOyAvLyAw67aA7YSwIGRhdGFCdWZmZXIubGVuZ3Ro67KI7Ke4IOyduOuNseyKpCjsoITssrQp66W8IOuzteyCrO2VnCDqsJ3ssrQg67CY7ZmYICYg7ZW064u5IO2BrOq4sOunjO2BvCDquLDsobQg6rCd7LK0IOuCtCDsm5Dshowg7IKt7KCcIC0+IDDsnLzroZwg7LSI6riw7ZmUXHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XHJcbiAgICAgICAgICAgIHNvdXJjZTogXCJjb250ZW50XCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiaW1nRGF0YUZyb21Db250ZW50U2NyaXB0XCIsXHJcbiAgICAgICAgICAgIGRhdGE6IGJhdGNoRnJvbUNvbnRlbnRTY3JpcHQsIC8vIDIw6rCc66eMIOuztOuCtOqzoCwg67Cw7Je07J2AIOyekOuPmeycvOuhnCDruYTsm4BcclxuICAgICAgICB9LFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcjtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nocm9tZS5ydW50aW1lIOuplOyEuOyngCDshqHsi6DsnbQg67aI6rCA64ql7ZWp64uI64ukLiBleHRlbnNpb27snYQg7IOI66Gc6rOg7Lmo7ZWY7JiA7J2EIOqwgOuKpeyEseydtCDrhpLsirXri4jri6QnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2VydmljZSB3b3JrZXIg7Iah7IugOlwiICsgYmF0Y2hGcm9tQ29udGVudFNjcmlwdC5sZW5ndGggKyBcIi0tLS0tLS0tLS0tLS0tXCIgKyBcIuyImOyLoFwiICsgcmVzcG9uc2UuZGF0YS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgdHJhY2tBbmRSZXBsYWNlSW1nKHJlc3BvbnNlKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgdGVybWluYXRlQ29udGVudFNjcmlwdChlLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCJpbXBvcnQgSU1HT2JzIGZyb20gXCIuLi9tb2R1bGVzL2ltZ09ic1wiO1xyXG5pbXBvcnQgeyBzZXRJbnRlcmNlcHRvckFjdGl2ZSB9IGZyb20gXCIuLi9nbG9iYWwvY29udGVudENvbmZpZ1wiO1xyXG5cclxuLyoqXHJcbiAqIFxyXG4gKiBAcGFyYW0ge2Vycn0gZXJyTWVzc2FnZSBcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0ZXJtaW5hdGVDb250ZW50U2NyaXB0KGVyck1lc3NhZ2UpIHtcclxuICAgIGlmICgvRXh0ZW5zaW9uIGNvbnRleHQgaW52YWxpZGF0ZWQvaS50ZXN0KGVyck1lc3NhZ2UpKSBjb25zb2xlLmVycm9yKFwiIGV4dGVuc2lvbiBtYXkgYmUgcmVsb2FkZWQgb3IgZGlzYWJsZWQuIHNvIHRoaXMgY29udGVudHNjcmlwdCBjYW4gbm8gbG9uZ2VyIGJlIG9wZXJhdGVkIGFuZCB3aWxsIGJlIHRlcm1haW5hdGVkXCIpO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIiF0ZXJtaW5hdGVDb250ZW50U2NyaXB0IGJlY2FvdXNlIHRoaXMgRXJyb3I6IFwiLCBlcnJNZXNzYWdlLCBcIiAhXCIpO1xyXG4gICAgfVxyXG4gICAgaWYgKElNR09icykge1xyXG4gICAgICAgIElNR09icy5kaXNjb25udGVjdE9iZXNlcnZlcigpO1xyXG4gICAgICAgIHNldEludGVyY2VwdG9yQWN0aXZlKGZhbHNlKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcInByb2dyYW0gb2ZmXCIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCJpbXBvcnQge2NoYW5nZUltZ30gZnJvbSAnLi9jb250ZW50VXRpbHMuanMnO1xyXG5pbXBvcnQge2dldFBlcm1pc3Npb25Gb3JNYXNraW5nfSBmcm9tICcuLi9nbG9iYWwvY29udGVudENvbmZpZy5qcyc7XHJcblxyXG5cclxubGV0IEFMTHJlbW92ZUZhbHNlID0gMDtcclxubGV0IEFMTHJlbW92ZVRydWUgPSAwO1xyXG5leHBvcnQgZnVuY3Rpb24gdHJhY2tBbmRSZXBsYWNlSW1nKHJlc3BvbnNlRnJvbVNXKSB7XHJcblxyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlQmF0Y2ggPSByZXNwb25zZUZyb21TVy5kYXRhOyAvLyDrsLDsl7QgW3sgaWQsIHVybCwgLi4uIH0sIC4uLl1cclxuICAgIGxldCByZW1vdmVGYWxzZSA9IDA7XHJcbiAgICBsZXQgcmVtb3ZlVHJ1ZSA9IDA7XHJcbiAgICBsZXQgdG90YWxTdGF0dXMgPSAwO1xyXG4gICAgbGV0IHN1Y2NlZWRTdGF0dXMgPSAwO1xyXG4gICAgbGV0IGlzSGFybWZ1bCA9IDA7XHJcblxyXG4gICAgcmVzcG9uc2VCYXRjaC5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIHRvdGFsU3RhdHVzKys7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiaWQ6IFwiICsgaXRlbS5pZCk7XHJcbiAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VlZFN0YXR1cysrO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW2RhdGEtaW1nLWlkPVwiJHtpdGVtLmlkfVwiXWApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpdGVtLmhhcm1mdWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVUcnVlKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndmlzaWJpbGl0eScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvYmplY3Quc3R5bGUucmVtb3ZlUHJvcGVydHkoJ29wYWNpdHknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7Jyg7ZW0IOydtOuvuOyngDogXCIgKyBpdGVtLnVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vb2JqZWN0LnN0eWxlLmJvcmRlciA9IFwiOHB4IHNvbGlkIHJlZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuZGF0YXNldC5vcmlnaW5hbFNyYyA9IG9iamVjdC5zcmM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnZXRQZXJtaXNzaW9uRm9yTWFza2luZygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VJbWcob2JqZWN0LCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG15SW1hZ2Uuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3doaXRlJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG15SW1hZ2Uuc3R5bGUub2JqZWN0Rml0ID0gJ2NvbnRhaW4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW1hZ2VFbGVtZW50LnN0eWxlLm9iamVjdFBvc2l0aW9uID0gJ2NlbnRlcic7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0LnNyYyA9IGhhcm1mdWxJbWdNYXJrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0LmNsYXNzTGlzdC5yZW1vdmUoJ2ltZ01hc2tpbmcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5kYXRhc2V0Lm1hc2tpbmcgPSBcIk5vbmVcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5kYXRhc2V0LnR5cGUgKz0gXCIgSGFybWZ1bFwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZhbHNlID0gcmVtb3ZlRmFsc2UgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuyLpO2MqCBpZDogXCIgKyBpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlzSGFybWZ1bCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG5cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3QpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZVRydWUrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0LnN0eWxlLnJlbW92ZVByb3BlcnR5KCd2aXNpYmlsaXR5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnb3BhY2l0eScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0LmNsYXNzTGlzdC5yZW1vdmUoJ2ltZ01hc2tpbmcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5kYXRhc2V0Lm1hc2tpbmcgPSBcIk5vbmVcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7ISx6rO1IGlkOiBcIiArIGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL29iamVjdC5zdHlsZS5ib3JkZXIgPSBcIjhweCBzb2xpZCBibHVlXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRmFsc2UgPSByZW1vdmVGYWxzZSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7Iuk7YyoIGlkOiBcIiArIGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG9iamVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGltZ1tkYXRhLWltZy1pZD1cIiR7aXRlbS5pZH1cIl1gKTtcclxuICAgICAgICAgICAgICAgIGlmIChvYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICByZW1vdmVUcnVlKys7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0LnN0eWxlLnJlbW92ZVByb3BlcnR5KCd2aXNpYmlsaXR5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0LnN0eWxlLnJlbW92ZVByb3BlcnR5KCdvcGFjaXR5Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5kYXRhc2V0Lm1hc2tpbmcgPSBcIk5vbmVcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0LmNsYXNzTGlzdC5yZW1vdmUoJ2ltZ01hc2tpbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuyEseqztSBpZDogXCIgKyBpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAvL29iamVjdC5zdHlsZS5ib3JkZXIgPSBcIjhweCBzb2xpZCBibHVlXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRmFsc2UgPSByZW1vdmVGYWxzZSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLsi6TtjKggaWQ6IFwiICsgaXRlbS5pZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIuydkeuLtSDrjbDsnbTthLAg66eI7Iqk7YK5IO2VtOygnCDspJHsl5Ag7Jik66WYIOuwnOyDnTogXCIgKyBlLm1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgICk7XHJcbiAgICBBTExyZW1vdmVGYWxzZSArPSByZW1vdmVGYWxzZTtcclxuICAgIEFMTHJlbW92ZVRydWUgKz0gcmVtb3ZlVHJ1ZTtcclxuICAgIGNvbnNvbGUubG9nKGDshJzruYTsiqQg7JuM7LukIOydkeuLtSDsnbTrr7jsp4Ag6rKw6rO8OiAke3RvdGFsU3RhdHVzfS8ke3N1Y2NlZWRTdGF0dXN9LyR7KHRvdGFsU3RhdHVzIC0gc3VjY2VlZFN0YXR1cyl9LyR7aXNIYXJtZnVsfVvstJ3tlakv7J2066+47KeAIOu2hOyEnSDshLHqs7Uv7J2066+47KeAIOu2hOyEnSDsi6TtjKgv7Jyg7ZW07J2066+47KeAXWApO1xyXG4gICAgY29uc29sZS5sb2coYOuniOyKpO2CuSDtlbTsoJwg6rKw6rO8OiAke3RvdGFsU3RhdHVzfS8ke3JlbW92ZVRydWV9LyR7cmVtb3ZlRmFsc2V9LyR7aXNIYXJtZnVsfVvstJ3tlakv7ISx6rO1L+yLpO2MqC/snKDtlbTsnbTrr7jsp4BdYCk7XHJcbiAgICBjb25zb2xlLmxvZyhg64iE7KCBIO2VqeqzhDogJHtBTExyZW1vdmVUcnVlfS8ke0FMTHJlbW92ZUZhbHNlfS8keyhBTExyZW1vdmVUcnVlICsgQUxMcmVtb3ZlRmFsc2UpfVvriITsoIEg7ISx6rO1L+uIhOyggSDsi6TtjKgv7LSdIOuIhOyggSDtlaldIHwg7ISx6rO166WgOiAkeyhBTExyZW1vdmVUcnVlIC8gKEFMTHJlbW92ZUZhbHNlICsgQUxMcmVtb3ZlVHJ1ZSkpLnRvRml4ZWQoMil9YCk7XHJcblxyXG59XHJcbiIsIi8vIHVybF9maWx0ZXJNb2R1bGVfYmFzZWRfc2FmZV9wYXR0ZXJuLmpzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxyXG4vL2RhdGEgdXJsKGJhc2U2NCksIGJsb2IgZGF0YSwgdXJsIOuBneyXkCDrtpnripQg7ZmV7J6l7J6QLCBDU1Mg7Iqk7ZSE65287J207Yq4XHJcbmNvbnN0IHByb3RvRGF0YSAgID0gbmV3IFVSTFBhdHRlcm4oeyBwcm90b2NvbDogJ2RhdGEnICAgfSk7XHJcbmNvbnN0IHByb3RvQmxvYiAgID0gbmV3IFVSTFBhdHRlcm4oeyBwcm90b2NvbDogJ2Jsb2InICAgfSk7XHJcbmNvbnN0IGV4dFBhdHRlcm4gID0gbmV3IFVSTFBhdHRlcm4oeyBwYXRobmFtZTogJy8qLiA6ZXh0KHN2Z3xzdmd6fGljb3xjdXJ8cG5nKScgfSk7XHJcbmNvbnN0IHNwcml0ZVBhdCAgID0gbmV3IFVSTFBhdHRlcm4oeyBwYXRobmFtZTogJypzcHJpdGUqLnthdmlmLHdlYnB9JyB9KTtcclxuXHJcbi8v7YKk7JuM65OcXHJcbi8vIOycoO2VtCDsnbTrr7jsp4DqsIAg7Y+s7ZWo65CgIOqwgOuKpeyEseydtCDrgq7snYAg7YKk7JuM65OcXHJcbmNvbnN0IG5hbWVSZWdleCAgID0gLyg/OlxcL3xeKShsb2dvfGZhdmljb258c3ByaXRlfGljb25zP3xiYWRnZXx0d2Vtb2ppfGZsYWd8ZW1vaml8c3Bpbm5lcnxsb2FkaW5nfHBsYWNlaG9sZGVyfGJsYW5rfHRyYW5zcGFyZW50fDF4MXxwaXhlbHxzcGFjZXJ8YWpheC1sb2FkZXIpW1xcd1xcLS5dKlxcLihwbmd8Z2lmfHN2Z3xpY298Y3VyfHdlYnB8YXZpZikkL2k7XHJcbi8v7Yq4656Y7YK5IO2UveyFgC/slaDrhJDrpqzti7HsiqQgLSAxeHgg7YGs6riw7J2YIGdpZuydvCDtmZXrpaDsnbQg64aS7J2AIO2CpOybjOuTnFxyXG5jb25zdCB0cmFja1JlZ2V4ICA9IC8oPzpwaXhlbHx0cmFja3xvcGVuKVxcLmdpZiQvaTtcclxuLy/slYjsoITtlZwg6rSR6rOgIO2CpOybjOuTnFxyXG5jb25zdCBhZFNhZmVSZWdleCA9IC9hZHNhZmVwcm90ZWN0ZWR8YnJhbmRzaGllbGR8ZG91YmxlY2xpY2suKmdzdGF0aWN8aW1hZ2VjYWNoZVxcL3Byb3RlY3QvaTtcclxuXHJcbi8v7ZmU7J207Yq466as7Iqk7Yq4IOuPhOuplOyduCAtIOyVhOydtOy9mCwg7I2464Sk7J28IOuTseydhCDsoJzqs7XtlZjripQg64+E66mU7J24IOygnOyZuFxyXG5jb25zdCBXSElURUxJU1QgPSBuZXcgU2V0KFtcclxuICAnZ3N0YXRpYy5jb20nLCAneXQzLmdncGh0LmNvbScsXHJcbiAgJ3R3ZW1vamkubWF4Y2RuLmNvbScsICdjZG5qcy5jbG91ZGZsYXJlLmNvbScsICd3d3cuZ3JhdmF0YXIuY29tJyxcclxuXSk7XHJcblxyXG5cclxuLyog7Iqk7YK0ICYg7ZmV7J6l7J6QIOqygOyCrCDtlajsiJgtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbmZ1bmN0aW9uIG1hdGNoUHJvdG9jb2xPckV4dCh1KSB7XHJcbiAgcmV0dXJuIHByb3RvRGF0YS50ZXN0KHUpIHx8IHByb3RvQmxvYi50ZXN0KHUpIHx8XHJcbiAgICAgICAgIGV4dFBhdHRlcm4udGVzdCh1KSB8fCBzcHJpdGVQYXQudGVzdCh1KTtcclxufVxyXG5cclxuLyog4p23IO2CpOybjOuTnCDqsoDsgqwg7ZWo7IiYIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuZnVuY3Rpb24gbWF0Y2hLZXl3b3JkKHUpIHtcclxuICByZXR1cm4gbmFtZVJlZ2V4LnRlc3QodS5wYXRobmFtZSk7XHJcbn1cclxuXHJcbi8qIOKduCDsnpHqsowg66qF7Iuc65CcIOy/vOumrCDtjIzrnbzrr7jthLAgKOKJpDY0Keq4sOuwmCDqsoDsgqwg7ZWo7IiYIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbmZ1bmN0aW9uIG1hdGNoVGlueVNpemUodSkge1xyXG4gIHJldHVybiBbJ3cnLCdoJywnd2lkdGgnLCdoZWlnaHQnLCdzaXplJywncycsJ3F1YWxpdHknLCdxJ11cclxuICAgIC5zb21lKGsgPT4ge1xyXG4gICAgICBjb25zdCB2ID0gcGFyc2VJbnQodS5zZWFyY2hQYXJhbXMuZ2V0KGspLCAxMCk7XHJcbiAgICAgIHJldHVybiAhTnVtYmVyLmlzTmFOKHYpICYmIHYgPD0gNjQ7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyog7ZmU7J207Yq466as7Iqk7Yq4IENETiDqsoDsgqwg7ZWo7IiYIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuZnVuY3Rpb24gbWF0Y2hXaGl0ZWxpc3QodSkge1xyXG4gIGNvbnN0IGhvc3QgPSB1Lmhvc3RuYW1lLnJlcGxhY2UoL153d3dcXC4vLCAnJyk7XHJcbiAgcmV0dXJuIFsuLi5XSElURUxJU1RdLnNvbWUoaCA9PiBob3N0ID09PSBoIHx8IGhvc3QuZW5kc1dpdGgoYC4ke2h9YCkpO1xyXG59XHJcblxyXG4vKiDinbog7Yq4656Y7YK5IO2UveyFgCAmIOyViOyghO2VnCDqtJHqs6Ag6rKA7IKsIO2VqOyImCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5mdW5jdGlvbiBtYXRjaFRyYWNraW5nKHUpIHsgcmV0dXJuIHRyYWNrUmVnZXgudGVzdCh1LnBhdGhuYW1lKTsgfVxyXG5mdW5jdGlvbiBtYXRjaEFkU2FmZSAodSkgeyByZXR1cm4gYWRTYWZlUmVnZXgudGVzdCh1LmhyZWYpOyAgICB9XHJcblxyXG4vKiDqt5zsuZkg6rKA7IKs66W8IOychO2VnCDtlajsiJgg66qo7J2MICjtlajsiJgg7JuQ7ZiVIOuwsOyXtCkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5leHBvcnQgY29uc3QgU0FGRV9SVUxFUyA9IFtcclxuICBtYXRjaFByb3RvY29sT3JFeHQsXHJcbiAgbWF0Y2hLZXl3b3JkLFxyXG4gIG1hdGNoVGlueVNpemUsXHJcbiAgbWF0Y2hXaGl0ZWxpc3QsXHJcbiAgbWF0Y2hUcmFja2luZyxcclxuICBtYXRjaEFkU2FmZSxcclxuXTtcclxuXHJcbi8qIOKdvCDri6jsnbwg7Zes7Y28IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJfYmFzZWRfc2FmZVVybFBhdHRlcm4odXJsKSB7XHJcbiAgbGV0IHJlc3VsdDtcclxuICB0cnl7XHJcbiAgIHJlc3VsdCA9IFNBRkVfUlVMRVMuc29tZShmbiA9PiBmbih1cmwpKTtcclxuICB9IGNhdGNoKGUpIHtcclxuICAgIGNvbnNvbGUoXCLruYTsnKDtlbQg7J2066+47KeAIO2VhO2EsOungSDspJEg7Jik66WYIOuwnOyDnSwgdXJsOiBcIiwgdXJsKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IHRyYWNrQW5kUmVwbGFjZUltZyB9IGZyb20gXCIuL3V0aWxzL3RyYWNrQW5kUmVwbGFjZUltZy5qc1wiO1xyXG5pbXBvcnQgeyBjaGFuZ2VJbWcsIGNyZWF0ZVJhbmRvbUltZ0lEfSBmcm9tICcuL3V0aWxzL2NvbnRlbnRVdGlscy5qcyc7XHJcbmltcG9ydCBJTUdPYnMgIGZyb20gXCIuL21vZHVsZXMvaW1nT2JzLmpzXCI7XHJcbmltcG9ydCB7IHNldFBlcm1pc3Npb25Gb3JNYXNraW5nLCBzZXRJbnRlcmNlcHRvckFjdGl2ZSwgZ2V0SW50ZXJjZXB0b3JBY3RpdmUgfSBmcm9tICcuL2dsb2JhbC9jb250ZW50Q29uZmlnLmpzJztcclxuaW1wb3J0IGRhdGFCdWZmZXIgZnJvbSAnLi9nbG9iYWwvYnVmZmVyLmpzJztcclxuXHJcblxyXG5sZXQgdGVzdGNudCA9IDA7XHJcbmxldCBjbGlja2VkSW1nID0gbnVsbDtcclxuXHJcbi8vZG9tIOuhnOuTnCDsmYTro4zquYzsp4Ag7Jik67KE66CI7J20IOyCveyehSwg7Jyg7KeAXHJcbi8vIGlmICh3aW5kb3cudG9wID09PSB3aW5kb3cuc2VsZikge1xyXG4vLyAgIGNvbnN0IG92ZXJsYXlEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuLy8gICBvdmVybGF5RGl2LmlkID0gJ2V4dGVuc2lvbk92ZXJsYXknO1xyXG4vLyAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChvdmVybGF5RGl2KTsgLy8gaHRtbCDrsJTroZwg7JWE656Y7JeQIOy2lOqwgFxyXG4vLyAgIHdpbmRvdy5wYWdlT3ZlcmxheSA9IG92ZXJsYXlEaXY7XHJcbi8vIH1cclxuXHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbmZ1bmN0aW9uIENvbGxlY3Rfc3RhdGljSW1nKCkge1xyXG4gIGNvbnN0IHN0YXRpY0ltZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKTtcclxuICBjb25zb2xlLmxvZyhcIuygleygge2MjOydvCDtlalcIiArIHN0YXRpY0ltZ3MubGVuZ3RoKTtcclxuXHJcbiAgc3RhdGljSW1ncy5mb3JFYWNoKGltZyA9PiB7XHJcbiAgICBjb25zdCBjdXJyZW50SW1nID0gaW1nOyAvLyAndGhpcycg7Luo7YWN7Iqk7Yq4IOusuOygnCDtlbTqsrDsnYQg7JyE7ZWcIOy6oeyymFxyXG4gICAgaWYgKCFjdXJyZW50SW1nLmRhdGFzZXQuaW1nSWQpIHtcclxuICAgICAgY3VycmVudEltZy5kYXRhc2V0Lm1hc2tpbmcgPSAnaW1nTWFza2luZyc7XHJcbiAgICAgIC8vIGN1cnJlbnRJbWcuY2xhc3NMaXN0LmFkZCgnaW1nTWFza2luZycpO1xyXG4gICAgICBjcmVhdGVSYW5kb21JbWdJRChjdXJyZW50SW1nKTtcclxuICAgICAgSU1HT2JzLmltZ1ZpZXdPYnNlcnZlci5vYnNlcnZlKGN1cnJlbnRJbWcpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSlcclxuXHJcbn1cclxuXHJcblxyXG4vL+ydtOuypO2KuCDrpqzsiqTrhIjsmqkg7ZWo7IiYXHJcbmZ1bmN0aW9uIHN0b3BPclN0YXJJbWdzTWFza2luZyhmbGFnKSB7XHJcbiAgY29uc29sZS5sb2coXCJmaWx0ZXJzdGF0dXNcIiArIGZsYWcpO1xyXG4gIGlmICghZmxhZykge1xyXG4gICAgY29uc3QgbWFza2VkSW1ncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYGltZ1tkYXRhLW1hc2tpbmc9XCJpbWdNYXNraW5nXCJdYCk7XHJcbiAgICBjb25zb2xlLmxvZyhtYXNrZWRJbWdzLmxlbmd0aCk7XHJcbiAgICBtYXNrZWRJbWdzLmZvckVhY2goaW1nID0+IHtcclxuICAgICAgaW1nLmRhdGFzZXQubWFza2luZyA9IFwiTm9uZVwiO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIGNvbnN0IGhhcm1mdWxJbWdzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdHlwZSo9XCJIYXJtZnVsXCJdJyk7XHJcbiAgICBjb25zb2xlLmxvZyhoYXJtZnVsSW1ncy5sZW5ndGgpO1xyXG4gICAgaGFybWZ1bEltZ3MuZm9yRWFjaChpbWcgPT4ge1xyXG4gICAgICBjaGFuZ2VJbWcoaW1nLCBmYWxzZSk7XHJcbiAgICAgIC8vaW1nLnNyYyA9IGltZy5kYXRhc2V0Lm9yaWdpbmFsU3JjO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgY29uc3QgaGFybWZ1bEltZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10eXBlKj1cIkhhcm1mdWxcIl0nKTtcclxuICAgIGhhcm1mdWxJbWdzLmZvckVhY2goaW1nID0+IHtcclxuICAgICAgLy9pbWcuc3JjID0gaGFybWZ1bEltZ01hcms7XHJcbiAgICAgIGNoYW5nZUltZyhpbWcsIHRydWUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgSU1HT2JzLmltZ0lkTGlzdC5mb3JFYWNoKGlkID0+IHtcclxuICAgICAgY29uc3Qgd2FpdGluZ0ltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGltZ1tkYXRhLWltZy1pZD1cIiR7aWR9XCJdYCk7XHJcbiAgICAgIGlmICh3YWl0aW5nSW1nKSB3YWl0aW5nSW1nLmRhdGFzZXQubWFza2luZyA9IFwiaW1nTWFza2luZ1wiO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGRhdGFCdWZmZXIubGVuZ3RoID4gMCkge1xyXG4gICAgICBkYXRhQnVmZmVyLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW2RhdGEtaW1nLWlkPVwiJHtpdGVtLmlkfVwiXWApO1xyXG4gICAgICAgIGlmIChpbWcpIGltZy5kYXRhc2V0Lm1hc2tpbmcgPSBcImltZ01hc2tpbmdcIjtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY29udHJvbENsaWNrZWRJbWcoaXNTaG93KSB7XHJcblxyXG4gIGlmIChjbGlja2VkSW1nID09PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIGlmIChpc1Nob3cpIHtcclxuICAgIGNsaWNrZWRJbWcuZGF0YXNldC5tYXNraW5nID0gXCJOb25lXCI7XHJcbiAgICBjaGFuZ2VJbWcoY2xpY2tlZEltZywgZmFsc2UpO1xyXG4gICAgLy9jbGlja2VkSW1nLnNyYyA9IGNsaWNrZWRJbWcuZGF0YXNldC5vcmlnaW5hbFNyYztcclxuICAgIC8vaGFybWZ1bOydhCDsl4bslaDslbwg7ZWoXHJcbiAgICBpZiAoY2xpY2tlZEltZy5kYXRhc2V0LnR5cGUuaW5jbHVkZXMoJ0hhcm1mdWwnKSkgY2xpY2tlZEltZy5kYXRhc2V0LnR5cGUgPSBjbGlja2VkSW1nLmRhdGFzZXQudHlwZS5yZXBsYWNlKCdIYXJtZnVsJywgJycpLnRyaW0oKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBjbGlja2VkSW1nLmRhdGFzZXQubWFza2luZyA9IFwiTm9uZVwiO1xyXG4gICAgY2xpY2tlZEltZy5kYXRhc2V0Lm9yaWdpbmFsU3JjID0gY2xpY2tlZEltZy5zcmM7XHJcbiAgICBpZiAoIWNsaWNrZWRJbWcuZGF0YXNldC50eXBlLmluY2x1ZGVzKCdIYXJtZnVsJykpIGNsaWNrZWRJbWcuZGF0YXNldC50eXBlICs9IFwiIEhhcm1mdWxcIjtcclxuICAgIGNoYW5nZUltZyhjbGlja2VkSW1nLCB0cnVlKTtcclxuICAgIC8vY2xpY2tlZEltZy5zcmMgPSBoYXJtZnVsSW1nTWFyaztcclxuICB9XHJcblxyXG4gIGNsaWNrZWRJbWcgPT09IG51bGw7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuLy8vL1xyXG5cclxuXHJcbi8vZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHBhZ2VJbml0KCkpO1xyXG5pZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XHJcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHBhZ2VJbml0KTtcclxufVxyXG5lbHNlIHtcclxuICBwYWdlSW5pdCgpO1xyXG59XHJcblxyXG5cclxuLy/stIjquLDtmZQg7ZWo7IiYXHJcbmFzeW5jIGZ1bmN0aW9uIHBhZ2VJbml0KCkge1xyXG5cclxuICBsZXQgaXNJbkJsYWNrTGlzdCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNvdXJjZTogXCJjb250ZW50XCIsIHR5cGU6IFwiY2hlY2tfYmxhY2tfbGlzdFwiLCBzaXRlOiB3aW5kb3cubG9jYXRpb24ub3JpZ2luLCBwYWdlOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgfSxcclxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlLnJlc3VsdCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgY2F0Y2goZSl7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgIHJlc29sdmUoZmFsc2UpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvL+y0iOq4sO2ZlCDsi5zsnpEvL1xyXG4gIGlmICghaXNJbkJsYWNrTGlzdCkge1xyXG4gICAgY29uc29sZS5sb2coXCLruJTrnpnrpqzsiqTtirjsl5Ag7JeG64qUIOyCrOydtO2KuCwg7ISk7KCVIOy9lOuTnCDsi6TtlolcIik7XHJcblxyXG4gICAgY29uc3QgcmVnaXN0ZXJSZXN1bHQgPSBhd2FpdCBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNvdXJjZTogXCJjb250ZW50XCIsdHlwZTogXCJyZWdpc3Rlcl9mcmFtZVwiIH0pO1xyXG4gICAgaWYgKCFyZWdpc3RlclJlc3VsdC5vaykge1xyXG4gICAgICBjb25zb2xlLmVycm9yKFwiY2FuIG5vdCByZWdpc3RlciBmcmFtZSB0byBzZXJ2aWNlIHdvcmtlclwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN0b3JlZEZpbHRlclN0YXR1cyA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ2ZpbHRlclN0YXR1cyddKTtcclxuICAgIGxldCBpc0ZpbHRlcmluZ09uID0gc3RvcmVkRmlsdGVyU3RhdHVzLmZpbHRlclN0YXR1cztcclxuICAgIGlmIChpc0ZpbHRlcmluZ09uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ZpbHRlclN0YXR1cyc6IHRydWUgfSk7XHJcbiAgICAgIGlzRmlsdGVyaW5nT24gPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgc2V0UGVybWlzc2lvbkZvck1hc2tpbmcoaXNGaWx0ZXJpbmdPbik7XHJcblxyXG4gICAgY29uc3Qgc3RvcmVkSW50ZXJjZXB0b3JTdGF0dXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydpbnRlcmNlcHRvclN0YXR1cyddKTtcclxuICAgIGxldCBzYXZlZFN0YXR1cyA9IHN0b3JlZEludGVyY2VwdG9yU3RhdHVzLmludGVyY2VwdG9yU3RhdHVzO1xyXG4gICAgaWYgKHNhdmVkU3RhdHVzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU3RhdHVzJzogMSB9KTtcclxuICAgICAgc2F2ZWRTdGF0dXMgPSAxO1xyXG4gICAgfVxyXG4gICAgc2V0SW50ZXJjZXB0b3JBY3RpdmUoc2F2ZWRTdGF0dXMgPT09IDEgPyB0cnVlIDogZmFsc2UpO1xyXG5cclxuXHJcbiAgICBzZXRFbnZlbnRMaXN0ZXJzKCk7XHJcblxyXG5cclxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlICE9IFwibG9hZGluZ1wiKSB7XHJcbiAgICAgIGlmIChnZXRJbnRlcmNlcHRvckFjdGl2ZSgpKSB7XHJcbiAgICAgICAgSU1HT2JzLmltZ09ic2VydmUoKTtcclxuICAgICAgICBDb2xsZWN0X3N0YXRpY0ltZygpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuICAvLyBpZiAod2luZG93LnRvcCA9PT0gd2luZG93LnNlbGYpIHtcclxuICAvLyAgIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXh0ZW5zaW9uT3ZlcmxheScpO1xyXG4gIC8vICAgaWYgKG92ZXJsYXkpIHtcclxuICAvLyAgICAgY29uc29sZS5sb2coXCJvdmVyYXkgcmVtb3ZlIHN0YXJ0c1wiKTtcclxuXHJcbiAgLy8gICAgIG92ZXJsYXkuY2xhc3NMaXN0LmFkZCgnZmFkZS1vdXQnKTtcclxuICAvLyAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgLy8gICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XHJcbiAgLy8gICAgICAgb3ZlcmxheS5yZW1vdmUoKTsvLyBET03sl5DshJwg7KCc6rGw7ZWY7JesIOyZhOyghO2VmOqyjCDsgqzrnbzsp4Dqsowg7ZWoXHJcbiAgLy8gICAgICAgLy8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XHJcbiAgLy8gICAgICAgY29uc29sZS5sb2coXCJvdmVyYXkgcmVtb3ZlZFwiKTtcclxuICAvLyAgICAgfSwgNTUwKTsgLy81MDBtcygwLjXstIgpXHJcbiAgLy8gICB9XHJcbiAgLy8gfVxyXG5cclxufVxyXG5cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gc2V0RW52ZW50TGlzdGVycygpIHtcclxuXHJcbiAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xyXG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJpbWdEYXRhV2FpdGluZ0Zyb21TZXJ2aWNlV29ya1wiKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwi7ISc67mE7Iqk7JuM7Luk7JeQ7IScIOuMgOq4sO2VmOuNmCDrjbDsnbTthLDqsIAg65Ok7Ja07JmU7Iq164uI64ukXCIpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwic2VydmljZSB3b3Jr7JeQ7IScIOyEnOuyhOydmCDsnKDtlbQg7J2066+47KeAIOu2hOyEnSDqsrDqs7zrpbwg6riw64uk66as642YIERhdGE6IFwiICsgbWVzc2FnZS5kYXRhLmxlbmd0aCk7XHJcblxyXG4gICAgICAgIHRyYWNrQW5kUmVwbGFjZUltZyhtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgc2VuZFJlc3BvbnNlKHtcclxuICAgICAgICAgIHR5cGU6IFwicmVzcG9uc2VcIixcclxuICAgICAgICAgIG9rOiB0cnVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIG9jdXJyWyA9d2hpbGUgY29uZmlybWluZyB3YWl0aW5nIGRhdGEgZnJvbSBzZXJ2aWNlIHdvcmtlcl1cIiwgZSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG5cclxuICBsZXQgY291bnQgPSAwO1xyXG4gIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICAgIGlmIChtZXNzYWdlLnNvdXJjZSA9PT0gJ3NlcnZpY2Vfd29ya2VyJykge1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xyXG4gICAgICAgICAgY2FzZSAnYWN0aXZlX2ludGVyY2VwdG9yJzpcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UuYWN0aXZlKTtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2UuYWN0aXZlKSB7XHJcbiAgICAgICAgICAgICAgSU1HT2JzLnJlY29ubmVjdE9iZXNlcnZlcigpO1xyXG4gICAgICAgICAgICAgIHNldEludGVyY2VwdG9yQWN0aXZlKHRydWUpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicHJvZ3JhbSBvblwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBJTUdPYnMuZGlzY29ubnRlY3RPYmVzZXJ2ZXIoKTtcclxuICAgICAgICAgICAgICBzZXRJbnRlcmNlcHRvckFjdGl2ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJwcm9ncmFtIG9mZlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogdHJ1ZSwgbWVzc2FnZTogXCJzdWNjZXNzXCIgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICBjYXNlICdzZXRfZmlsdGVyX3N0YXR1cyc6XHJcbiAgICAgICAgICAgIC8vb2JzZXJ2ZXLqsIAg7KSA67mE65CY7JeI64qU7KeAIO2ZleyduO2VmOuKlCDsvZTrk5wg64KY7KSR7JeQIOy2lOqwgO2VtOyVvCDtlahcclxuICAgICAgICAgICAgc2V0UGVybWlzc2lvbkZvck1hc2tpbmcobWVzc2FnZS5GaWx0ZXJTdGF0dXMpO1xyXG4gICAgICAgICAgICBzdG9wT3JTdGFySW1nc01hc2tpbmcobWVzc2FnZS5GaWx0ZXJTdGF0dXMpO1xyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogdHJ1ZSwgbWVzc2FnZTogXCJzdWNjZXNzXCIgfSk7XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICBjYXNlICdjb250cm9sX2ltZyc6XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7J2066+47KeAIOy7qO2KuOuhpFwiKTtcclxuICAgICAgICAgICAgaWYgKCFnZXRJbnRlcmNlcHRvckFjdGl2ZSgpKSBzZW5kUmVzcG9uc2UoeyBvazogZmFsc2UsIG1lc3NhZ2U6IFwiaW50ZXJjZXB0b3IgaXMgbm90IGFjdGl2ZVwiIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29udHJvbENsaWNrZWRJbWcobWVzc2FnZS5pc1Nob3cpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xyXG4gICAgICAgICAgICBpZiAoIXJlc3VsdCkgdGhyb3cgbmV3IEVycm9yKFwiY2FuIG5vdCBjb250cm9sIHNpbmdsZSBpbWcgbWFza2luZ1wiKTtcclxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IHRydWUsIG1lc3NhZ2U6IFwic3VjY2Vzc1wiIH0pO1xyXG5cclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2FuIG5vdCByZWFkIG1lc3NhZ2UgdHlwZSBmcm9tIHNlcnZpY2Ugd29ya2VyXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IGZhbHNlLCBtZXNzYWdlOiBlIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBcclxuICB9KTtcclxuICBcclxuICBcclxuICBcclxuICAvL+y7qO2FjeyKpO2KuCDrqZTribQg64W47LacLy9cclxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuXHJcbiAgICBpZiAoIWdldEludGVyY2VwdG9yQWN0aXZlKCkpIHJldHVybjtcclxuXHJcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQ7XHJcbiAgICAvLyDtg5Dsg4nsnYQg7JyE7ZWcIO2BkOulvCDsg53shLFcclxuICAgIGNvbnN0IHF1ZXVlID0gW3RhcmdldF07XHJcbiAgICBjb25zdCB2aXNpdGVkID0gbmV3IFNldCgpOyAvLyDspJHrs7Ug67Cp66y4IOuwqeyngOulvCDsnITtlZwgU2V0XHJcblxyXG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDApIHtcclxuICAgICAgY29uc3QgY3VycmVudE5vZGUgPSBxdWV1ZS5zaGlmdCgpOyAvLyDtgZDsnZgg66eoIOyVniDrhbjrk5xcclxuXHJcbiAgICAgIC8vIOydtOuvuCDrsKnrrLjtlZwg64W465Oc64qUIOqxtOuEiOucgFxyXG4gICAgICBpZiAodmlzaXRlZC5oYXMoY3VycmVudE5vZGUpKSB7XHJcbiAgICAgICAgY29udGludWU7XHJcbiAgICAgIH1cclxuICAgICAgdmlzaXRlZC5hZGQoY3VycmVudE5vZGUpO1xyXG5cclxuXHJcbiAgICAgIC8vIO2YhOyerCDrhbjrk5zqsIAg7J2066+47KeA7J247KeAIO2ZleyduFxyXG4gICAgICBpZiAoY3VycmVudE5vZGUudGFnTmFtZSA9PT0gJ0lNRycpIHtcclxuICAgICAgICBjbGlja2VkSW1nID0gY3VycmVudE5vZGU7XHJcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgc291cmNlOiBcImNvbnRlbnRcIixcclxuICAgICAgICAgIHR5cGU6IFwiaW1hZ2VDbGlja2VkXCIsXHJcbiAgICAgICAgICBpbWdTcmM6IGN1cnJlbnROb2RlLnNyYyxcclxuICAgICAgICAgIGlzU2hvdzogY3VycmVudE5vZGUuZGF0YXNldC50eXBlLmluY2x1ZGVzKCdIYXJtZnVsJykgPyBmYWxzZSA6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyDsnbTrr7jsp4Drpbwg7LC+7JWY7Jy866+A66GcIO2DkOyDieydhCDsooXro4xcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIOyekOyLnSDrhbjrk5zqsIAg7J6I64uk66m0IO2BkOyXkCDstpTqsIBcclxuICAgICAgY29uc3QgY2hpbGRyZW4gPSBjdXJyZW50Tm9kZS5jaGlsZHJlbjtcclxuICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICBxdWV1ZS5wdXNoKGNoaWxkKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGlja2VkSW1nID0gbnVsbDtcclxuXHJcbiAgfSwgdHJ1ZSk7XHJcblxyXG59XHJcblxyXG5cclxuXHJcblxyXG5cclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9