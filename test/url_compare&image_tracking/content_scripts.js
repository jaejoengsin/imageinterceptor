

let filterModule;
let IMGObs;
let testcnt = 0;
let NoNSafeImgCount = 0;
const dataBuffer = [];
const MAX_N = 16, IDLE = 50;
let idleT = null;
let totalimg = 0;



const link = document.createElement('link');
link.rel = 'stylesheet';
// 확장 프로그램 내부의 CSS 파일 경로
link.href = chrome.runtime.getURL('src/css/masking.css'); 
link.onload = () => {(console.log("masking 파일 로드 완료"));}; 
(document.head || document.documentElement).prepend(link);


//dom 로드 완료까지 오버레이 삽입, 유지
if (window.top === window.self) {
  const overlayDiv = document.createElement('div');
  overlayDiv.id = 'extensionOverlay';
  document.documentElement.appendChild(overlayDiv); // html 바로 아래에 추가
  window.pageOverlay = overlayDiv;
} 


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * 
 * @param {err} errMessage 
 */
function terminateContentScript(errMessage) {
  if (/Extension context invalidated/i.test(errMessage)) console(" extension may be reloaded or disabled. so this contentscript can no longer be operated and will be termainated");
  else{
    console.error("!terminateContentScript becaouse this Error: ", errMessage," !");
  }
  if(IMGObs){
    IMGObs.disconntectObeserver();
  }
}



function maybeFlush() {
  if (dataBuffer.length >= MAX_N) Flush();
  clearTimeout(idleT);
  idleT = setTimeout(Flush, IDLE);
}



let ALLremoveFalse = 0;
let ALLremoveTrue = 0;
function Flush() {
  if (!dataBuffer.length) return;
  if (!chrome?.runtime) {
    //함수 호출?
    terminateContentScript('can not use chrome.runtime anymore. extension may be reloaded or disabled');
  }
  const batchFromContentScript = dataBuffer.splice(0, dataBuffer.length).filter(item => document.querySelector(`img[data-img-id="${item.id}"]`)); // 0부터 dataBuffer.length번째 인덱스(전체)를 복사한 객체 반환 & 해당 크기만큼 기존 객체 내 원소 삭제 -> 0으로 초기화
  
  try{
    chrome.runtime.sendMessage({
        type: "imgDataFromContentScript",
        data: batchFromContentScript, // 20개만 보내고, 배열은 자동으로 비움
      },
      function(response) {
        const err = chrome.runtime.lastError;
        if(err){
          terminateContentScript(err.message);
          throw new Error('chrome.runtime 메세지 송신 중 오류 발생');
        }
  
        const responseBatch = response.data; // 배열 [{ id, url, ... }, ...]
        let removeFalse = 0;
        let removeTrue = 0;
        console.log("service worker 송신:"+batchFromContentScript.length+"--------------"+"수신"+responseBatch.length);
        responseBatch.forEach(item => {
          try{
            const object= document.querySelector(`img[data-img-id="${item.id}"]`);
            if(object){
              removeTrue++;
              // object.style.removeProperty('visibility');
              // object.style.removeProperty('opacity');
    
              object.classList.remove('imgMasking');
              console.log("성공 id: "+ item.id);
              object.style.border = "8px solid blue";
              
            }
            else{
              removeFalse=removeFalse+1;
              console.log("실패 id: "+ item.id);
            }
          }
          catch(e){
            throw new Error("응답 데이터 마스킹 해제 중에 오류 발생: "+ e.message);
          }
        }
      ); 
      ALLremoveFalse += removeFalse;
      ALLremoveTrue += removeTrue;
      console.log("합계: 실패: "+removeFalse+"/성공: "+ removeTrue);
      console.log("누적 합계: 실패: "+ALLremoveFalse+"/성공: "+ ALLremoveTrue);
      console.log("성공률: " + (ALLremoveTrue/(ALLremoveFalse+ ALLremoveTrue)).toFixed(2));
      })
  } catch(e){
    console.error("erorr occured durring sending message with service worker:  ", e.message);
  }
}


//상대경로 -> 절대경로
function toAbsoluteUrl(url, baseUrl = document.baseURI) {
  try {
    return new URL(url, baseUrl);
  } catch {
    return url;
  }
}



/**.
 * @param {htmlImgElement} img - dom 이미지 객체
 */
function createRandomImgID(img){
  const ID = crypto.randomUUID();
  img.dataset.imgId = ID;
  return ID;
}




/**.
 * @param {object} img - dom 이미지 노드
 * @param {string} type - 정적 교체/동적 교체 기록
 */
function checkConditionAndSend (img, type) {
  //if (img.classList.contains('imgMasking')|| img.classList.contains('staticIMG')|| img.classList.contains('dynamicIMG')) return;
  const url = img.currentSrc || img.src;
  let absUrl;
  if (!url || url === '') {
    console.error("error: url NOT FOUND\nID:", img.dataset.imgId);

    return;          // 빈 URL 걸러냄
  }
  try{
    absUrl = toAbsoluteUrl(url, document.baseURI );
    if(filterModule.filter_based_safeUrlPattern(absUrl)){
    img.classList.remove("imgMasking");
    NoNSafeImgCount++;
    img.dataset.imgId = "NOTHARMFUL";
    console.log("비유해 이미지:",absUrl.toString()," 총합:",NoNSafeImgCount);
    return;
  }} catch(e){
    console.error("URL 정규화 과정&비유해이미지 필터링 중 오류 발생: - ", e);
    console.error("오류를 발생시킨 이미지의 url:", url);
    return;
  }
  img.classList.add(type); //static | dynamic img
  dataBuffer.push({ id: img.dataset.imgId, url: absUrl.toString(), harmful: false, status: false });
  maybeFlush();

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


//checkCurrentSrc로 requestAnimationFrame 시점에 maskandsend 호출. currentSrc를 안정적으로 얻기 위함.
//언제 다시 이미지가 들어올지 모르므로 일단 disconnect는 안함
//이미지 노드에 srcset이 존재하거나 source 태그가 존재할 경우 브라우저가 srcset을 선택하여 렌더링할 수 도 있음. 이 경우
// srcset이 서비스 워커 데이터 베이스에 등록되며 어떤 srcset이 등록되는지 예측할 수 없으므로 src를 기준으로 함. 따라서 이 경우 src의 url로 데이터베이스 재등록 및 해당 url로 재요청

class imageObservers {
  
  constructor() {

    this.imgViewObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const imgObj = entry.target;
        console.log("imgviewObserver observe entry, id: ",imgObj.dataset.imgId);
        checkCurrentSrc(imgObj, htmlImgElement => {
                checkConditionAndSend(htmlImgElement, 'dynamicIMG'); //maskAndSend를 바로 호출해도 문제 없는 것을 확인하였으나 안정성을 위해 이렇게 함
                } ); 
        this.imgViewObserver.unobserve(imgObj);

      });
      
    }, {
      root: null,
      rootMargin: "0px 0px -3% 0px", //하단 스크롤 시 콘텐츠가 3퍼센트 이상 노출될 시에 동작
      threshold: 0.1, //rootMargin: 0px, threshold: 0으로 해도 작동이 가능하나, 안정성을 위해 일단 수치를 조금 높인 상태
    });
    
    this.imgObserver = new MutationObserver(mutations => {
      const elements = [];
      mutations.forEach(mutation => {
        if (mutation.type === 'childList'){
          mutation.addedNodes.forEach( node => {
            if (node.nodeType !== 1) return;  // element만 처리
            if (node.tagName === 'IMG') {
            
              if (!node.dataset.imgId){
                console.log("observer <new node> detect");
                createRandomImgID(node);
                elements.push(node);
                console.log("이미지의 id는: ", node.dataset.imgId);
              }
            
            
    
            } else {
              // <img>가 아닌 요소가 들어온 경우: 자식 img 검색
              node.querySelectorAll('img').forEach( img => {
              
                // img.style.setProperty('visibility', 'hidden', 'important');
                // img.style.setProperty('opacity', '0', 'important');
                if (!img.dataset.imgId) {
                  console.log("observer <new node> detect");
                  createRandomImgID(img);
                  elements.push(img);
                  console.log("이미지의 id는: ", img.dataset.imgId);
    
                } 
            
        
              });
            }
          });
        }
    
      });
      totalimg += elements.length;
      console.log("total IMG: ", totalimg);
      elements.forEach(el => {
        requestAnimationFrame(() => {
          el.classList.add('imgMasking');//다음 렌더 사이클에서 마스킹
          this.imgViewObserver.observe(el);//렌더링, 레이아웃 정리가 제대로 이루어지지 않은 상태에서 감지될 수 있으므로 한 프레임 쉬고 호출
        
        });
      })
      
    });
  }  

  imgObserve() {
    this.imgObserver.observe(document.body, {
    childList: true, //자식
    subtree: true, //자손
    
    });
  }

  disconntectObeserver() {
    this.imgObserve.disconnect();
    this.imgViewObserver.disconnect();
  }

}  
console.log("테스트");


function Collect_staticImg () {
  const staticImgs = document.querySelectorAll('img');
  console.log("정적파일 합" + staticImgs.length);

  staticImgs.forEach(img => {
    const currentImg = img; // 'this' 컨텍스트 문제 해결을 위한 캡처
    if(!currentImg.dataset.imgId){
      currentImg.classList.add("imgMasking");
      createRandomImgID(currentImg);
      checkConditionAndSend(currentImg,"staticIMG");
    }

  })

}

//초기화 함수
async function pageInit() {



  //비유해 이미지 필터링 모듈 동적 import
  filterModule = await import (chrome.runtime.getURL('test/url_compare&image_tracking/url_filterModule_based_safe_pattern.js'));
  // ... static 이미지 처리 로직 ...
  Collect_staticImg();
  if(document.readyState!="loading"){
    IMGObs = new imageObservers;
    IMGObs.imgObserve();
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

//document.addEventListener('DOMContentLoaded', pageInit());
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', pageInit);
}
else {
  pageInit();
}

