
//const batchPort = chrome.runtime.connect({ name: 'batch' });
// const DOMLoadComplete = false;
// let loadingImg = chrome.runtime.getURL("src/css/masking.css")


let filterModule;

let testcnt = 0;
let NoNSafeImgCount = 0;
const dataBuffer = [];
const MAX_N = 16, IDLE = 50;
let idleT = null;


(async () => {
  try {
    filterModule = await import (chrome.runtime.getURL('test/url_compare&image_tracking/url_filterModule_based_safe_pattern.js'));
  } catch (e) {
    console.error('모듈을 동적으로 불러오는데 실패했습니다:', e);
  }
})();


const link = document.createElement('link');
link.rel = 'stylesheet';
// 확장 프로그램 내부의 CSS 파일 경로를 설정합니다.
link.href = chrome.runtime.getURL('src/css/masking.css'); 
link.onload = () => {(console.log("masking 파일 로드 완료"));}; 
(document.head || document.documentElement).prepend(link);


const script = document.createElement('script');
script.src = chrome.runtime.getURL('test/url_compare&image_tracking/injectedContent.js');  // 따로 파일로 뽑아 관리 가능
script.type = 'module';
(document.head || document.documentElement).prepend(script);
link.onload = () => {
 (console.log("스크립트 주입 완료"));
 }; 

if (window.top === window.self) {
  const overlayDiv = document.createElement('div');
  overlayDiv.id = 'extensionOverlay';
  document.documentElement.appendChild(overlayDiv); // html 바로 아래에 추가
  window.pageOverlay = overlayDiv;
} 


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//setInterval(() => { console.log(document.readyState); }, 1000);

/**
 * Convert ArrayBuffer to hex string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
const encoder   = new TextEncoder();
function bufferToHex(buffer) {
  const byteArray = new Uint8Array(buffer); // 버퍼를 0-255 범위의 바이트 배열처럼 인덱스로 순회 1바이트 -> 8비트 -> unsigndeint = 0~255
  return Array.from(byteArray) //Uint8Array를 일반 JS 배열로 복사. ([byte0, byte1, …])
    .map(b => b.toString(16).padStart(2, '0')) //각 바이트 b를 b.toString(16) → 16진수 문자열(예 13 → "d"), padStart(2,'0') → 두 자리로 앞쪽 0 채움("0d").
    .join('');//두 자리씩 나온 16진수 토큰들을 공백 없이 연결
}



/**
 * Generate SHA-256 hash for a given string using SubtleCrypto.
 * It returns a promise resolving to a hexadecimal representation.
 * @param {string} text
 * @returns {Promise<string>}
 */
function generateSHA256(text) {
  const data = encoder.encode(text);
  if (crypto && crypto.subtle && crypto.subtle.digest) {
    return crypto.subtle.digest('SHA-256', data).then(bufferToHex);
  }
  return Promise.reject(new Error('SubtleCrypto not supported'));
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
          console.log("from contentsscriptdata: id 못찾음: "+ item );
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
  } catch(e){
    console.error("URL 정규화 과정 중에 에러 발생 - ", e);
    return;
  }
  if(filterModule.filter_based_safeUrlPattern(absUrl)){
    NoNSafeImgCount++;
    img.dataset.imgId = "NOTHARMFUL";
    console.log("비유해 이미지:",absUrl.toString()," 총합:",NoNSafeImgCount);
    return;
  }
  img.classList.add("imgMasking", type); //일단은 static 이미지는 static이라고 클래스에 명시. 현재는 클래스 사용. 나중에 필요하면 새로운 속성을 추가하는 식으로 바꿀수도
  const uuid = crypto.randomUUID();
  img.dataset.imgId = uuid;
  dataBuffer.push({ id: uuid, url: absUrl.toString(), harmful: false, response: false });
  maybeFlush();

}

//currentsrc에 값이 생길때까지 다음 repaint 턴을 비동기적으로 기다리고, 반복.
  function checkCurrentSrc(img, callback, timeout = 1000000) { //lazy loading으로 인해 기다리는 시간이 얼마나 지속되느냐에 따라 currentSrc를 얻을 수도 있고 못 얻을 수도 있음. 특히 유튜브 같은
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


const imgObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type !== 'childList') return;

    mutation.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;  // element만 처리
     

      if (node.tagName === 'IMG') {
        // <img>가 들어온 경우
        if (!node.dataset.imgId){
          
        //const hasSrcSet = !!node.getAttribute('srcset');
        //console.log("mutateobserver detected |  " + "url: "+ node.src);  
          checkCurrentSrc(node, htmlImgElement => {
          maskAndSend(htmlImgElement, 'dynamicIMG');
          } ); 
        }
        // console.log("hasSrcset: "+ hasSrcSet);
          // const hasSource = node.parentElement && node.parentElement.querySelector('source');
          // if(hasSrcSet || hasSource){
          //   console.log(" mutateobserver detected & currentSrc used ");
          //   node.classList.add("imgMasking", 'dynamicIMG');
          //   checkCurrentSrc(node, htmlImgElement => {
          //     maskAndSend(htmlImgElement, 'dynamicIMG');
          //   } );
          // }s
          // else{
          //   maskAndSend(node, 'dynamicIMG');
          // }
        
      } else {
        
        // <img>가 아닌 요소가 들어온 경우: 자식 img 검색
        node.querySelectorAll('img').forEach(img => {

          if (!img.dataset.imgId) {
            if(img.dataset.imgId == "NOTHARMFUL") console.log("이미 수집한 중복 비유해 이미지");
            //console.log("mutateobserver detected |  " + "url: "+ img.src);
          checkCurrentSrc(img, htmlImgElement => {
              //console.log("currentSrc used: "+ htmlImgElement.currentSrc);
              maskAndSend(htmlImgElement, 'dynamicIMG');
          } );
          }
            // const hasSrcSet = !!node.getAttribute('srcset');
            // const hasSource = node.parentElement && node.parentElement.querySelector('source');
            // console.log("hasSrcset: "+ hasSrcSet);//thread에서 false 나옴. 왜?
            // if(hasSrcSet || hasSource){
            //   img.classList.add("imgMasking", 'dynamicIMG');
            //   console.log(" mutateobserver detected & currentSrc used ");
            //   checkCurrentSrc(img, htmlImgElement => {
            //     //console.log("currentSrc used: "+ htmlImgElement.currentSrc);
            //     maskAndSend(htmlImgElement, 'dynamicIMG');
            // } );
            // }
            // else{
            //   maskAndSend(img, 'dynamicIMG');
            // }
          
        });
      }
    });
  });
});



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
function pageInit() {

  // if(DOMLoadComplete) return;
  // DOMLoadComplete = true
    
    // ... static 이미지 처리 로직 ...
  Collect_staticImg();
  if(document.readyState!="loading"){
    imgObserver.observe(document.body, {
    childList: true, //자식
    subtree: true, //자손
    attributes: false
    });
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



