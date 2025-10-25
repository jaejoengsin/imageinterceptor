import { trackAndReplaceImg } from "./utils/trackAndReplaceImg.js";
import { changeImg, createRandomImgID} from './utils/contentUtils.js';
import IMGObs  from "./modules/imgObs.js";
import { setPermissionForMasking, setInterceptorActive, getInterceptorActive } from './global/contentConfig.js';
import dataBuffer from './global/buffer.js';


let testcnt = 0;
let clickedImg = null;

const link = document.createElement('link');
link.rel = 'stylesheet';
link.id = 'earlyImgMasking';
// 확장 프로그램 내부의 CSS 파일 경로
link.href = chrome.runtime.getURL('earlyImgMasking.css');
link.onload = () => { (console.log("succeed to load earlyImgMasking.css")); };
(document.head || document.documentElement).prepend(link);


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
      createRandomImgID(currentImg);
      IMGObs.imgViewObserver.observe(currentImg);

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
      changeImg(img, false);
      //img.src = img.dataset.originalSrc;
    });
  }
  else {
    const harmfulImgs = document.querySelectorAll('[data-type*="Harmful"]');
    harmfulImgs.forEach(img => {
      //img.src = harmfulImgMark;
      changeImg(img, true);
    });

    IMGObs.imgIdList.forEach(id => {
      const waitingImg = document.querySelector(`img[data-img-id="${id}"]`);
      if (waitingImg) waitingImg.dataset.masking = "imgMasking";
    });

    if (dataBuffer.length > 0) {
      dataBuffer.forEach(item => {
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
    changeImg(clickedImg, false);
    //clickedImg.src = clickedImg.dataset.originalSrc;
    //harmful을 없애야 함
    if (clickedImg.dataset.type.includes('Harmful')) clickedImg.dataset.type = clickedImg.dataset.type.replace('Harmful', '').trim();
  }
  else {
    clickedImg.dataset.masking = "None";
    clickedImg.dataset.originalSrc = clickedImg.src;
    if (!clickedImg.dataset.type.includes('Harmful')) clickedImg.dataset.type += " Harmful";
    changeImg(clickedImg, true);
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
          else throw new Error("블랙리스트를 조회할 수 없음");
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
      document.getElementById(' earlyImgMasking').remove();
      return;
    }

    const storedFilterStatus = await chrome.storage.local.get(['filterStatus']);
    let isFilteringOn = storedFilterStatus.filterStatus;
    if (isFilteringOn === undefined) {
      chrome.storage.local.set({ 'filterStatus': true });
      isFilteringOn = true;
    }
    setPermissionForMasking(isFilteringOn);

    const storedInterceptorStatus = await chrome.storage.local.get(['interceptorStatus']);
    let savedStatus = storedInterceptorStatus.interceptorStatus;
    if (savedStatus === undefined) {
      chrome.storage.local.set({ 'interceptorStatus': 1 });
      savedStatus = 1;
    }
    setInterceptorActive(savedStatus === 1 ? true : false);


    setEnventListers();

    if (document.readyState != "loading") {
      if (getInterceptorActive()) {
        IMGObs.imgObserve();
        Collect_staticImg();
      }
    }

  }
  else {
    console.log("블랙리스트에 있는 사이트");
  }
  document.getElementById('earlyImgMasking').remove();
  
  
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

        trackAndReplaceImg(message);

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
              IMGObs.reconnectObeserver();
              setInterceptorActive(true);
              console.log("program on");
            }
            else {
              IMGObs.disconntectObeserver();
              setInterceptorActive(false);
              console.log("program off");
            }
            sendResponse({ ok: true, message: "success" });
            break;


          case 'set_filter_status':
            //observer가 준비되었는지 확인하는 코드 나중에 추가해야 함
            setPermissionForMasking(message.FilterStatus);
            stopOrStarImgsMasking(message.FilterStatus);
            sendResponse({ ok: true, message: "success" });

            break;

          case 'control_img':
            console.log("이미지 컨트롤");
            if (!getInterceptorActive()) sendResponse({ ok: false, message: "interceptor is not active" });

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


    if (!getInterceptorActive()) return;

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





