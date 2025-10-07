import '../css/popup.css';
import {getNumOfHarmfulImgInthispage} from './utils/backgroundUtils.js';

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
  const pageNum = await getNumOfHarmfulImgInthispage(currentPageUrl);
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

    
  } else {
    return;
  } 

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

