
import * as indexDb from './modules/indexDb.js';
import { CsBatchForWaiting } from './global/backgroundConfig.js';
import { fetchBatch } from './modules/requestImgAnalyze.js';
import {setNumOfHarmfulImgInStorageSession, initNumOfHarmfulImgInStorageSession} from './utils/backgroundUtils.js'

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
let PromiseForInit = indexDb.initIndexDb();

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
      const tx = indexDb.DB.transaction('imgURL', 'readwrite');
      const store = tx.objectStore('imgURL');
      try {

        if (indexDb.keySet.has(item.url)) {
          

          const value = await indexDb.reqTablePromise(store.get(item.url)).then(result => {
           
            return result;
          }).catch(error => {
            console.error("table에서 key 조회하고 value 가져오는 중에 Error 발생:", error.message);
          });

          if (!value.response) {
            console.log("데이터 베이스에 있지만 응답을 받지 못한  img id: " + item.id);
            if (retryThreshold < (Date.now() - value.saveTime)) {
              CsBatchForDBAdd.push(item); //너무 오랫동안 응답을 대기하고 있는 데이터였다면, 재요청 배치에 추가
              value.saveTime = Date.now();
              await indexDb.reqTablePromise(store.put(value));
            }
            item.tabId = tabId;
            item.frameId = frameId;
            CsBatchForWaiting.set([pageUrl,item.url], item);
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

            indexDb.keySet.add(item.url);
            //데이터 없음. DB 추가하고 fetch


            item.tabId = tabId;
            item.frameId = frameId;
            CsBatchForWaiting.set([pageUrl,item.url], item); //fetch할 데이터도 결국 response = false인 데이터와 함께 csbatchforwaiting에서 기다림

            CsBatchForDBAdd.push(item);
          }

        }
      } catch (e) {
        console.log("이미지 비교중 에러: ", e, "\nURL: ", item.url);
      }
    }));

  if (CsBatchForDBAdd?.length != 0) {

    const tx = indexDb.DB.transaction('imgURL', 'readwrite');
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

    fetchBatch(CsBatchForDBAdd, tabId);
    //db 추가했으니 fetch.
  }

  //console.log("pageCountInfo\n"+pageUrl+'\n'+numOfHarmfulImg);
  setNumOfHarmfulImgInStorageSession(pageUrl, numOfHarmfulImg);


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
            initNumOfHarmfulImgInStorageSession(pageUrl);
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
        }
      } catch (e) {
        console.error(e);
        sendResponse({ ok: false });
      }
    })();
    return true;
  }
});

