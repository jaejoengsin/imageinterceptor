/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/css/popup.css":
/*!***************************!*\
  !*** ./src/css/popup.css ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


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
/*!*************************!*\
  !*** ./src/js/popup.js ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _css_popup_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../css/popup.css */ "./src/css/popup.css");
/* harmony import */ var _utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/backgroundUtils.js */ "./src/js/utils/backgroundUtils.js");



function getCurrentPageUrl() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        const urlString = tabs[0].url;
        try {
          const currentPageUrl = new URL(urlString);
          resolve(currentPageUrl);
        } catch (e) {
          reject(new Error("유효한 URL이 아닙니다."));
        }
      } else {
        reject(new Error("활성화된 탭을 찾을 수 없습니다."));
      }
    });
  });
}



async function loadNumOfHarmfulImg() {
  const pageNumDom = document.getElementById("page-count");
  const totalNumDom = document.getElementById("total-count");
  
  const currentPageUrl = await getCurrentPageUrl().then(result =>result.href);
  const pageNum = await (0,_utils_backgroundUtils_js__WEBPACK_IMPORTED_MODULE_1__.getNumOfHarmfulImgInthispage)(currentPageUrl);
  const totalNum = await chrome.storage.local.get(['totalNumOfHarmfulImg']).then(result => { return result.totalNumOfHarmfulImg; });
  console.log(totalNum);
  pageNumDom.textContent = pageNum;
  totalNumDom.textContent = totalNum;
}




document.addEventListener('DOMContentLoaded', async function () {

  const onOffSwitch = document.getElementById('onOffSwitch');
  const controlProcessButton = document.getElementById('ControlProcess');

  const FilteringStepContainer = document.querySelector('.step-segmented-container');

  const counterSection = document.querySelector('.counter-section');

  const siteActiveButton = document.getElementById('site-active-button');
  const pageActiveButton = document.getElementById('page-active-button');

  const pageApplyState = document.getElementById('page-apply-state');
  const siteApplyState = document.getElementById('site-apply-state');

  const applyTxt = document.querySelector('.apply-text');

  const activeArea = document.querySelector('.program-active-border');
  const interceptorSite = await chrome.storage.local.get(['interceptorSite']).then(result => { return result.interceptorSite; });
  console.log(interceptorSite);
  let siteActiveFlag = true;
  let pageActiveFlag = true;
  let currentPageUrl = null;
  let currentSite = null;


  try {
    currentPageUrl = await getCurrentPageUrl();
  } catch (e) {
    chrome.runtime.sendMessage({ source: 'popup', type: 'popup_error', error: e.message });
    return;
  }

  currentSite = currentPageUrl.origin;

  // if (currentPageUrl.protocol === 'http:' || currentPageUrl.protocol === 'https:') {
  if (true) {
    try {
      
      if (currentSite in interceptorSite) {
        
        siteActiveFlag = interceptorSite[currentSite]["active"];

        if (!siteActiveFlag) {
          //ui 상태 변경
          siteApplyState.querySelector('.apply-led').classList.add("on");
          siteActiveButton.querySelector('span').textContent = "사이트에서 프로그램 비활성화";

          pageActiveButton.classList.add("disabled");
          pageActiveButton.querySelector('span').textContent = "-";
          pageActiveButton.disabled = true;
          //pageActiveButton.style.borderColor = "red";
        }
        console.log(interceptorSite[currentSite]["page"]);
        if (interceptorSite[currentSite]["page"].includes(currentPageUrl.pathname)) {

          console.log(interceptorSite[currentSite]["page"]);
          pageActiveFlag = false;
          
          if (siteActiveFlag) {
            pageApplyState.querySelector('.apply-led').classList.add("on");
          
          }
            
        }

        if (!pageActiveFlag || !siteActiveFlag){
          activeArea.style.boxShadow = "0 0 2px 1px red";
          activeArea.style.borderColor = "red";
          controlProcessButton.disabled = true;
        }
      }
    

    } catch (e) {
      chrome.runtime.sendMessage({ source: 'popup', type: 'popup_error', error: e.message });
      return;
    }

    
  } else // removed by dead control flow
{} 

  const storedFilterStatus = await chrome.storage.local.get(['filterStatus']);
  let isFilteringOn = storedFilterStatus.filterStatus;

  if (isFilteringOn === undefined) {
    chrome.storage.local.set({ 'filterStatus': true });
    isFilteringOn = true;
  }
  controlProcessButton.querySelector('span').textContent = isFilteringOn ? 'Show' : 'Hide';


  const storedInterceptorStatus = await chrome.storage.local.get(['interceptorStatus']);
  let savedStatus = storedInterceptorStatus.interceptorStatus;

  if (savedStatus === undefined) {
    chrome.storage.local.set({ 'interceptorStatus': 1 });
    savedStatus = 1;
  }


  onOffSwitch.checked = (savedStatus === 1);


  const currentFilteringStep = await chrome.storage.local.get(['filteringStep']).then(result => result.filteringStep);
  FilteringStepContainer.querySelector(`input[name="segmented"][value="${currentFilteringStep}"]`).checked = true;







  loadNumOfHarmfulImg();

  //EVENT LISTNER//
  onOffSwitch.addEventListener('change', async function () {
    if (!siteActiveFlag || !pageActiveFlag) return;
    const isChecked = onOffSwitch.checked;
    await chrome.storage.local.set({ 'interceptorStatus': isChecked ? 1 : 0 });
    chrome.runtime.sendMessage({ source: 'popup', type: 'active_interceptor', active: isChecked }, function (response) {

    });
  });

  controlProcessButton.addEventListener('click', async function () {

    isFilteringOn = !isFilteringOn;
    await chrome.storage.local.set({ 'filterStatus': isFilteringOn });
    chrome.runtime.sendMessage({ source: 'popup', type: 'set_filter_status', FilterStatus: isFilteringOn }, function (response) {
      if (!response.ok) {
        console.error("reponse failed. eventType: set_filter_status");
        return;
      }
      const controlButtonTxt = controlProcessButton.querySelector('span');
      if (controlButtonTxt) {
        controlButtonTxt.textContent = isFilteringOn ? 'Show' : 'Hide';
      }
    });

  });


  siteActiveButton.addEventListener('click', async function () {
    
    siteActiveFlag = !siteActiveFlag;
    applyTxt.textContent = "변경 내용을 저장하시려면 새로고침을 해주세요";

    if (!(currentSite in interceptorSite)) interceptorSite[currentSite] = { "active": siteActiveFlag, "page":[] }; 
    else {
      interceptorSite[currentSite]["active"] = siteActiveFlag;
    }

    if (siteActiveFlag) {

      siteApplyState.querySelector('.apply-led').classList.remove("on");
      
      if (!pageActiveFlag) {
        pageApplyState.querySelector('.apply-led').classList.add("on");
      }
      else {
        activeArea.style.boxShadow = "0 0 2px 1px #04d41e";
        activeArea.style.borderColor = "#04d41e";
        
        controlProcessButton.disabled = false;
      }

      pageActiveButton.classList.remove("disabled");
      pageActiveButton.querySelector('span').textContent = "사이트에서 프로그램 비활성화";
      pageActiveButton.disabled = false;

    }
    else {

      siteApplyState.querySelector('.apply-led').classList.add("on");

      if (!pageActiveFlag) {
        pageApplyState.querySelector('.apply-led').classList.remove("on");
      }
      else {
        activeArea.style.boxShadow = "0 0 2px 1px red";
        activeArea.style.borderColor = "red";
      }

      pageActiveButton.classList.add("disabled");
      pageActiveButton.querySelector('span').textContent = "-";
      pageActiveButton.disabled = true;
      controlProcessButton.disabled = true;
    }
    chrome.runtime.sendMessage({ source: 'popup', type: 'sync_black_list', rootInstance: [currentSite, interceptorSite[currentSite]] });
    //await chrome.storage.local.set({ 'interceptorSite': interceptorSite });

  });


  pageActiveButton.addEventListener('click', async function () {
    pageActiveFlag = !pageActiveFlag;
    applyTxt.textContent = "변경 내용을 저장하시려면 새로고침을 해주세요";

    if(!(currentSite in interceptorSite)) interceptorSite[currentSite] = { "active": true, "page": [] };
    if (pageActiveFlag) {
    
      if(siteActiveFlag) {    
        pageApplyState.querySelector('.apply-led').classList.remove("on");
        activeArea.style.boxShadow = "0 0 2px 1px #04d41e";
        activeArea.style.borderColor = "#04d41e";
        controlProcessButton.disabled = false;
        
        
      }
      const delIndex = interceptorSite[currentSite]["page"].indexOf(currentPageUrl.pathname);
      if (delIndex !== -1) {
        interceptorSite[currentSite]["page"].splice(delIndex, 1);
      }
    }
    else {

      if(siteActiveFlag){
        pageApplyState.querySelector('.apply-led').classList.add("on");
        activeArea.style.boxShadow = "0 0 2px 1px red";
        activeArea.style.border = "red";

        controlProcessButton.disabled = true;

      }

      if(currentPageUrl.pathname != "/") interceptorSite[currentSite]["page"].push(currentPageUrl.pathname);
      console.log(interceptorSite[currentSite]["page"]);
    }
    chrome.runtime.sendMessage({ source: 'popup', type: 'sync_black_list', rootInstance: [currentSite, interceptorSite[currentSite]]});
    //await chrome.storage.local.set({ 'interceptorSite': interceptorSite });
   
  });

  FilteringStepContainer.addEventListener('change', (event) => {
   
      const newSetting = event.target.value;
    chrome.runtime.sendMessage({ source: 'popup', type: 'set_filtering_step', value: newSetting });
  });

});


})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RUFBNEU7QUFDNUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMscUdBQXFHO0FBQ3RJLHVDQUF1QyxvQ0FBb0M7QUFDM0U7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkVBQTJFO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMsb0dBQW9HO0FBQ3JJLHVDQUF1QyxvQ0FBb0M7QUFDM0U7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMsZ0VBQWdFO0FBQ2pHLEdBQUc7QUFDSDtBQUNBLENBQUM7QUFDRCIsInNvdXJjZXMiOlsid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvY3NzL3BvcHVwLmNzcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3V0aWxzL2JhY2tncm91bmRVdGlscy5qcyIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci8uL3NyYy9qcy9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbmV4cG9ydCB7fTsiLCJcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uKHVybCwgbnVtT2ZIYXJtZnVsSW1nKSB7XHJcbiAgY29uc3Qgc3RvcmVkRGF0YSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uZ2V0KFsnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJ10pO1xyXG4gIGxldCBudW1PZkhhcm1mdWxJbWdJblBhZ2UgPSBzdG9yZWREYXRhLm51bU9mSGFybWZ1bEltZ0luUGFnZSB8fCB7fTtcclxuXHJcbiAgY29uc29sZS5sb2cobnVtT2ZIYXJtZnVsSW1nSW5QYWdlKTtcclxuXHJcbiAgaWYgKHVybCBpbiBudW1PZkhhcm1mdWxJbWdJblBhZ2UpIHtcclxuICAgIG51bU9mSGFybWZ1bEltZ0luUGFnZVt1cmxdICs9IG51bU9mSGFybWZ1bEltZztcclxuICB9IGVsc2Uge1xyXG4gICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gPSBudW1PZkhhcm1mdWxJbWc7XHJcbiAgfVxyXG5cclxuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLnNldCh7ICdudW1PZkhhcm1mdWxJbWdJblBhZ2UnOiBudW1PZkhhcm1mdWxJbWdJblBhZ2UgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0TnVtT2ZIYXJtZnVsSW1nSW5TdG9yYWdlU2Vzc2lvbih1cmwpIHtcclxuICAgIGNvbnN0IHN0b3JlZERhdGEgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLmdldChbJ251bU9mSGFybWZ1bEltZ0luUGFnZSddKTtcclxuXHJcbiAgICAgbGV0IG51bU9mSGFybWZ1bEltZ0luUGFnZSA9IHN0b3JlZERhdGEubnVtT2ZIYXJtZnVsSW1nSW5QYWdlIHx8IHt9O1xyXG4gICAgIG51bU9mSGFybWZ1bEltZ0luUGFnZVt1cmxdID0gMDtcclxuXHJcbiAgICAgIGNocm9tZS5zdG9yYWdlLnNlc3Npb24uc2V0KHsgJ251bU9mSGFybWZ1bEltZ0luUGFnZSc6IG51bU9mSGFybWZ1bEltZ0luUGFnZSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE51bU9mSGFybWZ1bEltZ0ludGhpc3BhZ2UodXJsKSB7XHJcbiAgICBjb25zdCBzdG9yZWREYXRhID0gYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5nZXQoWydudW1PZkhhcm1mdWxJbWdJblBhZ2UnXSk7XHJcbiAgICBsZXQgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlID0gc3RvcmVkRGF0YS5udW1PZkhhcm1mdWxJbWdJblBhZ2UgfHwge307XHJcblxyXG4gICAgcmV0dXJuIG51bU9mSGFybWZ1bEltZ0luUGFnZVt1cmxdID8gbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gOiAwO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkVG90YWxOdW1PZkhhcm1mdWxJbWcobnVtKSB7XHJcblxyXG4gICAgY29uc3QgdG90YWxOdW1PZkhhcm1mdWxJbWcgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWyd0b3RhbE51bU9mSGFybWZ1bEltZyddKS50aGVuKHJlc3VsdCA9PiByZXN1bHQudG90YWxOdW1PZkhhcm1mdWxJbWcpO1xyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsndG90YWxOdW1PZkhhcm1mdWxJbWcnOih0b3RhbE51bU9mSGFybWZ1bEltZysgbnVtKX0pO1xyXG59XHJcblxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCAnLi4vY3NzL3BvcHVwLmNzcyc7XHJcbmltcG9ydCB7Z2V0TnVtT2ZIYXJtZnVsSW1nSW50aGlzcGFnZX0gZnJvbSAnLi91dGlscy9iYWNrZ3JvdW5kVXRpbHMuanMnO1xyXG5cclxuZnVuY3Rpb24gZ2V0Q3VycmVudFBhZ2VVcmwoKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0sICh0YWJzKSA9PiB7XHJcbiAgICAgIGlmICh0YWJzLmxlbmd0aCA+IDAgJiYgdGFic1swXS51cmwpIHtcclxuICAgICAgICBjb25zdCB1cmxTdHJpbmcgPSB0YWJzWzBdLnVybDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgY3VycmVudFBhZ2VVcmwgPSBuZXcgVVJMKHVybFN0cmluZyk7XHJcbiAgICAgICAgICByZXNvbHZlKGN1cnJlbnRQYWdlVXJsKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwi7Jyg7Zqo7ZWcIFVSTOydtCDslYTri5nri4jri6QuXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIu2ZnOyEse2ZlOuQnCDtg63snYQg7LC+7J2EIOyImCDsl4bsirXri4jri6QuXCIpKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbG9hZE51bU9mSGFybWZ1bEltZygpIHtcclxuICBjb25zdCBwYWdlTnVtRG9tID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYWdlLWNvdW50XCIpO1xyXG4gIGNvbnN0IHRvdGFsTnVtRG9tID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b3RhbC1jb3VudFwiKTtcclxuICBcclxuICBjb25zdCBjdXJyZW50UGFnZVVybCA9IGF3YWl0IGdldEN1cnJlbnRQYWdlVXJsKCkudGhlbihyZXN1bHQgPT5yZXN1bHQuaHJlZik7XHJcbiAgY29uc3QgcGFnZU51bSA9IGF3YWl0IGdldE51bU9mSGFybWZ1bEltZ0ludGhpc3BhZ2UoY3VycmVudFBhZ2VVcmwpO1xyXG4gIGNvbnN0IHRvdGFsTnVtID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsndG90YWxOdW1PZkhhcm1mdWxJbWcnXSkudGhlbihyZXN1bHQgPT4geyByZXR1cm4gcmVzdWx0LnRvdGFsTnVtT2ZIYXJtZnVsSW1nOyB9KTtcclxuICBjb25zb2xlLmxvZyh0b3RhbE51bSk7XHJcbiAgcGFnZU51bURvbS50ZXh0Q29udGVudCA9IHBhZ2VOdW07XHJcbiAgdG90YWxOdW1Eb20udGV4dENvbnRlbnQgPSB0b3RhbE51bTtcclxufVxyXG5cclxuXHJcblxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgY29uc3Qgb25PZmZTd2l0Y2ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb25PZmZTd2l0Y2gnKTtcclxuICBjb25zdCBjb250cm9sUHJvY2Vzc0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdDb250cm9sUHJvY2VzcycpO1xyXG5cclxuICBjb25zdCBGaWx0ZXJpbmdTdGVwQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN0ZXAtc2VnbWVudGVkLWNvbnRhaW5lcicpO1xyXG5cclxuICBjb25zdCBjb3VudGVyU2VjdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jb3VudGVyLXNlY3Rpb24nKTtcclxuXHJcbiAgY29uc3Qgc2l0ZUFjdGl2ZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaXRlLWFjdGl2ZS1idXR0b24nKTtcclxuICBjb25zdCBwYWdlQWN0aXZlQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2UtYWN0aXZlLWJ1dHRvbicpO1xyXG5cclxuICBjb25zdCBwYWdlQXBwbHlTdGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWdlLWFwcGx5LXN0YXRlJyk7XHJcbiAgY29uc3Qgc2l0ZUFwcGx5U3RhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2l0ZS1hcHBseS1zdGF0ZScpO1xyXG5cclxuICBjb25zdCBhcHBseVR4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcHBseS10ZXh0Jyk7XHJcblxyXG4gIGNvbnN0IGFjdGl2ZUFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucHJvZ3JhbS1hY3RpdmUtYm9yZGVyJyk7XHJcbiAgY29uc3QgaW50ZXJjZXB0b3JTaXRlID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnaW50ZXJjZXB0b3JTaXRlJ10pLnRoZW4ocmVzdWx0ID0+IHsgcmV0dXJuIHJlc3VsdC5pbnRlcmNlcHRvclNpdGU7IH0pO1xyXG4gIGNvbnNvbGUubG9nKGludGVyY2VwdG9yU2l0ZSk7XHJcbiAgbGV0IHNpdGVBY3RpdmVGbGFnID0gdHJ1ZTtcclxuICBsZXQgcGFnZUFjdGl2ZUZsYWcgPSB0cnVlO1xyXG4gIGxldCBjdXJyZW50UGFnZVVybCA9IG51bGw7XHJcbiAgbGV0IGN1cnJlbnRTaXRlID0gbnVsbDtcclxuXHJcblxyXG4gIHRyeSB7XHJcbiAgICBjdXJyZW50UGFnZVVybCA9IGF3YWl0IGdldEN1cnJlbnRQYWdlVXJsKCk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBzb3VyY2U6ICdwb3B1cCcsIHR5cGU6ICdwb3B1cF9lcnJvcicsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjdXJyZW50U2l0ZSA9IGN1cnJlbnRQYWdlVXJsLm9yaWdpbjtcclxuXHJcbiAgLy8gaWYgKGN1cnJlbnRQYWdlVXJsLnByb3RvY29sID09PSAnaHR0cDonIHx8IGN1cnJlbnRQYWdlVXJsLnByb3RvY29sID09PSAnaHR0cHM6Jykge1xyXG4gIGlmICh0cnVlKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBcclxuICAgICAgaWYgKGN1cnJlbnRTaXRlIGluIGludGVyY2VwdG9yU2l0ZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNpdGVBY3RpdmVGbGFnID0gaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXVtcImFjdGl2ZVwiXTtcclxuXHJcbiAgICAgICAgaWYgKCFzaXRlQWN0aXZlRmxhZykge1xyXG4gICAgICAgICAgLy91aSDsg4Htg5wg67OA6rK9XHJcbiAgICAgICAgICBzaXRlQXBwbHlTdGF0ZS5xdWVyeVNlbGVjdG9yKCcuYXBwbHktbGVkJykuY2xhc3NMaXN0LmFkZChcIm9uXCIpO1xyXG4gICAgICAgICAgc2l0ZUFjdGl2ZUJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJykudGV4dENvbnRlbnQgPSBcIuyCrOydtO2KuOyXkOyEnCDtlITroZzqt7jrnqgg67mE7Zmc7ISx7ZmUXCI7XHJcblxyXG4gICAgICAgICAgcGFnZUFjdGl2ZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XHJcbiAgICAgICAgICBwYWdlQWN0aXZlQnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKS50ZXh0Q29udGVudCA9IFwiLVwiO1xyXG4gICAgICAgICAgcGFnZUFjdGl2ZUJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgICAvL3BhZ2VBY3RpdmVCdXR0b24uc3R5bGUuYm9yZGVyQ29sb3IgPSBcInJlZFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdW1wicGFnZVwiXSk7XHJcbiAgICAgICAgaWYgKGludGVyY2VwdG9yU2l0ZVtjdXJyZW50U2l0ZV1bXCJwYWdlXCJdLmluY2x1ZGVzKGN1cnJlbnRQYWdlVXJsLnBhdGhuYW1lKSkge1xyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKGludGVyY2VwdG9yU2l0ZVtjdXJyZW50U2l0ZV1bXCJwYWdlXCJdKTtcclxuICAgICAgICAgIHBhZ2VBY3RpdmVGbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmIChzaXRlQWN0aXZlRmxhZykge1xyXG4gICAgICAgICAgICBwYWdlQXBwbHlTdGF0ZS5xdWVyeVNlbGVjdG9yKCcuYXBwbHktbGVkJykuY2xhc3NMaXN0LmFkZChcIm9uXCIpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFwYWdlQWN0aXZlRmxhZyB8fCAhc2l0ZUFjdGl2ZUZsYWcpe1xyXG4gICAgICAgICAgYWN0aXZlQXJlYS5zdHlsZS5ib3hTaGFkb3cgPSBcIjAgMCAycHggMXB4IHJlZFwiO1xyXG4gICAgICAgICAgYWN0aXZlQXJlYS5zdHlsZS5ib3JkZXJDb2xvciA9IFwicmVkXCI7XHJcbiAgICAgICAgICBjb250cm9sUHJvY2Vzc0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICBcclxuXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgc291cmNlOiAncG9wdXAnLCB0eXBlOiAncG9wdXBfZXJyb3InLCBlcnJvcjogZS5tZXNzYWdlIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgXHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybjtcclxuICB9IFxyXG5cclxuICBjb25zdCBzdG9yZWRGaWx0ZXJTdGF0dXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydmaWx0ZXJTdGF0dXMnXSk7XHJcbiAgbGV0IGlzRmlsdGVyaW5nT24gPSBzdG9yZWRGaWx0ZXJTdGF0dXMuZmlsdGVyU3RhdHVzO1xyXG5cclxuICBpZiAoaXNGaWx0ZXJpbmdPbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAnZmlsdGVyU3RhdHVzJzogdHJ1ZSB9KTtcclxuICAgIGlzRmlsdGVyaW5nT24gPSB0cnVlO1xyXG4gIH1cclxuICBjb250cm9sUHJvY2Vzc0J1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJykudGV4dENvbnRlbnQgPSBpc0ZpbHRlcmluZ09uID8gJ1Nob3cnIDogJ0hpZGUnO1xyXG5cclxuXHJcbiAgY29uc3Qgc3RvcmVkSW50ZXJjZXB0b3JTdGF0dXMgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydpbnRlcmNlcHRvclN0YXR1cyddKTtcclxuICBsZXQgc2F2ZWRTdGF0dXMgPSBzdG9yZWRJbnRlcmNlcHRvclN0YXR1cy5pbnRlcmNlcHRvclN0YXR1cztcclxuXHJcbiAgaWYgKHNhdmVkU3RhdHVzID09PSB1bmRlZmluZWQpIHtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdpbnRlcmNlcHRvclN0YXR1cyc6IDEgfSk7XHJcbiAgICBzYXZlZFN0YXR1cyA9IDE7XHJcbiAgfVxyXG5cclxuXHJcbiAgb25PZmZTd2l0Y2guY2hlY2tlZCA9IChzYXZlZFN0YXR1cyA9PT0gMSk7XHJcblxyXG5cclxuICBjb25zdCBjdXJyZW50RmlsdGVyaW5nU3RlcCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ2ZpbHRlcmluZ1N0ZXAnXSkudGhlbihyZXN1bHQgPT4gcmVzdWx0LmZpbHRlcmluZ1N0ZXApO1xyXG4gIEZpbHRlcmluZ1N0ZXBDb250YWluZXIucXVlcnlTZWxlY3RvcihgaW5wdXRbbmFtZT1cInNlZ21lbnRlZFwiXVt2YWx1ZT1cIiR7Y3VycmVudEZpbHRlcmluZ1N0ZXB9XCJdYCkuY2hlY2tlZCA9IHRydWU7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4gIGxvYWROdW1PZkhhcm1mdWxJbWcoKTtcclxuXHJcbiAgLy9FVkVOVCBMSVNUTkVSLy9cclxuICBvbk9mZlN3aXRjaC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXNpdGVBY3RpdmVGbGFnIHx8ICFwYWdlQWN0aXZlRmxhZykgcmV0dXJuO1xyXG4gICAgY29uc3QgaXNDaGVja2VkID0gb25PZmZTd2l0Y2guY2hlY2tlZDtcclxuICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdpbnRlcmNlcHRvclN0YXR1cyc6IGlzQ2hlY2tlZCA/IDEgOiAwIH0pO1xyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBzb3VyY2U6ICdwb3B1cCcsIHR5cGU6ICdhY3RpdmVfaW50ZXJjZXB0b3InLCBhY3RpdmU6IGlzQ2hlY2tlZCB9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuXHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgY29udHJvbFByb2Nlc3NCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgaXNGaWx0ZXJpbmdPbiA9ICFpc0ZpbHRlcmluZ09uO1xyXG4gICAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ZpbHRlclN0YXR1cyc6IGlzRmlsdGVyaW5nT24gfSk7XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNvdXJjZTogJ3BvcHVwJywgdHlwZTogJ3NldF9maWx0ZXJfc3RhdHVzJywgRmlsdGVyU3RhdHVzOiBpc0ZpbHRlcmluZ09uIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcInJlcG9uc2UgZmFpbGVkLiBldmVudFR5cGU6IHNldF9maWx0ZXJfc3RhdHVzXCIpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBjb250cm9sQnV0dG9uVHh0ID0gY29udHJvbFByb2Nlc3NCdXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpO1xyXG4gICAgICBpZiAoY29udHJvbEJ1dHRvblR4dCkge1xyXG4gICAgICAgIGNvbnRyb2xCdXR0b25UeHQudGV4dENvbnRlbnQgPSBpc0ZpbHRlcmluZ09uID8gJ1Nob3cnIDogJ0hpZGUnO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgfSk7XHJcblxyXG5cclxuICBzaXRlQWN0aXZlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgXHJcbiAgICBzaXRlQWN0aXZlRmxhZyA9ICFzaXRlQWN0aXZlRmxhZztcclxuICAgIGFwcGx5VHh0LnRleHRDb250ZW50ID0gXCLrs4Dqsr0g64K07Jqp7J2EIOyggOyepe2VmOyLnOugpOuptCDsg4jroZzqs6DsuajsnYQg7ZW07KO87IS47JqUXCI7XHJcblxyXG4gICAgaWYgKCEoY3VycmVudFNpdGUgaW4gaW50ZXJjZXB0b3JTaXRlKSkgaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXSA9IHsgXCJhY3RpdmVcIjogc2l0ZUFjdGl2ZUZsYWcsIFwicGFnZVwiOltdIH07IFxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGludGVyY2VwdG9yU2l0ZVtjdXJyZW50U2l0ZV1bXCJhY3RpdmVcIl0gPSBzaXRlQWN0aXZlRmxhZztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2l0ZUFjdGl2ZUZsYWcpIHtcclxuXHJcbiAgICAgIHNpdGVBcHBseVN0YXRlLnF1ZXJ5U2VsZWN0b3IoJy5hcHBseS1sZWQnKS5jbGFzc0xpc3QucmVtb3ZlKFwib25cIik7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoIXBhZ2VBY3RpdmVGbGFnKSB7XHJcbiAgICAgICAgcGFnZUFwcGx5U3RhdGUucXVlcnlTZWxlY3RvcignLmFwcGx5LWxlZCcpLmNsYXNzTGlzdC5hZGQoXCJvblwiKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBhY3RpdmVBcmVhLnN0eWxlLmJveFNoYWRvdyA9IFwiMCAwIDJweCAxcHggIzA0ZDQxZVwiO1xyXG4gICAgICAgIGFjdGl2ZUFyZWEuc3R5bGUuYm9yZGVyQ29sb3IgPSBcIiMwNGQ0MWVcIjtcclxuICAgICAgICBcclxuICAgICAgICBjb250cm9sUHJvY2Vzc0J1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYWdlQWN0aXZlQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJkaXNhYmxlZFwiKTtcclxuICAgICAgcGFnZUFjdGl2ZUJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJykudGV4dENvbnRlbnQgPSBcIuyCrOydtO2KuOyXkOyEnCDtlITroZzqt7jrnqgg67mE7Zmc7ISx7ZmUXCI7XHJcbiAgICAgIHBhZ2VBY3RpdmVCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuXHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIHNpdGVBcHBseVN0YXRlLnF1ZXJ5U2VsZWN0b3IoJy5hcHBseS1sZWQnKS5jbGFzc0xpc3QuYWRkKFwib25cIik7XHJcblxyXG4gICAgICBpZiAoIXBhZ2VBY3RpdmVGbGFnKSB7XHJcbiAgICAgICAgcGFnZUFwcGx5U3RhdGUucXVlcnlTZWxlY3RvcignLmFwcGx5LWxlZCcpLmNsYXNzTGlzdC5yZW1vdmUoXCJvblwiKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBhY3RpdmVBcmVhLnN0eWxlLmJveFNoYWRvdyA9IFwiMCAwIDJweCAxcHggcmVkXCI7XHJcbiAgICAgICAgYWN0aXZlQXJlYS5zdHlsZS5ib3JkZXJDb2xvciA9IFwicmVkXCI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBhZ2VBY3RpdmVCdXR0b24uY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xyXG4gICAgICBwYWdlQWN0aXZlQnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKS50ZXh0Q29udGVudCA9IFwiLVwiO1xyXG4gICAgICBwYWdlQWN0aXZlQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgY29udHJvbFByb2Nlc3NCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBzb3VyY2U6ICdwb3B1cCcsIHR5cGU6ICdzeW5jX2JsYWNrX2xpc3QnLCByb290SW5zdGFuY2U6IFtjdXJyZW50U2l0ZSwgaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXV0gfSk7XHJcbiAgICAvL2F3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdpbnRlcmNlcHRvclNpdGUnOiBpbnRlcmNlcHRvclNpdGUgfSk7XHJcblxyXG4gIH0pO1xyXG5cclxuXHJcbiAgcGFnZUFjdGl2ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIHBhZ2VBY3RpdmVGbGFnID0gIXBhZ2VBY3RpdmVGbGFnO1xyXG4gICAgYXBwbHlUeHQudGV4dENvbnRlbnQgPSBcIuuzgOqyvSDrgrTsmqnsnYQg7KCA7J6l7ZWY7Iuc66Ck66m0IOyDiOuhnOqzoOy5qOydhCDtlbTso7zshLjsmpRcIjtcclxuXHJcbiAgICBpZighKGN1cnJlbnRTaXRlIGluIGludGVyY2VwdG9yU2l0ZSkpIGludGVyY2VwdG9yU2l0ZVtjdXJyZW50U2l0ZV0gPSB7IFwiYWN0aXZlXCI6IHRydWUsIFwicGFnZVwiOiBbXSB9O1xyXG4gICAgaWYgKHBhZ2VBY3RpdmVGbGFnKSB7XHJcbiAgICBcclxuICAgICAgaWYoc2l0ZUFjdGl2ZUZsYWcpIHsgICAgXHJcbiAgICAgICAgcGFnZUFwcGx5U3RhdGUucXVlcnlTZWxlY3RvcignLmFwcGx5LWxlZCcpLmNsYXNzTGlzdC5yZW1vdmUoXCJvblwiKTtcclxuICAgICAgICBhY3RpdmVBcmVhLnN0eWxlLmJveFNoYWRvdyA9IFwiMCAwIDJweCAxcHggIzA0ZDQxZVwiO1xyXG4gICAgICAgIGFjdGl2ZUFyZWEuc3R5bGUuYm9yZGVyQ29sb3IgPSBcIiMwNGQ0MWVcIjtcclxuICAgICAgICBjb250cm9sUHJvY2Vzc0J1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGRlbEluZGV4ID0gaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXVtcInBhZ2VcIl0uaW5kZXhPZihjdXJyZW50UGFnZVVybC5wYXRobmFtZSk7XHJcbiAgICAgIGlmIChkZWxJbmRleCAhPT0gLTEpIHtcclxuICAgICAgICBpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdW1wicGFnZVwiXS5zcGxpY2UoZGVsSW5kZXgsIDEpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuXHJcbiAgICAgIGlmKHNpdGVBY3RpdmVGbGFnKXtcclxuICAgICAgICBwYWdlQXBwbHlTdGF0ZS5xdWVyeVNlbGVjdG9yKCcuYXBwbHktbGVkJykuY2xhc3NMaXN0LmFkZChcIm9uXCIpO1xyXG4gICAgICAgIGFjdGl2ZUFyZWEuc3R5bGUuYm94U2hhZG93ID0gXCIwIDAgMnB4IDFweCByZWRcIjtcclxuICAgICAgICBhY3RpdmVBcmVhLnN0eWxlLmJvcmRlciA9IFwicmVkXCI7XHJcblxyXG4gICAgICAgIGNvbnRyb2xQcm9jZXNzQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKGN1cnJlbnRQYWdlVXJsLnBhdGhuYW1lICE9IFwiL1wiKSBpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdW1wicGFnZVwiXS5wdXNoKGN1cnJlbnRQYWdlVXJsLnBhdGhuYW1lKTtcclxuICAgICAgY29uc29sZS5sb2coaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXVtcInBhZ2VcIl0pO1xyXG4gICAgfVxyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBzb3VyY2U6ICdwb3B1cCcsIHR5cGU6ICdzeW5jX2JsYWNrX2xpc3QnLCByb290SW5zdGFuY2U6IFtjdXJyZW50U2l0ZSwgaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXV19KTtcclxuICAgIC8vYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU2l0ZSc6IGludGVyY2VwdG9yU2l0ZSB9KTtcclxuICAgXHJcbiAgfSk7XHJcblxyXG4gIEZpbHRlcmluZ1N0ZXBDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGV2ZW50KSA9PiB7XHJcbiAgIFxyXG4gICAgICBjb25zdCBuZXdTZXR0aW5nID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBzb3VyY2U6ICdwb3B1cCcsIHR5cGU6ICdzZXRfZmlsdGVyaW5nX3N0ZXAnLCB2YWx1ZTogbmV3U2V0dGluZyB9KTtcclxuICB9KTtcclxuXHJcbn0pO1xyXG5cclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9