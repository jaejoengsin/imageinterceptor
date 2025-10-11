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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RUFBNEU7QUFDNUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMscUdBQXFHO0FBQ3RJLHVDQUF1QyxvQ0FBb0M7QUFDM0U7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkVBQTJFO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMsb0dBQW9HO0FBQ3JJLHVDQUF1QyxvQ0FBb0M7QUFDM0U7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMsZ0VBQWdFO0FBQ2pHLEdBQUc7QUFDSDtBQUNBLENBQUM7QUFDRCIsInNvdXJjZXMiOlsid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvY3NzL3BvcHVwLmNzcz82YjY3Iiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3IvLi9zcmMvanMvdXRpbHMvYmFja2dyb3VuZFV0aWxzLmpzIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vaW1hZ2VpbnRlcmNlcHRvci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ltYWdlaW50ZXJjZXB0b3Ivd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9pbWFnZWludGVyY2VwdG9yLy4vc3JjL2pzL3BvcHVwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGV4dHJhY3RlZCBieSBtaW5pLWNzcy1leHRyYWN0LXBsdWdpblxuZXhwb3J0IHt9OyIsIlxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldE51bU9mSGFybWZ1bEltZ0luU3RvcmFnZVNlc3Npb24odXJsLCBudW1PZkhhcm1mdWxJbWcpIHtcclxuICBjb25zdCBzdG9yZWREYXRhID0gYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5nZXQoWydudW1PZkhhcm1mdWxJbWdJblBhZ2UnXSk7XHJcbiAgbGV0IG51bU9mSGFybWZ1bEltZ0luUGFnZSA9IHN0b3JlZERhdGEubnVtT2ZIYXJtZnVsSW1nSW5QYWdlIHx8IHt9O1xyXG5cclxuICBjb25zb2xlLmxvZyhudW1PZkhhcm1mdWxJbWdJblBhZ2UpO1xyXG5cclxuICBpZiAodXJsIGluIG51bU9mSGFybWZ1bEltZ0luUGFnZSkge1xyXG4gICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gKz0gbnVtT2ZIYXJtZnVsSW1nO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA9IG51bU9mSGFybWZ1bEltZztcclxuICB9XHJcblxyXG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uc2V0KHsgJ251bU9mSGFybWZ1bEltZ0luUGFnZSc6IG51bU9mSGFybWZ1bEltZ0luUGFnZSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXROdW1PZkhhcm1mdWxJbWdJblN0b3JhZ2VTZXNzaW9uKHVybCkge1xyXG4gICAgY29uc3Qgc3RvcmVkRGF0YSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLnNlc3Npb24uZ2V0KFsnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJ10pO1xyXG5cclxuICAgICBsZXQgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlID0gc3RvcmVkRGF0YS5udW1PZkhhcm1mdWxJbWdJblBhZ2UgfHwge307XHJcbiAgICAgbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gPSAwO1xyXG5cclxuICAgICAgY2hyb21lLnN0b3JhZ2Uuc2Vzc2lvbi5zZXQoeyAnbnVtT2ZIYXJtZnVsSW1nSW5QYWdlJzogbnVtT2ZIYXJtZnVsSW1nSW5QYWdlIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TnVtT2ZIYXJtZnVsSW1nSW50aGlzcGFnZSh1cmwpIHtcclxuICAgIGNvbnN0IHN0b3JlZERhdGEgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5zZXNzaW9uLmdldChbJ251bU9mSGFybWZ1bEltZ0luUGFnZSddKTtcclxuICAgIGxldCBudW1PZkhhcm1mdWxJbWdJblBhZ2UgPSBzdG9yZWREYXRhLm51bU9mSGFybWZ1bEltZ0luUGFnZSB8fCB7fTtcclxuXHJcbiAgICByZXR1cm4gbnVtT2ZIYXJtZnVsSW1nSW5QYWdlW3VybF0gPyBudW1PZkhhcm1mdWxJbWdJblBhZ2VbdXJsXSA6IDA7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRUb3RhbE51bU9mSGFybWZ1bEltZyhudW0pIHtcclxuXHJcbiAgICBjb25zdCB0b3RhbE51bU9mSGFybWZ1bEltZyA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ3RvdGFsTnVtT2ZIYXJtZnVsSW1nJ10pLnRoZW4ocmVzdWx0ID0+IHJlc3VsdC50b3RhbE51bU9mSGFybWZ1bEltZyk7XHJcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyd0b3RhbE51bU9mSGFybWZ1bEltZyc6KHRvdGFsTnVtT2ZIYXJtZnVsSW1nKyBudW0pfSk7XHJcbn1cclxuXHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0ICcuLi9jc3MvcG9wdXAuY3NzJztcclxuaW1wb3J0IHtnZXROdW1PZkhhcm1mdWxJbWdJbnRoaXNwYWdlfSBmcm9tICcuL3V0aWxzL2JhY2tncm91bmRVdGlscy5qcyc7XHJcblxyXG5mdW5jdGlvbiBnZXRDdXJyZW50UGFnZVVybCgpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY2hyb21lLnRhYnMucXVlcnkoeyBhY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWUgfSwgKHRhYnMpID0+IHtcclxuICAgICAgaWYgKHRhYnMubGVuZ3RoID4gMCAmJiB0YWJzWzBdLnVybCkge1xyXG4gICAgICAgIGNvbnN0IHVybFN0cmluZyA9IHRhYnNbMF0udXJsO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCBjdXJyZW50UGFnZVVybCA9IG5ldyBVUkwodXJsU3RyaW5nKTtcclxuICAgICAgICAgIHJlc29sdmUoY3VycmVudFBhZ2VVcmwpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCLsnKDtmqjtlZwgVVJM7J20IOyVhOuLmeuLiOuLpC5cIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZWplY3QobmV3IEVycm9yKFwi7Zmc7ISx7ZmU65CcIO2DreydhCDssL7snYQg7IiYIOyXhuyKteuLiOuLpC5cIikpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5hc3luYyBmdW5jdGlvbiBsb2FkTnVtT2ZIYXJtZnVsSW1nKCkge1xyXG4gIGNvbnN0IHBhZ2VOdW1Eb20gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhZ2UtY291bnRcIik7XHJcbiAgY29uc3QgdG90YWxOdW1Eb20gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRvdGFsLWNvdW50XCIpO1xyXG4gIFxyXG4gIGNvbnN0IGN1cnJlbnRQYWdlVXJsID0gYXdhaXQgZ2V0Q3VycmVudFBhZ2VVcmwoKS50aGVuKHJlc3VsdCA9PnJlc3VsdC5ocmVmKTtcclxuICBjb25zdCBwYWdlTnVtID0gYXdhaXQgZ2V0TnVtT2ZIYXJtZnVsSW1nSW50aGlzcGFnZShjdXJyZW50UGFnZVVybCk7XHJcbiAgY29uc3QgdG90YWxOdW0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWyd0b3RhbE51bU9mSGFybWZ1bEltZyddKS50aGVuKHJlc3VsdCA9PiB7IHJldHVybiByZXN1bHQudG90YWxOdW1PZkhhcm1mdWxJbWc7IH0pO1xyXG4gIGNvbnNvbGUubG9nKHRvdGFsTnVtKTtcclxuICBwYWdlTnVtRG9tLnRleHRDb250ZW50ID0gcGFnZU51bTtcclxuICB0b3RhbE51bURvbS50ZXh0Q29udGVudCA9IHRvdGFsTnVtO1xyXG59XHJcblxyXG5cclxuXHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG5cclxuICBjb25zdCBvbk9mZlN3aXRjaCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvbk9mZlN3aXRjaCcpO1xyXG4gIGNvbnN0IGNvbnRyb2xQcm9jZXNzQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ0NvbnRyb2xQcm9jZXNzJyk7XHJcblxyXG4gIGNvbnN0IEZpbHRlcmluZ1N0ZXBDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc3RlcC1zZWdtZW50ZWQtY29udGFpbmVyJyk7XHJcblxyXG4gIGNvbnN0IGNvdW50ZXJTZWN0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNvdW50ZXItc2VjdGlvbicpO1xyXG5cclxuICBjb25zdCBzaXRlQWN0aXZlQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpdGUtYWN0aXZlLWJ1dHRvbicpO1xyXG4gIGNvbnN0IHBhZ2VBY3RpdmVCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZS1hY3RpdmUtYnV0dG9uJyk7XHJcblxyXG4gIGNvbnN0IHBhZ2VBcHBseVN0YXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhZ2UtYXBwbHktc3RhdGUnKTtcclxuICBjb25zdCBzaXRlQXBwbHlTdGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaXRlLWFwcGx5LXN0YXRlJyk7XHJcblxyXG4gIGNvbnN0IGFwcGx5VHh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFwcGx5LXRleHQnKTtcclxuXHJcbiAgY29uc3QgYWN0aXZlQXJlYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wcm9ncmFtLWFjdGl2ZS1ib3JkZXInKTtcclxuICBjb25zdCBpbnRlcmNlcHRvclNpdGUgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWydpbnRlcmNlcHRvclNpdGUnXSkudGhlbihyZXN1bHQgPT4geyByZXR1cm4gcmVzdWx0LmludGVyY2VwdG9yU2l0ZTsgfSk7XHJcbiAgY29uc29sZS5sb2coaW50ZXJjZXB0b3JTaXRlKTtcclxuICBsZXQgc2l0ZUFjdGl2ZUZsYWcgPSB0cnVlO1xyXG4gIGxldCBwYWdlQWN0aXZlRmxhZyA9IHRydWU7XHJcbiAgbGV0IGN1cnJlbnRQYWdlVXJsID0gbnVsbDtcclxuICBsZXQgY3VycmVudFNpdGUgPSBudWxsO1xyXG5cclxuXHJcbiAgdHJ5IHtcclxuICAgIGN1cnJlbnRQYWdlVXJsID0gYXdhaXQgZ2V0Q3VycmVudFBhZ2VVcmwoKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNvdXJjZTogJ3BvcHVwJywgdHlwZTogJ3BvcHVwX2Vycm9yJywgZXJyb3I6IGUubWVzc2FnZSB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGN1cnJlbnRTaXRlID0gY3VycmVudFBhZ2VVcmwub3JpZ2luO1xyXG5cclxuICAvLyBpZiAoY3VycmVudFBhZ2VVcmwucHJvdG9jb2wgPT09ICdodHRwOicgfHwgY3VycmVudFBhZ2VVcmwucHJvdG9jb2wgPT09ICdodHRwczonKSB7XHJcbiAgaWYgKHRydWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIFxyXG4gICAgICBpZiAoY3VycmVudFNpdGUgaW4gaW50ZXJjZXB0b3JTaXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2l0ZUFjdGl2ZUZsYWcgPSBpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdW1wiYWN0aXZlXCJdO1xyXG5cclxuICAgICAgICBpZiAoIXNpdGVBY3RpdmVGbGFnKSB7XHJcbiAgICAgICAgICAvL3VpIOyDge2DnCDrs4Dqsr1cclxuICAgICAgICAgIHNpdGVBcHBseVN0YXRlLnF1ZXJ5U2VsZWN0b3IoJy5hcHBseS1sZWQnKS5jbGFzc0xpc3QuYWRkKFwib25cIik7XHJcbiAgICAgICAgICBzaXRlQWN0aXZlQnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKS50ZXh0Q29udGVudCA9IFwi7IKs7J207Yq47JeQ7IScIO2UhOuhnOq3uOueqCDruYTtmZzshLHtmZRcIjtcclxuXHJcbiAgICAgICAgICBwYWdlQWN0aXZlQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcclxuICAgICAgICAgIHBhZ2VBY3RpdmVCdXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpLnRleHRDb250ZW50ID0gXCItXCI7XHJcbiAgICAgICAgICBwYWdlQWN0aXZlQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICAgIC8vcGFnZUFjdGl2ZUJ1dHRvbi5zdHlsZS5ib3JkZXJDb2xvciA9IFwicmVkXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGludGVyY2VwdG9yU2l0ZVtjdXJyZW50U2l0ZV1bXCJwYWdlXCJdKTtcclxuICAgICAgICBpZiAoaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXVtcInBhZ2VcIl0uaW5jbHVkZXMoY3VycmVudFBhZ2VVcmwucGF0aG5hbWUpKSB7XHJcblxyXG4gICAgICAgICAgY29uc29sZS5sb2coaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXVtcInBhZ2VcIl0pO1xyXG4gICAgICAgICAgcGFnZUFjdGl2ZUZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKHNpdGVBY3RpdmVGbGFnKSB7XHJcbiAgICAgICAgICAgIHBhZ2VBcHBseVN0YXRlLnF1ZXJ5U2VsZWN0b3IoJy5hcHBseS1sZWQnKS5jbGFzc0xpc3QuYWRkKFwib25cIik7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXBhZ2VBY3RpdmVGbGFnIHx8ICFzaXRlQWN0aXZlRmxhZyl7XHJcbiAgICAgICAgICBhY3RpdmVBcmVhLnN0eWxlLmJveFNoYWRvdyA9IFwiMCAwIDJweCAxcHggcmVkXCI7XHJcbiAgICAgICAgICBhY3RpdmVBcmVhLnN0eWxlLmJvcmRlckNvbG9yID0gXCJyZWRcIjtcclxuICAgICAgICAgIGNvbnRyb2xQcm9jZXNzQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIFxyXG5cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBzb3VyY2U6ICdwb3B1cCcsIHR5cGU6ICdwb3B1cF9lcnJvcicsIGVycm9yOiBlLm1lc3NhZ2UgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gXHJcblxyXG4gIGNvbnN0IHN0b3JlZEZpbHRlclN0YXR1cyA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ2ZpbHRlclN0YXR1cyddKTtcclxuICBsZXQgaXNGaWx0ZXJpbmdPbiA9IHN0b3JlZEZpbHRlclN0YXR1cy5maWx0ZXJTdGF0dXM7XHJcblxyXG4gIGlmIChpc0ZpbHRlcmluZ09uID09PSB1bmRlZmluZWQpIHtcclxuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ICdmaWx0ZXJTdGF0dXMnOiB0cnVlIH0pO1xyXG4gICAgaXNGaWx0ZXJpbmdPbiA9IHRydWU7XHJcbiAgfVxyXG4gIGNvbnRyb2xQcm9jZXNzQnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKS50ZXh0Q29udGVudCA9IGlzRmlsdGVyaW5nT24gPyAnU2hvdycgOiAnSGlkZSc7XHJcblxyXG5cclxuICBjb25zdCBzdG9yZWRJbnRlcmNlcHRvclN0YXR1cyA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ2ludGVyY2VwdG9yU3RhdHVzJ10pO1xyXG4gIGxldCBzYXZlZFN0YXR1cyA9IHN0b3JlZEludGVyY2VwdG9yU3RhdHVzLmludGVyY2VwdG9yU3RhdHVzO1xyXG5cclxuICBpZiAoc2F2ZWRTdGF0dXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU3RhdHVzJzogMSB9KTtcclxuICAgIHNhdmVkU3RhdHVzID0gMTtcclxuICB9XHJcblxyXG5cclxuICBvbk9mZlN3aXRjaC5jaGVja2VkID0gKHNhdmVkU3RhdHVzID09PSAxKTtcclxuXHJcblxyXG4gIGNvbnN0IGN1cnJlbnRGaWx0ZXJpbmdTdGVwID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFsnZmlsdGVyaW5nU3RlcCddKS50aGVuKHJlc3VsdCA9PiByZXN1bHQuZmlsdGVyaW5nU3RlcCk7XHJcbiAgRmlsdGVyaW5nU3RlcENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGBpbnB1dFtuYW1lPVwic2VnbWVudGVkXCJdW3ZhbHVlPVwiJHtjdXJyZW50RmlsdGVyaW5nU3RlcH1cIl1gKS5jaGVja2VkID0gdHJ1ZTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgbG9hZE51bU9mSGFybWZ1bEltZygpO1xyXG5cclxuICAvL0VWRU5UIExJU1RORVIvL1xyXG4gIG9uT2ZmU3dpdGNoLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghc2l0ZUFjdGl2ZUZsYWcgfHwgIXBhZ2VBY3RpdmVGbGFnKSByZXR1cm47XHJcbiAgICBjb25zdCBpc0NoZWNrZWQgPSBvbk9mZlN3aXRjaC5jaGVja2VkO1xyXG4gICAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU3RhdHVzJzogaXNDaGVja2VkID8gMSA6IDAgfSk7XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNvdXJjZTogJ3BvcHVwJywgdHlwZTogJ2FjdGl2ZV9pbnRlcmNlcHRvcicsIGFjdGl2ZTogaXNDaGVja2VkIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG5cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBjb250cm9sUHJvY2Vzc0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBpc0ZpbHRlcmluZ09uID0gIWlzRmlsdGVyaW5nT247XHJcbiAgICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAnZmlsdGVyU3RhdHVzJzogaXNGaWx0ZXJpbmdPbiB9KTtcclxuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgc291cmNlOiAncG9wdXAnLCB0eXBlOiAnc2V0X2ZpbHRlcl9zdGF0dXMnLCBGaWx0ZXJTdGF0dXM6IGlzRmlsdGVyaW5nT24gfSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwicmVwb25zZSBmYWlsZWQuIGV2ZW50VHlwZTogc2V0X2ZpbHRlcl9zdGF0dXNcIik7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGNvbnRyb2xCdXR0b25UeHQgPSBjb250cm9sUHJvY2Vzc0J1dHRvbi5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XHJcbiAgICAgIGlmIChjb250cm9sQnV0dG9uVHh0KSB7XHJcbiAgICAgICAgY29udHJvbEJ1dHRvblR4dC50ZXh0Q29udGVudCA9IGlzRmlsdGVyaW5nT24gPyAnU2hvdycgOiAnSGlkZSc7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICB9KTtcclxuXHJcblxyXG4gIHNpdGVBY3RpdmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICBcclxuICAgIHNpdGVBY3RpdmVGbGFnID0gIXNpdGVBY3RpdmVGbGFnO1xyXG4gICAgYXBwbHlUeHQudGV4dENvbnRlbnQgPSBcIuuzgOqyvSDrgrTsmqnsnYQg7KCA7J6l7ZWY7Iuc66Ck66m0IOyDiOuhnOqzoOy5qOydhCDtlbTso7zshLjsmpRcIjtcclxuXHJcbiAgICBpZiAoIShjdXJyZW50U2l0ZSBpbiBpbnRlcmNlcHRvclNpdGUpKSBpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdID0geyBcImFjdGl2ZVwiOiBzaXRlQWN0aXZlRmxhZywgXCJwYWdlXCI6W10gfTsgXHJcbiAgICBlbHNlIHtcclxuICAgICAgaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXVtcImFjdGl2ZVwiXSA9IHNpdGVBY3RpdmVGbGFnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzaXRlQWN0aXZlRmxhZykge1xyXG5cclxuICAgICAgc2l0ZUFwcGx5U3RhdGUucXVlcnlTZWxlY3RvcignLmFwcGx5LWxlZCcpLmNsYXNzTGlzdC5yZW1vdmUoXCJvblwiKTtcclxuICAgICAgXHJcbiAgICAgIGlmICghcGFnZUFjdGl2ZUZsYWcpIHtcclxuICAgICAgICBwYWdlQXBwbHlTdGF0ZS5xdWVyeVNlbGVjdG9yKCcuYXBwbHktbGVkJykuY2xhc3NMaXN0LmFkZChcIm9uXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFjdGl2ZUFyZWEuc3R5bGUuYm94U2hhZG93ID0gXCIwIDAgMnB4IDFweCAjMDRkNDFlXCI7XHJcbiAgICAgICAgYWN0aXZlQXJlYS5zdHlsZS5ib3JkZXJDb2xvciA9IFwiIzA0ZDQxZVwiO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnRyb2xQcm9jZXNzQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBhZ2VBY3RpdmVCdXR0b24uY2xhc3NMaXN0LnJlbW92ZShcImRpc2FibGVkXCIpO1xyXG4gICAgICBwYWdlQWN0aXZlQnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKS50ZXh0Q29udGVudCA9IFwi7IKs7J207Yq47JeQ7IScIO2UhOuhnOq3uOueqCDruYTtmZzshLHtmZRcIjtcclxuICAgICAgcGFnZUFjdGl2ZUJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgc2l0ZUFwcGx5U3RhdGUucXVlcnlTZWxlY3RvcignLmFwcGx5LWxlZCcpLmNsYXNzTGlzdC5hZGQoXCJvblwiKTtcclxuXHJcbiAgICAgIGlmICghcGFnZUFjdGl2ZUZsYWcpIHtcclxuICAgICAgICBwYWdlQXBwbHlTdGF0ZS5xdWVyeVNlbGVjdG9yKCcuYXBwbHktbGVkJykuY2xhc3NMaXN0LnJlbW92ZShcIm9uXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFjdGl2ZUFyZWEuc3R5bGUuYm94U2hhZG93ID0gXCIwIDAgMnB4IDFweCByZWRcIjtcclxuICAgICAgICBhY3RpdmVBcmVhLnN0eWxlLmJvcmRlckNvbG9yID0gXCJyZWRcIjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcGFnZUFjdGl2ZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XHJcbiAgICAgIHBhZ2VBY3RpdmVCdXR0b24ucXVlcnlTZWxlY3Rvcignc3BhbicpLnRleHRDb250ZW50ID0gXCItXCI7XHJcbiAgICAgIHBhZ2VBY3RpdmVCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICBjb250cm9sUHJvY2Vzc0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNvdXJjZTogJ3BvcHVwJywgdHlwZTogJ3N5bmNfYmxhY2tfbGlzdCcsIHJvb3RJbnN0YW5jZTogW2N1cnJlbnRTaXRlLCBpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdXSB9KTtcclxuICAgIC8vYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgJ2ludGVyY2VwdG9yU2l0ZSc6IGludGVyY2VwdG9yU2l0ZSB9KTtcclxuXHJcbiAgfSk7XHJcblxyXG5cclxuICBwYWdlQWN0aXZlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgcGFnZUFjdGl2ZUZsYWcgPSAhcGFnZUFjdGl2ZUZsYWc7XHJcbiAgICBhcHBseVR4dC50ZXh0Q29udGVudCA9IFwi67OA6rK9IOuCtOyaqeydhCDsoIDsnqXtlZjsi5zroKTrqbQg7IOI66Gc6rOg7Lmo7J2EIO2VtOyjvOyEuOyalFwiO1xyXG5cclxuICAgIGlmKCEoY3VycmVudFNpdGUgaW4gaW50ZXJjZXB0b3JTaXRlKSkgaW50ZXJjZXB0b3JTaXRlW2N1cnJlbnRTaXRlXSA9IHsgXCJhY3RpdmVcIjogdHJ1ZSwgXCJwYWdlXCI6IFtdIH07XHJcbiAgICBpZiAocGFnZUFjdGl2ZUZsYWcpIHtcclxuICAgIFxyXG4gICAgICBpZihzaXRlQWN0aXZlRmxhZykgeyAgICBcclxuICAgICAgICBwYWdlQXBwbHlTdGF0ZS5xdWVyeVNlbGVjdG9yKCcuYXBwbHktbGVkJykuY2xhc3NMaXN0LnJlbW92ZShcIm9uXCIpO1xyXG4gICAgICAgIGFjdGl2ZUFyZWEuc3R5bGUuYm94U2hhZG93ID0gXCIwIDAgMnB4IDFweCAjMDRkNDFlXCI7XHJcbiAgICAgICAgYWN0aXZlQXJlYS5zdHlsZS5ib3JkZXJDb2xvciA9IFwiIzA0ZDQxZVwiO1xyXG4gICAgICAgIGNvbnRyb2xQcm9jZXNzQnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZGVsSW5kZXggPSBpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdW1wicGFnZVwiXS5pbmRleE9mKGN1cnJlbnRQYWdlVXJsLnBhdGhuYW1lKTtcclxuICAgICAgaWYgKGRlbEluZGV4ICE9PSAtMSkge1xyXG4gICAgICAgIGludGVyY2VwdG9yU2l0ZVtjdXJyZW50U2l0ZV1bXCJwYWdlXCJdLnNwbGljZShkZWxJbmRleCwgMSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgaWYoc2l0ZUFjdGl2ZUZsYWcpe1xyXG4gICAgICAgIHBhZ2VBcHBseVN0YXRlLnF1ZXJ5U2VsZWN0b3IoJy5hcHBseS1sZWQnKS5jbGFzc0xpc3QuYWRkKFwib25cIik7XHJcbiAgICAgICAgYWN0aXZlQXJlYS5zdHlsZS5ib3hTaGFkb3cgPSBcIjAgMCAycHggMXB4IHJlZFwiO1xyXG4gICAgICAgIGFjdGl2ZUFyZWEuc3R5bGUuYm9yZGVyID0gXCJyZWRcIjtcclxuXHJcbiAgICAgICAgY29udHJvbFByb2Nlc3NCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoY3VycmVudFBhZ2VVcmwucGF0aG5hbWUgIT0gXCIvXCIpIGludGVyY2VwdG9yU2l0ZVtjdXJyZW50U2l0ZV1bXCJwYWdlXCJdLnB1c2goY3VycmVudFBhZ2VVcmwucGF0aG5hbWUpO1xyXG4gICAgICBjb25zb2xlLmxvZyhpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdW1wicGFnZVwiXSk7XHJcbiAgICB9XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNvdXJjZTogJ3BvcHVwJywgdHlwZTogJ3N5bmNfYmxhY2tfbGlzdCcsIHJvb3RJbnN0YW5jZTogW2N1cnJlbnRTaXRlLCBpbnRlcmNlcHRvclNpdGVbY3VycmVudFNpdGVdXX0pO1xyXG4gICAgLy9hd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyAnaW50ZXJjZXB0b3JTaXRlJzogaW50ZXJjZXB0b3JTaXRlIH0pO1xyXG4gICBcclxuICB9KTtcclxuXHJcbiAgRmlsdGVyaW5nU3RlcENvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZXZlbnQpID0+IHtcclxuICAgXHJcbiAgICAgIGNvbnN0IG5ld1NldHRpbmcgPSBldmVudC50YXJnZXQudmFsdWU7XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHNvdXJjZTogJ3BvcHVwJywgdHlwZTogJ3NldF9maWx0ZXJpbmdfc3RlcCcsIHZhbHVlOiBuZXdTZXR0aW5nIH0pO1xyXG4gIH0pO1xyXG5cclxufSk7XHJcblxyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=