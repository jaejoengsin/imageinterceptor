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
        img.style.backgroundColor = 'white';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center';
    }
    else {
        img.style.backgroundColor = '';
        img.style.objectFit = '';
        img.style.objectPosition = '';
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
if (window.top === window.self) {
  const overlayDiv = document.createElement('div');
  overlayDiv.id = 'extensionOverlay';
  document.documentElement.appendChild(overlayDiv); // html 바로 아래에 추가
  window.pageOverlay = overlayDiv;
}


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
  if (window.top === window.self) {
    const overlay = document.getElementById('extensionOverlay');
    if (overlay) {
      console.log("overay remove starts");

      overlay.classList.add('fade-out');
      setTimeout(() => {
        document.documentElement.style.pointerEvents = 'auto';
        overlay.remove();// DOM에서 제거하여 완전하게 사라지게 함
        // document.documentElement.style.visibility = 'visible';
        console.log("overay removed");
      }, 550); //500ms(0.5초)
    }
  }

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
        console.log(currentNode.src);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvZ2xvYmFsL2J1ZmZlci5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL2dsb2JhbC9jb250ZW50Q29uZmlnLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvbW9kdWxlcy9pbWdPYnMuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy91dGlscy9jb250ZW50VXRpbHMuanMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy91dGlscy9mbHVzaC5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL3Rlcm1pbmF0ZS5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL3RyYWNrQW5kUmVwbGFjZUltZy5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL3VybF9maWx0ZXJNb2R1bGVfYmFzZWRfc2FmZV9wYXR0ZXJuLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL2NvbnRlbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZGF0YUJ1ZmZlciA9IFtdO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGF0YUJ1ZmZlcjsiLCJcclxuXHJcbmV4cG9ydCBsZXQgcGVybWlzc2lvbkZvck1hc2tpbmcgPSB0cnVlO1xyXG5leHBvcnQgbGV0IGlzSW50ZXJjZXB0b3JBY3RpdmUgPSB0cnVlO1xyXG5cclxuZnVuY3Rpb24gc2V0UGVybWlzc2lvbkZvck1hc2tpbmcoZmxhZykgeyBwZXJtaXNzaW9uRm9yTWFza2luZyA9IGZsYWc7IH1cclxuZnVuY3Rpb24gc2V0SW50ZXJjZXB0b3JBY3RpdmUoZmxhZykgeyBpc0ludGVyY2VwdG9yQWN0aXZlID0gZmxhZzsgfVxyXG5mdW5jdGlvbiBnZXRJbnRlcmNlcHRvckFjdGl2ZSgpIHsgcmV0dXJuIGlzSW50ZXJjZXB0b3JBY3RpdmU7IH1cclxuZnVuY3Rpb24gZ2V0UGVybWlzc2lvbkZvck1hc2tpbmcoKSB7IHJldHVybiBwZXJtaXNzaW9uRm9yTWFza2luZzsgfVxyXG5cclxuZXhwb3J0IHsgc2V0UGVybWlzc2lvbkZvck1hc2tpbmcsIHNldEludGVyY2VwdG9yQWN0aXZlLCBnZXRJbnRlcmNlcHRvckFjdGl2ZSwgZ2V0UGVybWlzc2lvbkZvck1hc2tpbmcgfTsiLCJpbXBvcnQgeyBjcmVhdGVSYW5kb21JbWdJRCB9IGZyb20gXCIuLi91dGlscy9jb250ZW50VXRpbHMuanNcIjtcclxuaW1wb3J0ICogYXMgZmlsdGVyTW9kdWxlIGZyb20gXCIuLi91dGlscy91cmxfZmlsdGVyTW9kdWxlX2Jhc2VkX3NhZmVfcGF0dGVybi5qc1wiO1xyXG5pbXBvcnQgeyBnZXRQZXJtaXNzaW9uRm9yTWFza2luZ30gZnJvbSBcIi4uL2dsb2JhbC9jb250ZW50Q29uZmlnLmpzXCI7XHJcbmltcG9ydCBkYXRhQnVmZmVyIGZyb20gXCIuLi9nbG9iYWwvYnVmZmVyLmpzXCI7XHJcbmltcG9ydCB7IG1heWJlRmx1c2ggfSBmcm9tIFwiLi4vdXRpbHMvZmx1c2guanNcIjtcclxuXHJcblxyXG5cclxubGV0IHRvdGFsaW1nID0gMDtcclxubGV0IE5vTlNhZmVJbWdDb3VudCA9IDA7XHJcblxyXG4vL+yDgeuMgOqyveuhnCAtPiDsoIjrjIDqsr3roZxcclxuZnVuY3Rpb24gdG9BYnNvbHV0ZVVybCh1cmwsIGJhc2VVcmwgPSBkb2N1bWVudC5iYXNlVVJJKSB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBuZXcgVVJMKHVybCwgYmFzZVVybCk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gdXJsO1xyXG4gIH1cclxufVxyXG5cclxuLyoqLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gaW1nIC0gZG9tIOydtOuvuOyngCDrhbjrk5xcclxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSDsoJXsoIEg6rWQ7LK0L+uPmeyggSDqtZDssrQg6riw66GdXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0NvbmRpdGlvbkFuZFNlbmQoaW1nLCB0eXBlKSB7XHJcbiAgY29uc3QgdXJsID0gaW1nLmN1cnJlbnRTcmMgfHwgaW1nLnNyYztcclxuICBsZXQgYWJzVXJsO1xyXG4gIGlmICghdXJsIHx8IHVybCA9PT0gJycpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvcjogdXJsIE5PVCBGT1VORFxcbklEOlwiLCBpbWcuZGF0YXNldC5pbWdJZCk7XHJcblxyXG4gICAgcmV0dXJuOyAgICAgICAgICAvLyDruYggVVJMIOqxuOufrOuDhFxyXG4gIH1cclxuICB0cnkge1xyXG4gICAgYWJzVXJsID0gdG9BYnNvbHV0ZVVybCh1cmwsIGRvY3VtZW50LmJhc2VVUkkpO1xyXG4gICAgaWYgKGZpbHRlck1vZHVsZS5maWx0ZXJfYmFzZWRfc2FmZVVybFBhdHRlcm4oYWJzVXJsKSkge1xyXG4gICAgICBpbWcuZGF0YXNldC5tYXNraW5nID0gXCJOb25lXCI7XHJcbiAgICAgIE5vTlNhZmVJbWdDb3VudCsrO1xyXG4gICAgICBpbWcuZGF0YXNldC5pbWdJZCA9IFwiZXhjZXB0XCI7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwi67mE7Jyg7ZW0IOydtOuvuOyngDpcIiwgYWJzVXJsLnRvU3RyaW5nKCksIFwiIOy0ne2VqTpcIiwgTm9OU2FmZUltZ0NvdW50KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCJVUkwg7KCV6rec7ZmUIOqzvOyglSbruYTsnKDtlbTsnbTrr7jsp4Ag7ZWE7YSw66eBIOykkSDsmKTrpZgg67Cc7IOdOiAtIFwiLCBlKTtcclxuICAgIGNvbnNvbGUuZXJyb3IoXCLsmKTrpZjrpbwg67Cc7IOd7Iuc7YKoIOydtOuvuOyngOydmCB1cmw6XCIsIHVybCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGltZy5kYXRhc2V0LnR5cGUgPSB0eXBlOyAvL3N0YXRpYyB8IGR5bmFtaWMgaW1nXHJcblxyXG4gIGRhdGFCdWZmZXIucHVzaCh7IGlkOiBpbWcuZGF0YXNldC5pbWdJZCwgdXJsOiBhYnNVcmwudG9TdHJpbmcoKSwgaGFybWZ1bDogZmFsc2UsIHN0YXR1czogZmFsc2UgfSk7XHJcbiAgbWF5YmVGbHVzaCgpO1xyXG59XHJcblxyXG4vL2N1cnJlbnRzcmPsl5Ag6rCS7J20IOyDneq4uOuVjOq5jOyngCDri6TsnYwgcmVwYWludCDthLTsnYQg67mE64+Z6riw7KCB7Jy866GcIOq4sOuLpOumrOqzoCwg67CY67O1LlxyXG5mdW5jdGlvbiBjaGVja0N1cnJlbnRTcmMoaW1nLCBjYWxsYmFjaywgdGltZW91dCA9IDEwMDApIHsgLy9sYXp5IGxvYWRpbmfsnLzroZwg7J247ZW0IOq4sOuLpOumrOuKlCDsi5zqsITsnbQg7Ja866eI64KYIOyngOyGjeuQmOuKkOuDkOyXkCDrlLDrnbwgY3VycmVudFNyY+ulvCDslrvsnYQg7IiY64+EIOyeiOqzoCDrqrsg7Ja77J2EIOyImOuPhCDsnojsnYwuIO2Kue2eiCDsnKDtipzruIwg6rCZ7J2AXHJcbiAgLy/rj5nsoIEg7IKs7J207Yq4IOuMgOyDgVxyXG4gIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgZnVuY3Rpb24gY2hlY2soKSB7XHJcbiAgICBpZiAoaW1nLmN1cnJlbnRTcmMgJiYgaW1nLmN1cnJlbnRTcmMgIT09ICcnKSB7XHJcbiAgICAgIGNhbGxiYWNrKGltZyk7XHJcbiAgICB9IGVsc2UgaWYgKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiIXdhcm5pbmchOiBjdXJyZW50U3JjIOqwkiDsg53shLEg7KCE7JeQIOygnO2VnCDsi5zqsITsnYQg7LSI6rO87ZWY7JiA7Iq164uI64ukLiDstpTtm4Qg7J2066+47KeAIOuniOyKpO2CuSDtlbTsoJzsl5Ag7Iuk7Yyo7ZWgIOyImCDrj4Qg7J6I7Iq164uI64ukXCIpXHJcbiAgICAgIGNhbGxiYWNrKGltZyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2hlY2spO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNoZWNrKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlIGltZyBub2RlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB0b3BNYXJnaW4g7IOB64uoIOyXrOuwseydhCDrt7Dtj6ztirgg64aS7J207J2YIOuwsOyImOuhnCDshKTsoJUuIOq4sOuzuOqwkuydgCAyXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBib3R0b21NYXJnaW4g7ZWY64uoIOyXrOuwseydhCDrt7Dtj6ztirgg64aS7J207J2YIOuwsOyImOuhnCDshKTsoJUuIOq4sOuzuOqwkiAxXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSDsmpTshozqsIAg7KeA7KCV65CcIOuylOychCDslYjsl5Ag7J6I7Jy866m0IHRydWUsIOyVhOuLiOuptCBmYWxzZS5cclxuICovXHJcbmZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnQobm9kZSwgdG9wTWFyZ2luID0gMSwgYm90dG9tTWFyZ2luID0gMSkge1xyXG4gIGNvbnN0IHJlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gIGNvbnN0IHZpZXdwb3J0SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcblxyXG4gIC8vIOu3sO2PrO2KuCDsg4Hri6jsl5DshJwgdG9wTWFyZ2luIOuwsOyImOunjO2BvCDrlqjslrTsp4Qg7JyE7LmYXHJcbiAgY29uc3QgdG9wVGhyZXNob2xkID0gdmlld3BvcnRIZWlnaHQgKiB0b3BNYXJnaW47XHJcbiAgLy8g67ew7Y+s7Yq4IO2VmOuLqOyXkOyEnCBib3R0b21NYXJnaW4g67Cw7IiY66eM7YG8IOuWqOyWtOynhCDsnITsuZhcclxuICBjb25zdCBib3R0b21UaHJlc2hvbGQgPSAtdmlld3BvcnRIZWlnaHQgKiBib3R0b21NYXJnaW47XHJcblxyXG4gIC8vIOyalOyGjOydmCDsg4Hri6jsnbQgdG9wVGhyZXNob2xk67O064ukIOyekeqzoCwg7JqU7IaM7J2YIO2VmOuLqOydtCBib3R0b21UaHJlc2hvbGTrs7Tri6Qg7Luk7JW8IO2VqeuLiOuLpC5cclxuICByZXR1cm4gcmVjdC50b3AgPCB0b3BUaHJlc2hvbGQgJiYgcmVjdC5ib3R0b20gPiBib3R0b21UaHJlc2hvbGQ7XHJcbn1cclxuXHJcbi8vY2hlY2tDdXJyZW50U3Jj66GcIHJlcXVlc3RBbmltYXRpb25GcmFtZSDsi5zsoJDsl5AgbWFza2FuZHNlbmQg7Zi47LacLiBjdXJyZW50U3Jj66W8IOyViOygleyggeycvOuhnCDslrvquLAg7JyE7ZWoLlxyXG4vL+yWuOygnCDri6Tsi5wg7J2066+47KeA6rCAIOuTpOyWtOyYrOyngCDrqqjrpbTrr4DroZwg7J2864uoIGRpc2Nvbm5lY3TripQg7JWI7ZWoXHJcbi8v7J2066+47KeAIOuFuOuTnOyXkCBzcmNzZXTsnbQg7KG07J6s7ZWY6rGw64KYIHNvdXJjZSDtg5zqt7jqsIAg7KG07J6s7ZWgIOqyveyasCDruIzrnbzsmrDsoIDqsIAgc3Jjc2V07J2EIOyEoO2Dne2VmOyXrCDroIzrjZTrp4HtlaAg7IiYIOuPhCDsnojsnYwuIOydtCDqsr3smrBcclxuLy8gc3Jjc2V07J20IOyEnOu5hOyKpCDsm4zsu6Qg642w7J207YSwIOuyoOydtOyKpOyXkCDrk7HroZ3rkJjrqbAg7Ja065akIHNyY3NldOydtCDrk7HroZ3rkJjripTsp4Ag7JiI7Lih7ZWgIOyImCDsl4bsnLzrr4DroZwgc3Jj66W8IOq4sOykgOycvOuhnCDtlaguIOuUsOudvOyEnCDsnbQg6rK97JqwIHNyY+ydmCB1cmzroZwg642w7J207YSw67Kg7J207IqkIOyerOuTseuhnSDrsI8g7ZW064u5IHVybOuhnCDsnqzsmpTssq1cclxuXHJcbmNsYXNzIGltYWdlT2JzZXJ2ZXJzIHtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgdGhpcy5pbWdJZExpc3QgPSBbXTtcclxuICAgIHRoaXMuSXNPYnN2QWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5pbWdWaWV3T2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoZW50cmllcyA9PiB7XHJcbiAgICAgIGVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XHJcbiAgICAgICAgaWYgKCFlbnRyeS5pc0ludGVyc2VjdGluZykgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGltZ09iaiA9IGVudHJ5LnRhcmdldDtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudEluVmlld3BvcnQoaW1nT2JqKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaW1ndmlld09ic2VydmVyIG9ic2VydmUgZW50cnksIGlkOiBcIixpbWdPYmouZGF0YXNldC5pbWdJZCk7XHJcbiAgICAgICAgY2hlY2tDdXJyZW50U3JjKGltZ09iaiwgaHRtbEltZ0VsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgY2hlY2tDb25kaXRpb25BbmRTZW5kKGh0bWxJbWdFbGVtZW50LCAnZHluYW1pY0lNRycpOyAvL21hc2tBbmRTZW5k66W8IOuwlOuhnCDtmLjstpztlbTrj4Qg66y47KCcIOyXhuuKlCDqsoPsnYQg7ZmV7J247ZWY7JiA7Jy864KYIOyViOygleyEseydhCDsnITtlbQg7J2066CH6rKMIO2VqFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuaW1nVmlld09ic2VydmVyLnVub2JzZXJ2ZShpbWdPYmopO1xyXG4gICAgICAgIGxldCBybUlkeCA9IHRoaXMuaW1nSWRMaXN0LmluZGV4T2YoaW1nT2JqLmRhdGFzZXQuaW1nSWQpO1xyXG4gICAgICAgIGlmIChybUlkeCAhPT0gLTEpIHtcclxuICAgICAgICAgIHRoaXMuaW1nSWRMaXN0LnNwbGljZShybUlkeCwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcblxyXG4gICAgfSwge1xyXG4gICAgICByb290OiBudWxsLFxyXG4gICAgICByb290TWFyZ2luOiBcIjQwJSAwcHggMHB4IDBweFwiLFxyXG4gICAgICB0aHJlc2hvbGQ6IDAsIC8vcm9vdE1hcmdpbjogMHB4LCB0aHJlc2hvbGQ6IDDsnLzroZwg7ZW064+EIOyekeuPmeydtCDqsIDriqXtlZjrgpgsIOyViOygleyEseydhCDsnITtlbQg7J2864uoIOyImOy5mOulvCDsobDquIgg64aS7J24IOyDge2DnFxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5pbWdPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKG11dGF0aW9ucyA9PiB7XHJcbiAgICAgIGNvbnN0IGVsZW1lbnRzID0gW107XHJcbiAgICAgIG11dGF0aW9ucy5mb3JFYWNoKG11dGF0aW9uID0+IHtcclxuICAgICAgICBpZiAobXV0YXRpb24udHlwZSA9PT0gJ2NoaWxkTGlzdCcpIHtcclxuICAgICAgICAgIG11dGF0aW9uLmFkZGVkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcclxuICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IDEpIHJldHVybjsgIC8vIGVsZW1lbnTrp4wg7LKY66asXHJcbiAgICAgICAgICAgIGlmIChub2RlLnRhZ05hbWUgPT09ICdJTUcnKSB7XHJcblxyXG4gICAgICAgICAgICAgIGlmICghbm9kZS5kYXRhc2V0LmltZ0lkKSB7XHJcbiAgICAgICAgICAgICAgICBjcmVhdGVSYW5kb21JbWdJRChub2RlKTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIuydtOuvuOyngOydmCBpZOuKlDogXCIsIG5vZGUuZGF0YXNldC5pbWdJZCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyA8aW1nPuqwgCDslYTri4wg7JqU7IaM6rCAIOuTpOyWtOyYqCDqsr3smrA6IOyekOyLnSBpbWcg6rKA7IOJXHJcbiAgICAgICAgICAgICAgbm9kZS5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5mb3JFYWNoKGltZyA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBpbWcuc3R5bGUuc2V0UHJvcGVydHkoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJywgJ2ltcG9ydGFudCcpO1xyXG4gICAgICAgICAgICAgICAgLy8gaW1nLnN0eWxlLnNldFByb3BlcnR5KCdvcGFjaXR5JywgJzAnLCAnaW1wb3J0YW50Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWltZy5kYXRhc2V0LmltZ0lkKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNyZWF0ZVJhbmRvbUltZ0lEKGltZyk7XHJcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goaW1nKTtcclxuICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCLsnbTrr7jsp4DsnZggaWTripQ6IFwiLCBpbWcuZGF0YXNldC5pbWdJZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcbiAgICAgIHRvdGFsaW1nICs9IGVsZW1lbnRzLmxlbmd0aDtcclxuICAgICAgLy8gY29uc29sZS5sb2coXCJ0b3RhbCBJTUc6IFwiLCB0b3RhbGltZylcclxuXHJcbiAgICAgIGVsZW1lbnRzLmZvckVhY2goZWwgPT4ge1xyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChnZXRQZXJtaXNzaW9uRm9yTWFza2luZygpKSBlbC5kYXRhc2V0Lm1hc2tpbmcgPSAnaW1nTWFza2luZyc7XHJcbiAgICAgICAgICBlbHNlIGVsLmRhdGFzZXQubWFza2luZyA9ICcnO1xyXG4gICAgICAgICAgLy8gZWwuY2xhc3NMaXN0LmFkZCgnaW1nTWFza2luZycpOy8v64uk7J2MIOugjOuNlCDsgqzsnbTtgbTsl5DshJwg66eI7Iqk7YK5XHJcbiAgICAgICAgICB0aGlzLmltZ0lkTGlzdC5wdXNoKGVsLmRhdGFzZXQuaW1nSWQpO1xyXG4gICAgICAgICAgdGhpcy5pbWdWaWV3T2JzZXJ2ZXIub2JzZXJ2ZShlbCk7Ly/roIzrjZTrp4EsIOugiOydtOyVhOybgyDsoJXrpqzqsIAg7KCc64yA66GcIOydtOujqOyWtOyngOyngCDslYrsnYAg7IOB7YOc7JeQ7IScIOqwkOyngOuQoCDsiJgg7J6I7Jy866+A66GcIO2VnCDtlITroIjsnoQg7Ims6rOgIO2YuOy2nFxyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGltZ09ic2VydmUoKSB7XHJcbiAgICB0aGlzLmltZ09ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xyXG4gICAgICBjaGlsZExpc3Q6IHRydWUsIC8v7J6Q7IudXHJcbiAgICAgIHN1YnRyZWU6IHRydWUsIC8v7J6Q7IaQXHJcblxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBkaXNjb25udGVjdE9iZXNlcnZlcigpIHtcclxuXHJcbiAgICB0aGlzLklzT2JzdkFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5pbWdWaWV3T2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xyXG4gICAgY29uc3QgcmVtYWluSW1ncyA9IHRoaXMuaW1nT2JzZXJ2ZXIudGFrZVJlY29yZHMoKTtcclxuICAgIHRoaXMuaW1nT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xyXG4gICAgY29uc29sZS5sb2codGhpcy5pbWdJZExpc3QubGVuZ3RoKTtcclxuXHJcbiAgICBjb25zdCBtYXNrZWRJbWdzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgaW1nW2RhdGEtaW1nLWlkXWApO1xyXG4gICAgbWFza2VkSW1ncy5mb3JFYWNoKGltZyA9PiB7XHJcbiAgICAgIGltZy5kYXRhc2V0Lm1hc2tpbmcgPSBcIk5vbmVcIjtcclxuICAgIH0pO1xyXG4gICAgLy8gaWYodGhpcy5pbWdJZExpc3QubGVuZ3RoID4gMCl7XHJcblxyXG4gICAgLy8gICB0aGlzLmltZ0lkTGlzdC5mb3JFYWNoKGlkID0+IHtcclxuXHJcbiAgICAvLyAgICAgICBjb25zdCBpbWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBpbWdbZGF0YS1pbWctaWQ9XCIke2lkfVwiXWApO1xyXG4gICAgLy8gICAgICAgaWYoaW1nKXtcclxuICAgIC8vICAgICAgICAgaW1nLmRhdGFzZXQubWFza2luZyA9IFwiTm9uZVwiO1xyXG4gICAgLy8gICAgICAgfVxyXG4gICAgLy8gICB9KTtcclxuXHJcbiAgICAvLyB9XHJcblxyXG4gICAgaWYgKHJlbWFpbkltZ3MubGVuZ3RoID4gMCkge1xyXG4gICAgICByZW1haW5JbWdzLmZvckVhY2gocmVtYWluSW1nID0+IHtcclxuICAgICAgICByZW1haW5JbWcuYWRkZWROb2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xyXG4gICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IDEpIHJldHVybjsgIC8vIGVsZW1lbnTrp4wg7LKY66asXHJcbiAgICAgICAgICBpZiAobm9kZS50YWdOYW1lID09PSAnSU1HJykge1xyXG5cclxuICAgICAgICAgICAgaWYgKCFub2RlLmRhdGFzZXQuaW1nSWQpIHtcclxuICAgICAgICAgICAgICB0aGlzLmltZ0lkTGlzdC5wdXNoKGNyZWF0ZVJhbmRvbUltZ0lEKG5vZGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHJldHVybjtcclxuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgbm9kZS5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5mb3JFYWNoKGltZyA9PiB7XHJcbiAgICAgICAgICAgICAgaWYgKCFpbWcuZGF0YXNldC5pbWdJZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbWdJZExpc3QucHVzaChjcmVhdGVSYW5kb21JbWdJRChpbWcpKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuICAgIC8vIGlmKGRhdGFCdWZmZXIubGVuZ3RoPjApe1xyXG4gICAgLy8gICBjb25zb2xlLmxvZyhkYXRhQnVmZmVyLmxlbmd0aCk7XHJcbiAgICAvLyAgIGRhdGFCdWZmZXIuZm9yRWFjaChpdGVtID0+IHtcclxuICAgIC8vICAgICBjb25zdCBpZCA9IGl0ZW0uaWQ7XHJcbiAgICAvLyAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW2RhdGEtaW1nLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgIC8vICAgICBpZiAoaW1nKSB7XHJcbiAgICAvLyAgICAgICBpbWcuZGF0YXNldC5tYXNraW5nID0gXCJOb25lXCI7XHJcbiAgICAvLyAgICAgfVxyXG5cclxuICAgIC8vICAgfSk7XHJcbiAgICAvLyB9XHJcbiAgfVxyXG5cclxuICByZWNvbm5lY3RPYmVzZXJ2ZXIoKSB7XHJcblxyXG4gICAgdGhpcy5Jc09ic3ZBY3RpdmUgPSB0cnVlO1xyXG4gICAgdGhpcy5pbWdPYnNlcnZlKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuaW1nSWRMaXN0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5pbWdJZExpc3QuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW2RhdGEtaW1nLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgICAgICBpZiAoaW1nKSB7XHJcbiAgICAgICAgICBpbWcuZGF0YXNldC5tYXNraW5nID0gXCJpbWdNYXNraW5nXCI7XHJcbiAgICAgICAgICB0aGlzLmltZ1ZpZXdPYnNlcnZlci5vYnNlcnZlKGltZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gICAgaWYgKGRhdGFCdWZmZXIubGVuZ3RoID4gMCkge1xyXG4gICAgICBkYXRhQnVmZmVyLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW2RhdGEtaW1nLWlkPVwiJHtpdGVtLmlkfVwiXWApO1xyXG4gICAgICAgIGlmIChpbWcpIGltZy5kYXRhc2V0Lm1hc2tpbmcgPSBcImltZ01hc2tpbmdcIjtcclxuICAgICAgICBtYXliZUZsdXNoKCk7XHJcblxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGNvbnNvbGUubG9nKFwib2JzZXJ2ZXIgcmVjb25uZWN0ZWRcIik7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuY29uc3QgSU1HT2JzID0gbmV3IGltYWdlT2JzZXJ2ZXJzKCk7XHJcbmV4cG9ydCBkZWZhdWx0IElNR09iczsiLCIvL+y9mO2FkOy4oCDsiqTtgazrpr3tirjsl5DshJwg7IKs7Jqp7ZWY64qUIHV0aWxzXHJcblxyXG5cclxuY29uc3QgaGFybWZ1bEltZ01hcmsgPSBjaHJvbWUucnVudGltZS5nZXRVUkwoJ2ljb25zL21haW5faWNvbi5wbmcnKTtcclxuZXhwb3J0IGZ1bmN0aW9uIGNoYW5nZUltZyhpbWcsIGZsYWcpIHtcclxuICAgIGlmIChmbGFnKSB7XHJcbiAgICAgICAgaW1nLnNyYyA9IGhhcm1mdWxJbWdNYXJrO1xyXG4gICAgICAgIGltZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnd2hpdGUnO1xyXG4gICAgICAgIGltZy5zdHlsZS5vYmplY3RGaXQgPSAnY29udGFpbic7XHJcbiAgICAgICAgaW1nLnN0eWxlLm9iamVjdFBvc2l0aW9uID0gJ2NlbnRlcic7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpbWcuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyc7XHJcbiAgICAgICAgaW1nLnN0eWxlLm9iamVjdEZpdCA9ICcnO1xyXG4gICAgICAgIGltZy5zdHlsZS5vYmplY3RQb3NpdGlvbiA9ICcnO1xyXG4gICAgICAgIGltZy5zcmMgPSBpbWcuZGF0YXNldC5vcmlnaW5hbFNyYztcclxuXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuLyoqLlxyXG4gKiBAcGFyYW0ge2h0bWxJbWdFbGVtZW50fSBpbWcgLSBkb20g7J2066+47KeAIOqwneyytFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJhbmRvbUltZ0lEKGltZykge1xyXG4gICAgY29uc3QgSUQgPSBjcnlwdG8ucmFuZG9tVVVJRCgpO1xyXG4gICAgaW1nLmRhdGFzZXQuaW1nSWQgPSBJRDtcclxuICAgIHJldHVybiBJRDtcclxufVxyXG5cclxuXHJcbiAgIiwiaW1wb3J0IHsgdHJhY2tBbmRSZXBsYWNlSW1nIH0gZnJvbSBcIi4vdHJhY2tBbmRSZXBsYWNlSW1nXCI7XHJcbmltcG9ydCB7IHRlcm1pbmF0ZUNvbnRlbnRTY3JpcHQgfSBmcm9tIFwiLi90ZXJtaW5hdGVcIjtcclxuaW1wb3J0IGRhdGFCdWZmZXIgZnJvbSBcIi4uL2dsb2JhbC9idWZmZXJcIjtcclxuaW1wb3J0IHsgZ2V0SW50ZXJjZXB0b3JBY3RpdmUgfSBmcm9tIFwiLi4vZ2xvYmFsL2NvbnRlbnRDb25maWdcIjtcclxuXHJcblxyXG5jb25zdCBNQVhfTiA9IDE2LCBJRExFID0gMjAwO1xyXG5cclxubGV0IGlkbGVUID0gbnVsbDtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYXliZUZsdXNoKCkge1xyXG4gICAgaWYgKGRhdGFCdWZmZXIubGVuZ3RoID49IE1BWF9OKSBGbHVzaCgpO1xyXG4gICAgY2xlYXJUaW1lb3V0KGlkbGVUKTtcclxuICAgIGlkbGVUID0gc2V0VGltZW91dChGbHVzaCwgSURMRSk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBGbHVzaCgpIHtcclxuICAgIGlmICghZGF0YUJ1ZmZlci5sZW5ndGggfHwgIWdldEludGVyY2VwdG9yQWN0aXZlKCkpIHJldHVybjtcclxuICAgIGlmICghY2hyb21lPy5ydW50aW1lKSB7XHJcbiAgICAgICAgLy/tlajsiJgg7Zi47LacP1xyXG4gICAgICAgIHRlcm1pbmF0ZUNvbnRlbnRTY3JpcHQoJ2NhbiBub3QgdXNlIGNocm9tZS5ydW50aW1lIGFueW1vcmUuIGV4dGVuc2lvbiBtYXkgYmUgcmVsb2FkZWQgb3IgZGlzYWJsZWQnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGJhdGNoRnJvbUNvbnRlbnRTY3JpcHQgPSBkYXRhQnVmZmVyLnNwbGljZSgwLCBkYXRhQnVmZmVyLmxlbmd0aCkuZmlsdGVyKGl0ZW0gPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgaW1nW2RhdGEtaW1nLWlkPVwiJHtpdGVtLmlkfVwiXWApKTsgLy8gMOu2gO2EsCBkYXRhQnVmZmVyLmxlbmd0aOuyiOynuCDsnbjrjbHsiqQo7KCE7LK0KeulvCDrs7XsgqztlZwg6rCd7LK0IOuwmO2ZmCAmIO2VtOuLuSDtgazquLDrp4ztgbwg6riw7KG0IOqwneyytCDrgrQg7JuQ7IaMIOyCreygnCAtPiAw7Jy866GcIOy0iOq4sO2ZlFxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICBzb3VyY2U6IFwiY29udGVudFwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImltZ0RhdGFGcm9tQ29udGVudFNjcmlwdFwiLFxyXG4gICAgICAgICAgICBkYXRhOiBiYXRjaEZyb21Db250ZW50U2NyaXB0LCAvLyAyMOqwnOunjCDrs7TrgrTqs6AsIOuwsOyXtOydgCDsnpDrj5nsnLzroZwg67mE7JuAXHJcbiAgICAgICAgfSxcclxuICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBjaHJvbWUucnVudGltZS5sYXN0RXJyb3I7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaHJvbWUucnVudGltZSDrqZTshLjsp4Ag7Iah7Iug7J20IOu2iOqwgOuKpe2VqeuLiOuLpC4gZXh0ZW5zaW9u7J2EIOyDiOuhnOqzoOy5qO2VmOyYgOydhCDqsIDriqXshLHsnbQg64aS7Iq164uI64ukJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInNlcnZpY2Ugd29ya2VyIOyGoeyLoDpcIiArIGJhdGNoRnJvbUNvbnRlbnRTY3JpcHQubGVuZ3RoICsgXCItLS0tLS0tLS0tLS0tLVwiICsgXCLsiJjsi6BcIiArIHJlc3BvbnNlLmRhdGEubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHRyYWNrQW5kUmVwbGFjZUltZyhyZXNwb25zZSk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIHRlcm1pbmF0ZUNvbnRlbnRTY3JpcHQoZS5tZXNzYWdlKTtcclxuICAgIH1cclxufVxyXG5cclxuIiwiaW1wb3J0IElNR09icyBmcm9tIFwiLi4vbW9kdWxlcy9pbWdPYnNcIjtcclxuaW1wb3J0IHsgc2V0SW50ZXJjZXB0b3JBY3RpdmUgfSBmcm9tIFwiLi4vZ2xvYmFsL2NvbnRlbnRDb25maWdcIjtcclxuXHJcbi8qKlxyXG4gKiBcclxuICogQHBhcmFtIHtlcnJ9IGVyck1lc3NhZ2UgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdGVybWluYXRlQ29udGVudFNjcmlwdChlcnJNZXNzYWdlKSB7XHJcbiAgICBpZiAoL0V4dGVuc2lvbiBjb250ZXh0IGludmFsaWRhdGVkL2kudGVzdChlcnJNZXNzYWdlKSkgY29uc29sZS5lcnJvcihcIiBleHRlbnNpb24gbWF5IGJlIHJlbG9hZGVkIG9yIGRpc2FibGVkLiBzbyB0aGlzIGNvbnRlbnRzY3JpcHQgY2FuIG5vIGxvbmdlciBiZSBvcGVyYXRlZCBhbmQgd2lsbCBiZSB0ZXJtYWluYXRlZFwiKTtcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCIhdGVybWluYXRlQ29udGVudFNjcmlwdCBiZWNhb3VzZSB0aGlzIEVycm9yOiBcIiwgZXJyTWVzc2FnZSwgXCIgIVwiKTtcclxuICAgIH1cclxuICAgIGlmIChJTUdPYnMpIHtcclxuICAgICAgICBJTUdPYnMuZGlzY29ubnRlY3RPYmVzZXJ2ZXIoKTtcclxuICAgICAgICBzZXRJbnRlcmNlcHRvckFjdGl2ZShmYWxzZSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJwcm9ncmFtIG9mZlwiKTtcclxuICAgIH1cclxufVxyXG5cclxuIiwiaW1wb3J0IHtjaGFuZ2VJbWd9IGZyb20gJy4vY29udGVudFV0aWxzLmpzJztcclxuaW1wb3J0IHtnZXRQZXJtaXNzaW9uRm9yTWFza2luZ30gZnJvbSAnLi4vZ2xvYmFsL2NvbnRlbnRDb25maWcuanMnO1xyXG5cclxuXHJcbmxldCBBTExyZW1vdmVGYWxzZSA9IDA7XHJcbmxldCBBTExyZW1vdmVUcnVlID0gMDtcclxuZXhwb3J0IGZ1bmN0aW9uIHRyYWNrQW5kUmVwbGFjZUltZyhyZXNwb25zZUZyb21TVykge1xyXG5cclxuXHJcbiAgICBjb25zdCByZXNwb25zZUJhdGNoID0gcmVzcG9uc2VGcm9tU1cuZGF0YTsgLy8g67Cw7Je0IFt7IGlkLCB1cmwsIC4uLiB9LCAuLi5dXHJcbiAgICBsZXQgcmVtb3ZlRmFsc2UgPSAwO1xyXG4gICAgbGV0IHJlbW92ZVRydWUgPSAwO1xyXG4gICAgbGV0IHRvdGFsU3RhdHVzID0gMDtcclxuICAgIGxldCBzdWNjZWVkU3RhdHVzID0gMDtcclxuICAgIGxldCBpc0hhcm1mdWwgPSAwO1xyXG5cclxuICAgIHJlc3BvbnNlQmF0Y2guZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICB0b3RhbFN0YXR1cysrO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhcImlkOiBcIiArIGl0ZW0uaWQpO1xyXG4gICAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoaXRlbS5zdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgIHN1Y2NlZWRTdGF0dXMrKztcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9iamVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGltZ1tkYXRhLWltZy1pZD1cIiR7aXRlbS5pZH1cIl1gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5oYXJtZnVsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlVHJ1ZSsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvYmplY3Quc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3Zpc2liaWxpdHknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0LnN0eWxlLnJlbW92ZVByb3BlcnR5KCdvcGFjaXR5Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuycoO2VtCDsnbTrr7jsp4A6IFwiICsgaXRlbS51cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL29iamVjdC5zdHlsZS5ib3JkZXIgPSBcIjhweCBzb2xpZCByZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmRhdGFzZXQub3JpZ2luYWxTcmMgPSBvYmplY3Quc3JjO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0UGVybWlzc2lvbkZvck1hc2tpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlSW1nKG9iamVjdCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBteUltYWdlLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICd3aGl0ZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBteUltYWdlLnN0eWxlLm9iamVjdEZpdCA9ICdjb250YWluJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGltYWdlRWxlbWVudC5zdHlsZS5vYmplY3RQb3NpdGlvbiA9ICdjZW50ZXInOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5zcmMgPSBoYXJtZnVsSW1nTWFyaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5jbGFzc0xpc3QucmVtb3ZlKCdpbWdNYXNraW5nJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuZGF0YXNldC5tYXNraW5nID0gXCJOb25lXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuZGF0YXNldC50eXBlICs9IFwiIEhhcm1mdWxcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVGYWxzZSA9IHJlbW92ZUZhbHNlICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLsi6TtjKggaWQ6IFwiICsgaXRlbS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpc0hhcm1mdWwrKztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuXHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVUcnVlKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndmlzaWJpbGl0eScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvYmplY3Quc3R5bGUucmVtb3ZlUHJvcGVydHkoJ29wYWNpdHknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5jbGFzc0xpc3QucmVtb3ZlKCdpbWdNYXNraW5nJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuZGF0YXNldC5tYXNraW5nID0gXCJOb25lXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuyEseqztSBpZDogXCIgKyBpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9vYmplY3Quc3R5bGUuYm9yZGVyID0gXCI4cHggc29saWQgYmx1ZVwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZhbHNlID0gcmVtb3ZlRmFsc2UgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuyLpO2MqCBpZDogXCIgKyBpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBvYmplY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBpbWdbZGF0YS1pbWctaWQ9XCIke2l0ZW0uaWR9XCJdYCk7XHJcbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlVHJ1ZSsrO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndmlzaWJpbGl0eScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnb3BhY2l0eScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBvYmplY3QuZGF0YXNldC5tYXNraW5nID0gXCJOb25lXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIG9iamVjdC5jbGFzc0xpc3QucmVtb3ZlKCdpbWdNYXNraW5nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLshLHqs7UgaWQ6IFwiICsgaXRlbS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9vYmplY3Quc3R5bGUuYm9yZGVyID0gXCI4cHggc29saWQgYmx1ZVwiO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUZhbHNlID0gcmVtb3ZlRmFsc2UgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi7Iuk7YyoIGlkOiBcIiArIGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCLsnZHri7Ug642w7J207YSwIOuniOyKpO2CuSDtlbTsoJwg7KSR7JeQIOyYpOulmCDrsJzsg506IFwiICsgZS5tZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICApO1xyXG4gICAgQUxMcmVtb3ZlRmFsc2UgKz0gcmVtb3ZlRmFsc2U7XHJcbiAgICBBTExyZW1vdmVUcnVlICs9IHJlbW92ZVRydWU7XHJcbiAgICBjb25zb2xlLmxvZyhg7ISc67mE7IqkIOybjOy7pCDsnZHri7Ug7J2066+47KeAIOqysOqzvDogJHt0b3RhbFN0YXR1c30vJHtzdWNjZWVkU3RhdHVzfS8keyh0b3RhbFN0YXR1cyAtIHN1Y2NlZWRTdGF0dXMpfS8ke2lzSGFybWZ1bH1b7LSd7ZWpL+ydtOuvuOyngCDrtoTshJ0g7ISx6rO1L+ydtOuvuOyngCDrtoTshJ0g7Iuk7YyoL+ycoO2VtOydtOuvuOyngF1gKTtcclxuICAgIGNvbnNvbGUubG9nKGDrp4jsiqTtgrkg7ZW07KCcIOqysOqzvDogJHt0b3RhbFN0YXR1c30vJHtyZW1vdmVUcnVlfS8ke3JlbW92ZUZhbHNlfS8ke2lzSGFybWZ1bH1b7LSd7ZWpL+yEseqztS/si6TtjKgv7Jyg7ZW07J2066+47KeAXWApO1xyXG4gICAgY29uc29sZS5sb2coYOuIhOyggSDtlanqs4Q6ICR7QUxMcmVtb3ZlVHJ1ZX0vJHtBTExyZW1vdmVGYWxzZX0vJHsoQUxMcmVtb3ZlVHJ1ZSArIEFMTHJlbW92ZUZhbHNlKX1b64iE7KCBIOyEseqztS/riITsoIEg7Iuk7YyoL+y0nSDriITsoIEg7ZWpXSB8IOyEseqzteuloDogJHsoQUxMcmVtb3ZlVHJ1ZSAvIChBTExyZW1vdmVGYWxzZSArIEFMTHJlbW92ZVRydWUpKS50b0ZpeGVkKDIpfWApO1xyXG5cclxufVxyXG4iLCIvLyB1cmxfZmlsdGVyTW9kdWxlX2Jhc2VkX3NhZmVfcGF0dGVybi5qcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcclxuLy9kYXRhIHVybChiYXNlNjQpLCBibG9iIGRhdGEsIHVybCDrgZ3sl5Ag67aZ64qUIO2ZleyepeyekCwgQ1NTIOyKpO2UhOudvOydtO2KuFxyXG5jb25zdCBwcm90b0RhdGEgICA9IG5ldyBVUkxQYXR0ZXJuKHsgcHJvdG9jb2w6ICdkYXRhJyAgIH0pO1xyXG5jb25zdCBwcm90b0Jsb2IgICA9IG5ldyBVUkxQYXR0ZXJuKHsgcHJvdG9jb2w6ICdibG9iJyAgIH0pO1xyXG5jb25zdCBleHRQYXR0ZXJuICA9IG5ldyBVUkxQYXR0ZXJuKHsgcGF0aG5hbWU6ICcvKi4gOmV4dChzdmd8c3ZnenxpY298Y3VyfHBuZyknIH0pO1xyXG5jb25zdCBzcHJpdGVQYXQgICA9IG5ldyBVUkxQYXR0ZXJuKHsgcGF0aG5hbWU6ICcqc3ByaXRlKi57YXZpZix3ZWJwfScgfSk7XHJcblxyXG4vL+2CpOybjOuTnFxyXG4vLyDsnKDtlbQg7J2066+47KeA6rCAIO2PrO2VqOuQoCDqsIDriqXshLHsnbQg64Ku7J2AIO2CpOybjOuTnFxyXG5jb25zdCBuYW1lUmVnZXggICA9IC8oPzpcXC98XikobG9nb3xmYXZpY29ufHNwcml0ZXxpY29ucz98YmFkZ2V8dHdlbW9qaXxmbGFnfGVtb2ppfHNwaW5uZXJ8bG9hZGluZ3xwbGFjZWhvbGRlcnxibGFua3x0cmFuc3BhcmVudHwxeDF8cGl4ZWx8c3BhY2VyfGFqYXgtbG9hZGVyKVtcXHdcXC0uXSpcXC4ocG5nfGdpZnxzdmd8aWNvfGN1cnx3ZWJwfGF2aWYpJC9pO1xyXG4vL+2KuOuemO2CuSDtlL3shYAv7JWg64SQ66as7Yux7IqkIC0gMXh4IO2BrOq4sOydmCBnaWbsnbwg7ZmV66Wg7J20IOuGkuydgCDtgqTsm4zrk5xcclxuY29uc3QgdHJhY2tSZWdleCAgPSAvKD86cGl4ZWx8dHJhY2t8b3BlbilcXC5naWYkL2k7XHJcbi8v7JWI7KCE7ZWcIOq0keqzoCDtgqTsm4zrk5xcclxuY29uc3QgYWRTYWZlUmVnZXggPSAvYWRzYWZlcHJvdGVjdGVkfGJyYW5kc2hpZWxkfGRvdWJsZWNsaWNrLipnc3RhdGljfGltYWdlY2FjaGVcXC9wcm90ZWN0L2k7XHJcblxyXG4vL+2ZlOydtO2KuOumrOyKpO2KuCDrj4TrqZTsnbggLSDslYTsnbTsvZgsIOyNuOuEpOydvCDrk7HsnYQg7KCc6rO17ZWY64qUIOuPhOuplOyduCDsoJzsmbhcclxuY29uc3QgV0hJVEVMSVNUID0gbmV3IFNldChbXHJcbiAgJ2dzdGF0aWMuY29tJywgJ3l0My5nZ3BodC5jb20nLFxyXG4gICd0d2Vtb2ppLm1heGNkbi5jb20nLCAnY2RuanMuY2xvdWRmbGFyZS5jb20nLCAnd3d3LmdyYXZhdGFyLmNvbScsXHJcbl0pO1xyXG5cclxuXHJcbi8qIOyKpO2CtCAmIO2ZleyepeyekCDqsoDsgqwg7ZWo7IiYLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5mdW5jdGlvbiBtYXRjaFByb3RvY29sT3JFeHQodSkge1xyXG4gIHJldHVybiBwcm90b0RhdGEudGVzdCh1KSB8fCBwcm90b0Jsb2IudGVzdCh1KSB8fFxyXG4gICAgICAgICBleHRQYXR0ZXJuLnRlc3QodSkgfHwgc3ByaXRlUGF0LnRlc3QodSk7XHJcbn1cclxuXHJcbi8qIOKdtyDtgqTsm4zrk5wg6rKA7IKsIO2VqOyImCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbmZ1bmN0aW9uIG1hdGNoS2V5d29yZCh1KSB7XHJcbiAgcmV0dXJuIG5hbWVSZWdleC50ZXN0KHUucGF0aG5hbWUpO1xyXG59XHJcblxyXG4vKiDinbgg7J6R6rKMIOuqheyLnOuQnCDsv7zrpqwg7YyM652866+47YSwICjiiaQ2NCnquLDrsJgg6rKA7IKsIO2VqOyImCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5mdW5jdGlvbiBtYXRjaFRpbnlTaXplKHUpIHtcclxuICByZXR1cm4gWyd3JywnaCcsJ3dpZHRoJywnaGVpZ2h0Jywnc2l6ZScsJ3MnLCdxdWFsaXR5JywncSddXHJcbiAgICAuc29tZShrID0+IHtcclxuICAgICAgY29uc3QgdiA9IHBhcnNlSW50KHUuc2VhcmNoUGFyYW1zLmdldChrKSwgMTApO1xyXG4gICAgICByZXR1cm4gIU51bWJlci5pc05hTih2KSAmJiB2IDw9IDY0O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qIO2ZlOydtO2KuOumrOyKpO2KuCBDRE4g6rKA7IKsIO2VqOyImCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXHJcbmZ1bmN0aW9uIG1hdGNoV2hpdGVsaXN0KHUpIHtcclxuICBjb25zdCBob3N0ID0gdS5ob3N0bmFtZS5yZXBsYWNlKC9ed3d3XFwuLywgJycpO1xyXG4gIHJldHVybiBbLi4uV0hJVEVMSVNUXS5zb21lKGggPT4gaG9zdCA9PT0gaCB8fCBob3N0LmVuZHNXaXRoKGAuJHtofWApKTtcclxufVxyXG5cclxuLyog4p26IO2KuOuemO2CuSDtlL3shYAgJiDslYjsoITtlZwg6rSR6rOgIOqygOyCrCDtlajsiJggLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuZnVuY3Rpb24gbWF0Y2hUcmFja2luZyh1KSB7IHJldHVybiB0cmFja1JlZ2V4LnRlc3QodS5wYXRobmFtZSk7IH1cclxuZnVuY3Rpb24gbWF0Y2hBZFNhZmUgKHUpIHsgcmV0dXJuIGFkU2FmZVJlZ2V4LnRlc3QodS5ocmVmKTsgICAgfVxyXG5cclxuLyog6rec7LmZIOqygOyCrOulvCDsnITtlZwg7ZWo7IiYIOuqqOydjCAo7ZWo7IiYIOybkO2YlSDrsLDsl7QpIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cclxuZXhwb3J0IGNvbnN0IFNBRkVfUlVMRVMgPSBbXHJcbiAgbWF0Y2hQcm90b2NvbE9yRXh0LFxyXG4gIG1hdGNoS2V5d29yZCxcclxuICBtYXRjaFRpbnlTaXplLFxyXG4gIG1hdGNoV2hpdGVsaXN0LFxyXG4gIG1hdGNoVHJhY2tpbmcsXHJcbiAgbWF0Y2hBZFNhZmUsXHJcbl07XHJcblxyXG4vKiDinbwg64uo7J28IO2XrO2NvCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyX2Jhc2VkX3NhZmVVcmxQYXR0ZXJuKHVybCkge1xyXG4gIGxldCByZXN1bHQ7XHJcbiAgdHJ5e1xyXG4gICByZXN1bHQgPSBTQUZFX1JVTEVTLnNvbWUoZm4gPT4gZm4odXJsKSk7XHJcbiAgfSBjYXRjaChlKSB7XHJcbiAgICBjb25zb2xlKFwi67mE7Jyg7ZW0IOydtOuvuOyngCDtlYTthLDrp4Eg7KSRIOyYpOulmCDrsJzsg50sIHVybDogXCIsIHVybCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyB0cmFja0FuZFJlcGxhY2VJbWcgfSBmcm9tIFwiLi91dGlscy90cmFja0FuZFJlcGxhY2VJbWcuanNcIjtcclxuaW1wb3J0IHsgY2hhbmdlSW1nLCBjcmVhdGVSYW5kb21JbWdJRH0gZnJvbSAnLi91dGlscy9jb250ZW50VXRpbHMuanMnO1xyXG5pbXBvcnQgSU1HT2JzICBmcm9tIFwiLi9tb2R1bGVzL2ltZ09icy5qc1wiO1xyXG5pbXBvcnQgeyBzZXRQZXJtaXNzaW9uRm9yTWFza2luZywgc2V0SW50ZXJjZXB0b3JBY3RpdmUsIGdldEludGVyY2VwdG9yQWN0aXZlIH0gZnJvbSAnLi9nbG9iYWwvY29udGVudENvbmZpZy5qcyc7XHJcbmltcG9ydCBkYXRhQnVmZmVyIGZyb20gJy4vZ2xvYmFsL2J1ZmZlci5qcyc7XHJcblxyXG5cclxubGV0IHRlc3RjbnQgPSAwO1xyXG5sZXQgY2xpY2tlZEltZyA9IG51bGw7XHJcblxyXG4vL2RvbSDroZzrk5wg7JmE66OM6rmM7KeAIOyYpOuyhOugiOydtCDsgr3snoUsIOycoOyngFxyXG5pZiAod2luZG93LnRvcCA9PT0gd2luZG93LnNlbGYpIHtcclxuICBjb25zdCBvdmVybGF5RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgb3ZlcmxheURpdi5pZCA9ICdleHRlbnNpb25PdmVybGF5JztcclxuICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQob3ZlcmxheURpdik7IC8vIGh0bWwg67CU66GcIOyVhOuemOyXkCDstpTqsIBcclxuICB3aW5kb3cucGFnZU92ZXJsYXkgPSBvdmVybGF5RGl2O1xyXG59XHJcblxyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG5mdW5jdGlvbiBDb2xsZWN0X3N0YXRpY0ltZygpIHtcclxuICBjb25zdCBzdGF0aWNJbWdzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW1nJyk7XHJcbiAgY29uc29sZS5sb2coXCLsoJXsoIHtjIzsnbwg7ZWpXCIgKyBzdGF0aWNJbWdzLmxlbmd0aCk7XHJcblxyXG4gIHN0YXRpY0ltZ3MuZm9yRWFjaChpbWcgPT4ge1xyXG4gICAgY29uc3QgY3VycmVudEltZyA9IGltZzsgLy8gJ3RoaXMnIOy7qO2FjeyKpO2KuCDrrLjsoJwg7ZW06rKw7J2EIOychO2VnCDsuqHssphcclxuICAgIGlmICghY3VycmVudEltZy5kYXRhc2V0LmltZ0lkKSB7XHJcbiAgICAgIGN1cnJlbnRJbWcuZGF0YXNldC5tYXNraW5nID0gJ2ltZ01hc2tpbmcnO1xyXG4gICAgICAvLyBjdXJyZW50SW1nLmNsYXNzTGlzdC5hZGQoJ2ltZ01hc2tpbmcnKTtcclxuICAgICAgY3JlYXRlUmFuZG9tSW1nSUQoY3VycmVudEltZyk7XHJcbiAgICAgIElNR09icy5pbWdWaWV3T2JzZXJ2ZXIub2JzZXJ2ZShjdXJyZW50SW1nKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pXHJcblxyXG59XHJcblxyXG5cclxuLy/snbTrsqTtirgg66as7Iqk64SI7JqpIO2VqOyImFxyXG5mdW5jdGlvbiBzdG9wT3JTdGFySW1nc01hc2tpbmcoZmxhZykge1xyXG4gIGNvbnNvbGUubG9nKFwiZmlsdGVyc3RhdHVzXCIgKyBmbGFnKTtcclxuICBpZiAoIWZsYWcpIHtcclxuICAgIGNvbnN0IG1hc2tlZEltZ3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBpbWdbZGF0YS1tYXNraW5nPVwiaW1nTWFza2luZ1wiXWApO1xyXG4gICAgY29uc29sZS5sb2cobWFza2VkSW1ncy5sZW5ndGgpO1xyXG4gICAgbWFza2VkSW1ncy5mb3JFYWNoKGltZyA9PiB7XHJcbiAgICAgIGltZy5kYXRhc2V0Lm1hc2tpbmcgPSBcIk5vbmVcIjtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBjb25zdCBoYXJtZnVsSW1ncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXR5cGUqPVwiSGFybWZ1bFwiXScpO1xyXG4gICAgY29uc29sZS5sb2coaGFybWZ1bEltZ3MubGVuZ3RoKTtcclxuICAgIGhhcm1mdWxJbWdzLmZvckVhY2goaW1nID0+IHtcclxuICAgICAgY2hhbmdlSW1nKGltZywgZmFsc2UpO1xyXG4gICAgICAvL2ltZy5zcmMgPSBpbWcuZGF0YXNldC5vcmlnaW5hbFNyYztcclxuICAgIH0pO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGNvbnN0IGhhcm1mdWxJbWdzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdHlwZSo9XCJIYXJtZnVsXCJdJyk7XHJcbiAgICBoYXJtZnVsSW1ncy5mb3JFYWNoKGltZyA9PiB7XHJcbiAgICAgIC8vaW1nLnNyYyA9IGhhcm1mdWxJbWdNYXJrO1xyXG4gICAgICBjaGFuZ2VJbWcoaW1nLCB0cnVlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIElNR09icy5pbWdJZExpc3QuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgIGNvbnN0IHdhaXRpbmdJbWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBpbWdbZGF0YS1pbWctaWQ9XCIke2lkfVwiXWApO1xyXG4gICAgICBpZiAod2FpdGluZ0ltZykgd2FpdGluZ0ltZy5kYXRhc2V0Lm1hc2tpbmcgPSBcImltZ01hc2tpbmdcIjtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChkYXRhQnVmZmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgZGF0YUJ1ZmZlci5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGNvbnN0IGltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGltZ1tkYXRhLWltZy1pZD1cIiR7aXRlbS5pZH1cIl1gKTtcclxuICAgICAgICBpZiAoaW1nKSBpbWcuZGF0YXNldC5tYXNraW5nID0gXCJpbWdNYXNraW5nXCI7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbnRyb2xDbGlja2VkSW1nKGlzU2hvdykge1xyXG5cclxuICBpZiAoY2xpY2tlZEltZyA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICBpZiAoaXNTaG93KSB7XHJcbiAgICBjbGlja2VkSW1nLmRhdGFzZXQubWFza2luZyA9IFwiTm9uZVwiO1xyXG4gICAgY2hhbmdlSW1nKGNsaWNrZWRJbWcsIGZhbHNlKTtcclxuICAgIC8vY2xpY2tlZEltZy5zcmMgPSBjbGlja2VkSW1nLmRhdGFzZXQub3JpZ2luYWxTcmM7XHJcbiAgICAvL2hhcm1mdWzsnYQg7JeG7JWg7JW8IO2VqFxyXG4gICAgaWYgKGNsaWNrZWRJbWcuZGF0YXNldC50eXBlLmluY2x1ZGVzKCdIYXJtZnVsJykpIGNsaWNrZWRJbWcuZGF0YXNldC50eXBlID0gY2xpY2tlZEltZy5kYXRhc2V0LnR5cGUucmVwbGFjZSgnSGFybWZ1bCcsICcnKS50cmltKCk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgY2xpY2tlZEltZy5kYXRhc2V0Lm1hc2tpbmcgPSBcIk5vbmVcIjtcclxuICAgIGNsaWNrZWRJbWcuZGF0YXNldC5vcmlnaW5hbFNyYyA9IGNsaWNrZWRJbWcuc3JjO1xyXG4gICAgaWYgKCFjbGlja2VkSW1nLmRhdGFzZXQudHlwZS5pbmNsdWRlcygnSGFybWZ1bCcpKSBjbGlja2VkSW1nLmRhdGFzZXQudHlwZSArPSBcIiBIYXJtZnVsXCI7XHJcbiAgICBjaGFuZ2VJbWcoY2xpY2tlZEltZywgdHJ1ZSk7XHJcbiAgICAvL2NsaWNrZWRJbWcuc3JjID0gaGFybWZ1bEltZ01hcms7XHJcbiAgfVxyXG5cclxuICBjbGlja2VkSW1nID09PSBudWxsO1xyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcbi8vLy9cclxuXHJcblxyXG4vL2RvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBwYWdlSW5pdCgpKTtcclxuaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBwYWdlSW5pdCk7XHJcbn1cclxuZWxzZSB7XHJcbiAgcGFnZUluaXQoKTtcclxufVxyXG5cclxuXHJcbi8v7LSI6riw7ZmUIO2VqOyImFxyXG5hc3luYyBmdW5jdGlvbiBwYWdlSW5pdCgpIHtcclxuXHJcbiAgbGV0IGlzSW5CbGFja0xpc3QgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBzb3VyY2U6IFwiY29udGVudFwiLCB0eXBlOiBcImNoZWNrX2JsYWNrX2xpc3RcIiwgc2l0ZTogd2luZG93LmxvY2F0aW9uLm9yaWdpbiwgcGFnZTogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lIH0sXHJcbiAgICAgICAgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcclxuICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZS5yZXN1bHQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGNhdGNoKGUpe1xyXG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICByZXNvbHZlKGZhbHNlKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy/stIjquLDtmZQg7Iuc7J6RLy9cclxuICBpZiAoIWlzSW5CbGFja0xpc3QpIHtcclxuICAgIGNvbnNvbGUubG9nKFwi67iU656Z66as7Iqk7Yq47JeQIOyXhuuKlCDsgqzsnbTtirgsIOyEpOyglSDsvZTrk5wg7Iuk7ZaJXCIpO1xyXG5cclxuICAgIGNvbnN0IHJlZ2lzdGVyUmVzdWx0ID0gYXdhaXQgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBzb3VyY2U6IFwiY29udGVudFwiLHR5cGU6IFwicmVnaXN0ZXJfZnJhbWVcIiB9KTtcclxuICAgIGlmICghcmVnaXN0ZXJSZXN1bHQub2spIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcImNhbiBub3QgcmVnaXN0ZXIgZnJhbWUgdG8gc2VydmljZSB3b3JrZXJcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzdG9yZWRGaWx0ZXJTdGF0dXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydmaWx0ZXJTdGF0dXMnXSk7XHJcbiAgICBsZXQgaXNGaWx0ZXJpbmdPbiA9IHN0b3JlZEZpbHRlclN0YXR1cy5maWx0ZXJTdGF0dXM7XHJcbiAgICBpZiAoaXNGaWx0ZXJpbmdPbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJTdGF0dXMnOiB0cnVlIH0pO1xyXG4gICAgICBpc0ZpbHRlcmluZ09uID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHNldFBlcm1pc3Npb25Gb3JNYXNraW5nKGlzRmlsdGVyaW5nT24pO1xyXG5cclxuICAgIGNvbnN0IHN0b3JlZEludGVyY2VwdG9yU3RhdHVzID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnaW50ZXJjZXB0b3JTdGF0dXMnXSk7XHJcbiAgICBsZXQgc2F2ZWRTdGF0dXMgPSBzdG9yZWRJbnRlcmNlcHRvclN0YXR1cy5pbnRlcmNlcHRvclN0YXR1cztcclxuICAgIGlmIChzYXZlZFN0YXR1cyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdpbnRlcmNlcHRvclN0YXR1cyc6IDEgfSk7XHJcbiAgICAgIHNhdmVkU3RhdHVzID0gMTtcclxuICAgIH1cclxuICAgIHNldEludGVyY2VwdG9yQWN0aXZlKHNhdmVkU3RhdHVzID09PSAxID8gdHJ1ZSA6IGZhbHNlKTtcclxuXHJcblxyXG4gICAgc2V0RW52ZW50TGlzdGVycygpO1xyXG5cclxuXHJcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPSBcImxvYWRpbmdcIikge1xyXG4gICAgICBpZiAoZ2V0SW50ZXJjZXB0b3JBY3RpdmUoKSkge1xyXG4gICAgICAgIElNR09icy5pbWdPYnNlcnZlKCk7XHJcbiAgICAgICAgQ29sbGVjdF9zdGF0aWNJbWcoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICB9XHJcbiAgaWYgKHdpbmRvdy50b3AgPT09IHdpbmRvdy5zZWxmKSB7XHJcbiAgICBjb25zdCBvdmVybGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4dGVuc2lvbk92ZXJsYXknKTtcclxuICAgIGlmIChvdmVybGF5KSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwib3ZlcmF5IHJlbW92ZSBzdGFydHNcIik7XHJcblxyXG4gICAgICBvdmVybGF5LmNsYXNzTGlzdC5hZGQoJ2ZhZGUtb3V0Jyk7XHJcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xyXG4gICAgICAgIG92ZXJsYXkucmVtb3ZlKCk7Ly8gRE9N7JeQ7IScIOygnOqxsO2VmOyXrCDsmYTsoITtlZjqsowg7IKs65287KeA6rKMIO2VqFxyXG4gICAgICAgIC8vIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwib3ZlcmF5IHJlbW92ZWRcIik7XHJcbiAgICAgIH0sIDU1MCk7IC8vNTAwbXMoMC417LSIKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn1cclxuXHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIHNldEVudmVudExpc3RlcnMoKSB7XHJcblxyXG4gIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiaW1nRGF0YVdhaXRpbmdGcm9tU2VydmljZVdvcmtcIikge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIuyEnOu5hOyKpOybjOy7pOyXkOyEnCDrjIDquLDtlZjrjZgg642w7J207YSw6rCAIOuTpOyWtOyZlOyKteuLiOuLpFwiKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcInNlcnZpY2Ugd29ya+yXkOyEnCDshJzrsoTsnZgg7Jyg7ZW0IOydtOuvuOyngCDrtoTshJ0g6rKw6rO866W8IOq4sOuLpOumrOuNmCBEYXRhOiBcIiArIG1lc3NhZ2UuZGF0YS5sZW5ndGgpO1xyXG5cclxuICAgICAgICB0cmFja0FuZFJlcGxhY2VJbWcobWVzc2FnZSk7XHJcblxyXG4gICAgICAgIHNlbmRSZXNwb25zZSh7XHJcbiAgICAgICAgICB0eXBlOiBcInJlc3BvbnNlXCIsXHJcbiAgICAgICAgICBvazogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBvY3VyclsgPXdoaWxlIGNvbmZpcm1pbmcgd2FpdGluZyBkYXRhIGZyb20gc2VydmljZSB3b3JrZXJdXCIsIGUpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuXHJcbiAgbGV0IGNvdW50ID0gMDtcclxuICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XHJcbiAgICBpZiAobWVzc2FnZS5zb3VyY2UgPT09ICdzZXJ2aWNlX3dvcmtlcicpIHtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcclxuICAgICAgICAgIGNhc2UgJ2FjdGl2ZV9pbnRlcmNlcHRvcic6XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlLmFjdGl2ZSk7XHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLmFjdGl2ZSkge1xyXG4gICAgICAgICAgICAgIElNR09icy5yZWNvbm5lY3RPYmVzZXJ2ZXIoKTtcclxuICAgICAgICAgICAgICBzZXRJbnRlcmNlcHRvckFjdGl2ZSh0cnVlKTtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInByb2dyYW0gb25cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgSU1HT2JzLmRpc2Nvbm50ZWN0T2Jlc2VydmVyKCk7XHJcbiAgICAgICAgICAgICAgc2V0SW50ZXJjZXB0b3JBY3RpdmUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicHJvZ3JhbSBvZmZcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IHRydWUsIG1lc3NhZ2U6IFwic3VjY2Vzc1wiIH0pO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcblxyXG4gICAgICAgICAgY2FzZSAnc2V0X2ZpbHRlcl9zdGF0dXMnOlxyXG4gICAgICAgICAgICAvL29ic2VydmVy6rCAIOykgOu5hOuQmOyXiOuKlOyngCDtmZXsnbjtlZjripQg7L2U65OcIOuCmOykkeyXkCDstpTqsIDtlbTslbwg7ZWoXHJcbiAgICAgICAgICAgIHNldFBlcm1pc3Npb25Gb3JNYXNraW5nKG1lc3NhZ2UuRmlsdGVyU3RhdHVzKTtcclxuICAgICAgICAgICAgc3RvcE9yU3RhckltZ3NNYXNraW5nKG1lc3NhZ2UuRmlsdGVyU3RhdHVzKTtcclxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgb2s6IHRydWUsIG1lc3NhZ2U6IFwic3VjY2Vzc1wiIH0pO1xyXG5cclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgY2FzZSAnY29udHJvbF9pbWcnOlxyXG4gICAgICAgICAgICBpZiAoIWdldEludGVyY2VwdG9yQWN0aXZlKCkpIHNlbmRSZXNwb25zZSh7IG9rOiBmYWxzZSwgbWVzc2FnZTogXCJpbnRlcmNlcHRvciBpcyBub3QgYWN0aXZlXCIgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb250cm9sQ2xpY2tlZEltZyhtZXNzYWdlLmlzU2hvdyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgICAgIGlmICghcmVzdWx0KSB0aHJvdyBuZXcgRXJyb3IoXCJjYW4gbm90IGNvbnRyb2wgc2luZ2xlIGltZyBtYXNraW5nXCIpO1xyXG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogdHJ1ZSwgbWVzc2FnZTogXCJzdWNjZXNzXCIgfSk7XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW4gbm90IHJlYWQgbWVzc2FnZSB0eXBlIGZyb20gc2VydmljZSB3b3JrZXJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICBzZW5kUmVzcG9uc2UoeyBvazogZmFsc2UsIG1lc3NhZ2U6IGUgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcblxyXG4gIC8v7Luo7YWN7Iqk7Yq4IOuplOuJtCDrhbjstpwvL1xyXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgaWYgKCFnZXRJbnRlcmNlcHRvckFjdGl2ZSgpKSByZXR1cm47XHJcblxyXG4gICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgLy8g7YOQ7IOJ7J2EIOychO2VnCDtgZDrpbwg7IOd7ISxXHJcbiAgICBjb25zdCBxdWV1ZSA9IFt0YXJnZXRdO1xyXG4gICAgY29uc3QgdmlzaXRlZCA9IG5ldyBTZXQoKTsgLy8g7KSR67O1IOuwqeusuCDrsKnsp4Drpbwg7JyE7ZWcIFNldFxyXG5cclxuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gcXVldWUuc2hpZnQoKTsgLy8g7YGQ7J2YIOunqCDslZ4g64W465OcXHJcblxyXG4gICAgICAvLyDsnbTrr7gg67Cp66y47ZWcIOuFuOuTnOuKlCDqsbTrhIjrnIBcclxuICAgICAgaWYgKHZpc2l0ZWQuaGFzKGN1cnJlbnROb2RlKSkge1xyXG4gICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICB9XHJcbiAgICAgIHZpc2l0ZWQuYWRkKGN1cnJlbnROb2RlKTtcclxuXHJcblxyXG4gICAgICAvLyDtmITsnqwg64W465Oc6rCAIOydtOuvuOyngOyduOyngCDtmZXsnbhcclxuICAgICAgaWYgKGN1cnJlbnROb2RlLnRhZ05hbWUgPT09ICdJTUcnKSB7XHJcbiAgICAgICAgY2xpY2tlZEltZyA9IGN1cnJlbnROb2RlO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGN1cnJlbnROb2RlLnNyYyk7XHJcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgc291cmNlOiBcImNvbnRlbnRcIixcclxuICAgICAgICAgIHR5cGU6IFwiaW1hZ2VDbGlja2VkXCIsXHJcbiAgICAgICAgICBpbWdTcmM6IGN1cnJlbnROb2RlLnNyYyxcclxuICAgICAgICAgIGlzU2hvdzogY3VycmVudE5vZGUuZGF0YXNldC50eXBlLmluY2x1ZGVzKCdIYXJtZnVsJykgPyBmYWxzZSA6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyDsnbTrr7jsp4Drpbwg7LC+7JWY7Jy866+A66GcIO2DkOyDieydhCDsooXro4xcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIOyekOyLnSDrhbjrk5zqsIAg7J6I64uk66m0IO2BkOyXkCDstpTqsIBcclxuICAgICAgY29uc3QgY2hpbGRyZW4gPSBjdXJyZW50Tm9kZS5jaGlsZHJlbjtcclxuICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICBxdWV1ZS5wdXNoKGNoaWxkKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGlja2VkSW1nID0gbnVsbDtcclxuXHJcbiAgfSwgdHJ1ZSk7XHJcblxyXG59XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==