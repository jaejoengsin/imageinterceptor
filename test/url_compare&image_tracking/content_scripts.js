

let filterModule;
let IMGObs;
let testcnt = 0;
let NoNSafeImgCount = 0;
const dataBuffer = [];
const MAX_N = 16, IDLE = 50;
let idleT = null;



const link = document.createElement('link');
link.rel = 'stylesheet';
// 확장 프로그램 내부의 CSS 파일 경로를 설정합니다.
link.href = chrome.runtime.getURL('src/css/masking.css'); 
link.onload = () => {(console.log("masking 파일 로드 완료"));}; 
(document.head || document.documentElement).prepend(link);


// const script = document.createElement('script');
// script.src = chrome.runtime.getURL('test/url_compare&image_tracking/injectedContent.js');  // 따로 파일로 뽑아 관리 가능
// script.type = 'module';
// (document.head || document.documentElement).prepend(script);
// link.onload = () => {
//  (console.log("스크립트 주입 완료"));
//  }; 



if (window.top === window.self) {
  const overlayDiv = document.createElement('div');
  overlayDiv.id = 'extensionOverlay';
  document.documentElement.appendChild(overlayDiv); // html 바로 아래에 추가
  window.pageOverlay = overlayDiv;
} 


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//setInterval(() => { console.log(document.readyState); }, 1000);


function maybeFlush() {
  if (dataBuffer.length >= MAX_N) Flush();
  clearTimeout(idleT);
  idleT = setTimeout(Flush, IDLE);
}



let ALLremoveFalse = 0;
let ALLremoveTrue = 0;
function Flush() {
  
  if (!dataBuffer.length) return;
  const batchFromContentScript = dataBuffer.splice(0, dataBuffer.length).filter(item => document.querySelector(`img[data-img-id="${item.id}"]`)); // 0부터 dataBuffer.length번째 인덱스(전체)를 복사한 객체 반환 & 해당 크기만큼 기존 객체 내 원소 삭제 -> 0으로 초기화
   chrome.runtime.sendMessage({
      type: "imgDataFromContentScript",
      data: batchFromContentScript, // 20개만 보내고, 배열은 자동으로 비움
    },
    function(response) {
      const responseBatch = response.data; // 배열 [{ id, url, ... }, ...]
      let removeFalse = 0;
      let removeTrue = 0;
      console.log("service worker 송신:"+batchFromContentScript.length+"--------------"+"수신"+responseBatch.length);
      responseBatch.forEach(item => {
        try{
          const object= document.querySelector(`img[data-img-id="${item.id}"]`);
          if(object){
            removeTrue++;
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
          console.log("마스킹 해제 중에 오류 발생: "+ e);
        }
      }
    ); 
    ALLremoveFalse += removeFalse;
    ALLremoveTrue += removeTrue;
    console.log("합계: 실패: "+removeFalse+"/성공: "+ removeTrue);
    console.log("누적 합계: 실패: "+ALLremoveFalse+"/성공: "+ ALLremoveTrue);
    console.log("성공률: " + (ALLremoveTrue/(ALLremoveFalse+ ALLremoveTrue)).toFixed(2));
    })
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
 * @param {object} img - dom 이미지 노드
 * @param {string} type - 정적 교체/동적 교체 기록
 */
function maskAndSend (img, type) {
  //if (img.classList.contains('imgMasking')|| img.classList.contains('staticIMG')|| img.classList.contains('dynamicIMG')) return;
  const url = img.currentSrc || img.src;
  if (!url || url === '') return;          // 빈 URL 걸러냄
  let absUrl;
  try{
    absUrl = toAbsoluteUrl(url, document.baseURI );
    if(filterModule.filter_based_safeUrlPattern(absUrl)){
    NoNSafeImgCount++;
    img.dataset.imgId = "NOTHARMFUL";
    //console.log("비유해 이미지:",absUrl.toString()," 총합:",NoNSafeImgCount);
    return;
  }} catch(e){
    console.error("URL 정규화 과정&비유해이미지 필터링 중 오류 발생: - ", e);
    console.error("오류를 발생시킨 이미지의 url:", url);
    return;
  }
  //img.classList.add("imgMasking", type); //일단은 static 이미지는 static이라고 클래스에 명시. 현재는 클래스 사용. 나중에 필요하면 새로운 속성을 추가하는 식으로 바꿀수도
  //if(img.dataset.imgId) console.log("이미 id가 존재합니다: ", img.dataset.imgId);
  // const uuid = crypto.randomUUID();
  // img.dataset.imgId = uuid;
  dataBuffer.push({ id: img.dataset.imgId, url: absUrl.toString(), harmful: false, response: false });
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


//필요 시 requestAnimationFrame 시점에 maskandsend 호출
//언제 다시 이미지가 들어올지 모르므로 일단 disconnect는 안함
//이미지 노드에 srcset이 존재하거나 source 태그가 존재할 경우 브라우저가 srcset을 선택하여 렌더링할 수 도 있음. 이 경우
// srcset이 서비스 워커 데이터 베이스에 등록되며 어떤 srcset이 등록되는지 예측할 수 없으므로 src를 기준으로 함. 따라서 이 경우 src의 url로 데이터베이스 재등록 및 해당 url로 재요청

class imageObservers {
  
  constructor() {

    this.imgViewObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const imgObj = entry.target;
        console.log("imgviewObserver observe entry, id: ",imgObj.dataset.imgId);
        checkCurrentSrc(imgObj, htmlImgElement => {
                maskAndSend(htmlImgElement, 'dynamicIMG');
                } ); 
        this.imgViewObserver.unobserve(imgObj);
      });
      
    }, {
      root: null,
      rootMargin: "0px",
      threshold: 0,
    });
    
    this.imgObserver = new MutationObserver(mutations => {
      const elements = [];
      mutations.forEach(mutation => {
        if (mutation.type === 'childList'){
          mutation.addedNodes.forEach( node => {
            if (node.nodeType !== 1) return;  // element만 처리
            if (node.tagName === 'IMG') {
              // <img>가 들어온 경우
              console.log("observer <new node> detect");
              
              node.classList.add("imgMasking","asdfsaf"); //일단은 static 이미지는 static이라고 클래스에 명시. 현재는 클래스 사용. 나중에 필요하면 새로운 속성을 추가하는 식으로 바꿀수도
              node.dataset.imgId = crypto.randomUUID();

              elements.push(node);
              console.log("이미지의 id는: ", node.dataset.imgId);
              if (!node.dataset.imgId){
                // checkCurrentSrc(node, htmlImgElement => {
                // maskAndSend(htmlImgElement, 'dynamicIMG');
                // } ); 
              }
            
    
            } else {
              // <img>가 아닌 요소가 들어온 경우: 자식 img 검색
              node.querySelectorAll('img').forEach( img => {
                
                console.log("observer <new node> detect");
  
                img.classList.add("imgMasking","asdfsaf"); //일단은 static 이미지는 static이라고 클래스에 명시. 현재는 클래스 사용. 나중에 필요하면 새로운 속성을 추가하는 식으로 바꿀수도
                img.dataset.imgId = crypto.randomUUID();
                elements.push(img);
                console.log("이미지의 id는: ", img.dataset.imgId);
        
                if (!img.dataset.imgId) {
    
                // checkCurrentSrc(img, htmlImgElement => {
                //     maskAndSend(htmlImgElement, 'dynamicIMG');
                // } );
                } 
        
              });
            }
          });
        }
    
      });
      elements.forEach(el => this.imgViewObserver.observe(el));
    });
  }  

  imgObserve() {
    this.imgObserver.observe(document.body, {
    childList: true, //자식
    subtree: true, //자손
    attributes: true,
    attributeFilter['src']
    });
  }
}  



// function maskAndSend (img, type) {
//   //if (img.classList.contains('imgMasking')|| img.classList.contains('staticIMG')|| img.classList.contains('dynamicIMG')) return;
//   const url = img.currentSrc || img.src;
//   if (!url || url === '') return;          // 빈 URL 걸러냄
//   let absUrl;
//   try{
//     absUrl = toAbsoluteUrl(url, document.baseURI );
//     if(filterModule.filter_based_safeUrlPattern(absUrl)){
//     NoNSafeImgCount++;
//     img.dataset.imgId = "NOTHARMFUL";
//     //console.log("비유해 이미지:",absUrl.toString()," 총합:",NoNSafeImgCount);
//     return;
//   }} catch(e){
//     console.error("URL 정규화 과정&비유해이미지 필터링 중 오류 발생: - ", e);
//     console.error("오류를 발생시킨 이미지의 url:", url);
//     return;
//   }
//   img.classList.add("imgMasking", type); //일단은 static 이미지는 static이라고 클래스에 명시. 현재는 클래스 사용. 나중에 필요하면 새로운 속성을 추가하는 식으로 바꿀수도
//   if(img.dataset.imgId) console.log("이미 id가 존재합니다: ", img.dataset.imgId);
//   const uuid = crypto.randomUUID();
//   img.dataset.imgId = uuid;
//   dataBuffer.push({ id: uuid, url: absUrl.toString(), harmful: false, response: false });
//   maybeFlush();

// }


function Collect_staticImg () {
  const staticImgs = document.querySelectorAll('img');
  console.log("정적파일 합" + staticImgs.length);

  staticImgs.forEach(img => {
    const currentImg = img; // 'this' 컨텍스트 문제 해결을 위한 캡처
    if(!currentImg.dataset.imgId){
      maskAndSend(currentImg,"staticIMG");
    }

  })

}

//초기화 함수
async function pageInit() {

  // if(DOMLoadComplete) return;
  // DOMLoadComplete = true
    
    // ... static 이미지 처리 로직 ...
  filterModule = await import (chrome.runtime.getURL('test/url_compare&image_tracking/url_filterModule_based_safe_pattern.js'));
  //Collect_staticImg();
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




window.addEventListener('message', (event) => {
  //if (event.source !== window) return;
  if (event.origin !== window.origin) return; // 보안: 출처 필터링
  if (event.data?.source !== 'page-script') return; // 보안: 출처 확인
  if (event.data?.type === 'imgDataFromPage') {
    console.log("page로부터 이미지 받음 " + event.data.data);
    const batchFromPage = event.data.data;
    chrome.runtime.sendMessage({
      type: "imgDataFromPage",
      data: batchFromPage, // 20개만 보내고, 배열은 자동으로 비움
    },   
    function(response) {
     
      let removeFalse = 0;
      let removeTrue = 0;
      const responseBatch = response.data; // 배열 [{ id, url, ... }, ...]
      console.log("imgDataFromPage -수신 및 service worker송신:"+batchFromPage.length+"--------------"+"수신"+responseBatch.length);
      responseBatch.forEach(item => {
        const object= document.querySelector(`img[data-img-id="${item.id}"]`);
        if(object){
          removeTrue++;
          object.classList.remove('imgMasking');
          console.log("성공 id: "+ item.id);
          object.style.border = "8px solid blue";

          
          // 1. 부모 컨테이너 생성 및 스타일 설정
          // const wrapper = document.createElement('div');
          // wrapper.style.position = 'relative';
          // wrapper.style.display = 'inline-block';
          
          // 2. 이미지의 부모로 wrapper를 삽입하고, img를 wrapper에 자식으로 이동
          // object.parentNode.insertBefore(wrapper, object);
          // wrapper.appendChild(object);

          // 3. 텍스트 오버레이 요소 생성 및 스타일 적용
          // const overlay = document.createElement('div');
          // overlay.textContent = '검사 완료';
          // overlay.style.position = 'absolute';
          // overlay.style.top = '10px';       // 원하는 위치 조정
          // overlay.style.left = '10px';
          // overlay.style.color = 'black';
          // overlay.style.fontWeight = 'bold';
          // overlay.style.background = 'rgba(0,0,0,0.4)';
          // overlay.style.padding = '4px 8px';
          // overlay.style.borderRadius = '4px';
          // overlay.style.fontSize = 'large';

          // 4. wrapper에 텍스트 오버레이 추가
          // wrapper.appendChild(overlay);
          
        }
        else{
          removeFalse=removeFalse+1;
          console.log("실패 id: "+ item.id);
        }
      }
    ); 
    ALLremoveFalse += removeFalse;
    ALLremoveTrue += removeTrue;
    console.log("합계: 실패: "+removeFalse+"/성공: "+ removeTrue);
    console.log("누적 합계: 실패: "+ALLremoveFalse+"/성공: "+ ALLremoveTrue);
    console.log("성공률: " + (ALLremoveTrue/(ALLremoveFalse+ ALLremoveTrue)).toFixed(2));
    
    }
  );
}
});


//다른 탭을 사용중일때, 15초마다 확인.

//setInterval(() => { if (dataBuffer.length) Flush(); }, 15000);


//페이지가 감추어졌을때

// setInterval(() => {
//   const a = document.querySelectorAll('img');
//   Collect_staticImg();
//   console.log(a.length);
// }, 1000);

//addEventListener('pagehide', Flush());

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (response?.type === "waitingData") {
//     const responseBatch = response.data; // 배열 [{ id, url, ... }, ...]
//     let removeFalse = 0;
//     let removeTrue = 0;
//       console.log("waitingData-수신:"+batchFromContentScript.length+"--------------"+"송신"+responseBatch.length);
//       responseBatch.forEach(item => {
//         const object= document.querySelector(`img[data-img-id="${item.id}"]`);
//         if(object){
//           removeTrue++;
//           object.classList.remove('imgMasking');
//           console.log("성공 id: "+ item.id);
//           object.style.border = "4px solid red";
//         }
//         else{
//           removeFalse=removeFalse+1;
//           console.log("실패 id: "+ item.id);
//         }
//       });
//     ALLremoveFalse += removeFalse;
//     ALLremoveTrue += removeTrue;
//     console.log("합계: 실패: "+removeFalse+"/성공: "+ removeTrue);
//     console.log("누적 합계: 실패: "+ALLremoveFalse+"/성공: "+ ALLremoveTrue);
//     console.log("성공률: " + (ALLremoveTrue/(ALLremoveFalse+ ALLremoveTrue)).toFixed(2));
//   }
// });






////////////////////////////////////////////옛날코드


//batchPort.postMessage({ type: 'batch', data: batch });


// 메시지 수신 및 chrome.runtime 전송
// window.addEventListener('message', (event) => {
//   //if (event.source !== window) return;
//   if (event.origin !== window.origin) return; // 보안: 출처 필터링
//   if (event.data?.source !== 'page-script') return; // 보안: 출처 확인
//   if (event.data?.type === 'imgDataFromPage') {
//      const batch = event.data.data.map(data => data.url);
//     testcode
//     const textLines = batch.map(rec => JSON.stringify(rec)).join('\n');
//     const textBlob = new Blob([textLines], { type: 'text/plain' });
//     const textUrl = URL.createObjectURL(textBlob);

//     const a1 = document.createElement('a');
//     a1.href = textUrl;
//     a1.download = `${testcnt}nth_records.txt`;
//     document.body.appendChild(a1);
//     a1.click();
//     document.body.removeChild(a1);
//     URL.revokeObjectURL(textUrl);
//     testcnt++;
    
//     chrome.runtime.sendMessage({ type: 'batch', data: batch });
//   }
// });


// const dataBuffer = [];
// const MAX_N = 500, IDLE = 2000;
// let idleT = null
// let testcnt = 0;

// const batchPort = chrome.runtime.connect({ name: 'batch' });

// function maybeFlush() {
//   if (dataBuffer.length >= MAX_N) Flush();
//   clearTimeout(idleT);
//   idleT = setTimeout(Flush, IDLE);
// }

// function Flush() {
//   if (!dataBuffer.length) return;
//   const batch = buf.splice(0, dataBuffer.length); // 0부터 dataBuffer.length번째 인덱스(전체)를 복사한 객체 반환 & 해당 크기만큼 기존 객체 내 원소 삭제 -> 0으로 초기화

//   // 모든 rec.id 가 이미 채워져 있음 → 바로 전송
//   batchPort.postMessage({ type: 'batch', data: batch });
//   //테스트 코드
//   const textLines = batch.map(rec => JSON.stringify(rec)).join('\n');
//   const textBlob = new Blob([textLines], { type: 'text/plain' });
//   const textUrl = URL.createObjectURL(textBlob);

//   const a1 = document.createElement('a');
//   a1.href = textUrl;
//   a1.download = `${testcnt}nth_records.txt`;
//   document.body.appendChild(a1);
//   a1.click();
//   document.body.removeChild(a1);
//   URL.revokeObjectURL(textUrl);
//   testcnt++;
//   //
// }
  


// const imgSrcObject = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');


// if (!imgSrcObject || !imgSrcObject.set)
//   console.log(imgSrcObject+"객체 오류");


// Object.defineProperty(HTMLImageElement.prototype, 'src', {
//   configurable: true, //프로퍼티 삭제 및 변경 가능 여부
//   enumerable: imgSrcObject.enumerable, //for...in 등 열거 가능 여부
//   get: imgSrcObject.get,
//   set: function (url) {
//     // css로 이미지 감추기
//     this.style.setProperty('visibility', 'hidden', 'important');
//     imgSrcObject.set.call(this, newURL); //후킹하기 전에 보관해 둔 기존 src 세터를 호출하여  <img> 요소를 this로, 새 URL을 인수로 넘겨서 정상적인 컨텍스트로 실행 -> 원본 이미지 다운로드
//     console.log("함수 활성화!");
//     // Generate SHA-256 based id and update attributes & store meta data.
//     generateSHA256(url).then(hash => {
//       dataBuffer.push({ id: hash, url: url, harmful: false, sended: false });
//       this.dataset.imgId = hash;
//       maybeFlush();
//     });

//   }
// });



// //다른 탭을 사용중일때, 15초마다 확인.
// setInterval(() => { if (dataBuffer.length) Flush(); }, 15000);
// //페이지가 감추어졌을때

//addEventListener('pagehide', Flush);



