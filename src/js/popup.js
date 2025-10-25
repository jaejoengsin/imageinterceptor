import '../css/popup.css';
import { getNumOfHarmfulImgInthispage } from './utils/backgroundUtils.js';

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

  const currentPageUrl = await getCurrentPageUrl().then(result => result.href);
  const pageNum = await getNumOfHarmfulImgInthispage(currentPageUrl);
  const totalNum = await chrome.storage.local.get(['totalNumOfHarmfulImg']).then(result => { return result.totalNumOfHarmfulImg; });
  console.log(totalNum);
  pageNumDom.textContent = pageNum;
  totalNumDom.textContent = totalNum;
}



//state: 프로그램 작동중, 프로그램 꺼짐, 프로그램 차단됨
function changeStateInfo(String) {
  const programStateInfo = document.querySelector('.header-subtitle'); //state:
  if (String === "active") {
    programStateInfo.innerHTML = `<span style="color: #0CBA00">프로그램 작동중</span>`;
  }
  else if (String === "inactive") {
    programStateInfo.innerHTML = `<span style="color: gray">프로그램 꺼짐</span>`;

  }
  else if (String === "blocked") {
    programStateInfo.innerHTML = `<span style="color: red">프로그램 차단됨</span>`;
  }
}


document.addEventListener('DOMContentLoaded', async function () {

  const onOffSwitch = document.getElementById('onOffSwitch');
  const controlProcessButton = document.getElementById('ControlProcess');

  const FilteringStepContainer = document.querySelector('.step-segmented-container');


  const siteActiveButton = document.getElementById('site-active-button');
  const pageActiveButton = document.getElementById('page-active-button');

  const pageApplyState = document.getElementById('page-apply-state');
  const siteApplyState = document.getElementById('site-apply-state');


  const activeArea = document.querySelector('.program-active-border');

  const policyLink = document.getElementById('privacy-policy');

  const refreshButtonContainer = document.querySelector('.refresh-button-container');
  const refreshButton = document.createElement('button');
  refreshButton.classList.add('refresh-button');
  refreshButton.innerText = "새로고침하여 변경 내용 적용하기";

  const interceptorSite = await chrome.storage.local.get(['interceptorSite']).then(result => { return result.interceptorSite; });

  let siteActiveFlag = true;
  let pageActiveFlag = true;
  let currentPageUrl = null;
  let currentSite = null;

  let storedFilterStatus = null;
  let isFilteringOn = null;

  let storedInterceptorStatus = null;
  let interceptorStatus = null;

  let currentFilteringStep = null;

  try {
    storedFilterStatus = await chrome.storage.local.get(['filterStatus']);
    isFilteringOn = storedFilterStatus.filterStatus;

    if (isFilteringOn === undefined) {
      chrome.storage.local.set({ 'filterStatus': true });
      isFilteringOn = true;
    }
    controlProcessButton.querySelector('span').textContent = isFilteringOn ? 'Show' : 'Hide';


    storedInterceptorStatus = await chrome.storage.local.get(['interceptorStatus']);
    interceptorStatus = storedInterceptorStatus.interceptorStatus;

    if (interceptorStatus === undefined) {
      chrome.storage.local.set({ 'interceptorStatus': 1 });
      interceptorStatus = 1;
    }
    onOffSwitch.checked = (interceptorStatus === 1);


    currentFilteringStep = await chrome.storage.local.get(['filteringStep']).then(result => result.filteringStep);
    FilteringStepContainer.querySelector(`input[name="segmented"][value="${currentFilteringStep}"]`).checked = true;

    currentPageUrl = await getCurrentPageUrl();
    currentSite = currentPageUrl.origin;
  } catch (e) {
    console.error("error occured while loading storage value"+e);
    chrome.runtime.sendMessage({ source: 'popup', type: 'popup_error', error: e.message });
    return;
  }

  /////////////enable/disable interceptor status according on/off



  /////////////
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
      
        if (interceptorSite[currentSite]["page"].includes(currentPageUrl.pathname)) {

          pageActiveFlag = false;
          if (siteActiveFlag) {
            pageApplyState.querySelector('.apply-led').classList.add("on");

          }

        }

        if (!pageActiveFlag || !siteActiveFlag) {
          changeStateInfo("blocked");
          activeArea.style.boxShadow = "0 0 2px 1px red";
          activeArea.style.borderColor = "red";

          onOffSwitch.parentElement.classList.add('disabled');
          controlProcessButton.classList.add('disabled');
          FilteringStepContainer.querySelector('.segmented').classList.add('disabled');
        }

        else {
          if(interceptorStatus != 1){
            changeStateInfo("inactive");
            activeArea.style.boxShadow = "0 0 2px 1px #ccc";
            activeArea.style.borderColor = "#ccc";
            controlProcessButton.classList.add('disabled');
            FilteringStepContainer.querySelector('.segmented').classList.add('disabled');
          }
          else {
            changeStateInfo("active");
          }
        }
      }

    } catch (e) {
      chrome.runtime.sendMessage({ source: 'popup', type: 'popup_error', error: e.message });
      return;
    }


  } else {
    return;
  }


  loadNumOfHarmfulImg();

  //EVENT LISTNER//
  onOffSwitch.addEventListener('change', async function () {
    if (!siteActiveFlag || !pageActiveFlag) return;
    const isChecked = onOffSwitch.checked;
    if (isChecked) {
      changeStateInfo("active");
      activeArea.style.boxShadow = "0 0 2px 1px #04d41e";
      activeArea.style.borderColor = "#04d41e";
      controlProcessButton.classList.remove('disabled');
      FilteringStepContainer.querySelector('.segmented').classList.remove('disabled');
    }
    else {
      changeStateInfo("inactive");
      activeArea.style.boxShadow = "0 0 2px 1px #ccc";
      activeArea.style.borderColor = "#ccc";
      controlProcessButton.classList.add('disabled');
      FilteringStepContainer.querySelector('.segmented').classList.add('disabled');
    }
  
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

    if (!refreshButtonContainer.querySelector('.refresh-button')) {
      refreshButtonContainer.appendChild(refreshButton);
    }


    if (!(currentSite in interceptorSite)) interceptorSite[currentSite] = { "active": siteActiveFlag, "page": [] };
    else {
      interceptorSite[currentSite]["active"] = siteActiveFlag;
    }

    if (siteActiveFlag) {

      siteApplyState.querySelector('.apply-led').classList.remove("on");

      if (!pageActiveFlag) {
        pageApplyState.querySelector('.apply-led').classList.add("on");
      }
      else {
        if(onOffSwitch.checked){
          changeStateInfo("active");
          activeArea.style.boxShadow = "0 0 2px 1px #04d41e";
          activeArea.style.borderColor = "#04d41e";
          onOffSwitch.parentElement.classList.remove('disabled');
          controlProcessButton.classList.remove('disabled');
          FilteringStepContainer.querySelector('.segmented').classList.remove('disabled');
        }
        else {
          changeStateInfo("inactive");
          activeArea.style.boxShadow = "0 0 2px 1px #ccc";
          activeArea.style.borderColor = "#ccc";
          onOffSwitch.parentElement.classList.remove('disabled');
        }
      }

      pageActiveButton.classList.remove("disabled");
      pageActiveButton.querySelector('span').textContent = "이 페이지에서 프로그램 비활성화";
      pageActiveButton.disabled = false;

    }
    else {

      siteApplyState.querySelector('.apply-led').classList.add("on");

      if (!pageActiveFlag) {
        pageApplyState.querySelector('.apply-led').classList.remove("on");
      }
      else {
        changeStateInfo("blocked");
        activeArea.style.boxShadow = "0 0 2px 1px red";
        activeArea.style.borderColor = "red";
        onOffSwitch.parentElement.classList.add('disabled');
        controlProcessButton.classList.add('disabled');
        FilteringStepContainer.querySelector('.segmented').classList.add('disabled');
      }

      pageActiveButton.classList.add("disabled");
      pageActiveButton.querySelector('span').textContent = "-";
      pageActiveButton.disabled = true;
    }
    chrome.runtime.sendMessage({ source: 'popup', type: 'sync_black_list', rootInstance: [currentSite, interceptorSite[currentSite]] });
    //await chrome.storage.local.set({ 'interceptorSite': interceptorSite });

  });


  pageActiveButton.addEventListener('click', async function () {
    pageActiveFlag = !pageActiveFlag;

    if(!refreshButtonContainer.querySelector('.refresh-button')){
      refreshButtonContainer.appendChild(refreshButton);
    }

    if (!(currentSite in interceptorSite)) interceptorSite[currentSite] = { "active": true, "page": [] };
    if (pageActiveFlag) {

      if (siteActiveFlag) {
        pageApplyState.querySelector('.apply-led').classList.remove("on");

        if(onOffSwitch.checked){
          changeStateInfo("active");
          activeArea.style.boxShadow = "0 0 2px 1px #04d41e";
          activeArea.style.borderColor = "#04d41e";
          onOffSwitch.parentElement.classList.remove('disabled');
          controlProcessButton.classList.remove('disabled');
          FilteringStepContainer.querySelector('.segmented').classList.remove('disabled');
        }
        else {
          changeStateInfo("inactive");
          activeArea.style.boxShadow = "0 0 2px 1px #ccc";
          activeArea.style.borderColor = "#ccc";
          onOffSwitch.parentElement.classList.remove('disabled');
        }


      }
      const delIndex = interceptorSite[currentSite]["page"].indexOf(currentPageUrl.pathname);
      if (delIndex !== -1) {
        interceptorSite[currentSite]["page"].splice(delIndex, 1);
      }
    }
    else {

      if (siteActiveFlag) {
        pageApplyState.querySelector('.apply-led').classList.add("on");
        changeStateInfo("blocked");
        activeArea.style.boxShadow = "0 0 2px 1px red";
        activeArea.style.border = "red";
        onOffSwitch.parentElement.classList.add('disabled');
        controlProcessButton.classList.add('disabled');
        FilteringStepContainer.querySelector('.segmented').classList.add('disabled');

      }

      if (currentPageUrl.pathname != "/") interceptorSite[currentSite]["page"].push(currentPageUrl.pathname);
      console.log(interceptorSite[currentSite]["page"]);
    }
    chrome.runtime.sendMessage({ source: 'popup', type: 'sync_black_list', rootInstance: [currentSite, interceptorSite[currentSite]] });
    //await chrome.storage.local.set({ 'interceptorSite': interceptorSite });

  });

  FilteringStepContainer.addEventListener('change', (event) => {

    const newSetting = event.target.value;
    chrome.runtime.sendMessage({ source: 'popup', type: 'set_filtering_step', value: newSetting });
  });

  policyLink.addEventListener('click', function (e) {
    e.preventDefault(); 
    chrome.tabs.create({ url: this.href });
  });

  refreshButton.addEventListener('click', function () {
    chrome.tabs.reload();
  });

});

