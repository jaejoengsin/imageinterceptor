
let testcnt = 0;
// let loadingImg = chrome.runtime.getURL("src/css/masking.css")
//const batchPort = chrome.runtime.connect({ name: 'batch' });


const link = document.createElement('link');
link.rel = 'stylesheet';
// 확장 프로그램 내부의 CSS 파일 경로를 설정합니다.
link.href = chrome.runtime.getURL('src/css/masking.css'); 
link.onload = () => {(console.log("masking 파일 로드 완료"));}; 
(document.head || document.documentElement).prepend(link);


// const overlayDiv = document.createElement('div');
// overlayDiv.id = 'extensionOverlay';
// document.documentElement.appendChild(overlayDiv); // html 바로 아래에 추가

// window.pageOverlay = overlayDiv;



if (window.top === window.self) {

  const overlayDiv = document.createElement('div');
overlayDiv.id = 'extensionOverlay';
document.documentElement.appendChild(overlayDiv); // html 바로 아래에 추가

window.pageOverlay = overlayDiv;
  // 메인 프레임에서만 실행할 코드
 const script = document.createElement('script');
 script.src = chrome.runtime.getURL('test/url_compare&image_tracking/injectedContent.js');  // 따로 파일로 뽑아 관리 가능
 (document.head || document.documentElement).prepend(script);
 link.onload = () => {
  (console.log("스크립트 주입 완료"));
  }; 

} else {
  // iframe에서만 실행할 코드
 const iframe_script = document.createElement('script');
 iframe_script.src = chrome.runtime.getURL('test/url_compare&image_tracking/iframe_injectedContent.js');  // 따로 파일로 뽑아 관리 가능
 (document.head || document.documentElement).prepend(iframe_script);
 link.onload = () => {
  (console.log( "스크립트 주입 완료"));
  
  }; 

}

// const script = document.createElement('script');
// script.src = chrome.runtime.getURL('src/js/injectedContent.js');  // 따로 파일로 뽑아 관리 가능
// (document.head || document.documentElement).prepend(script);
// link.onload = () => {
//   (console.log(scriptcnt+ "번째" + "스크립트 주입 완료"));
//   scriptcnt++;
// }; 




//batchPort.postMessage({ type: 'batch', data: batch });


// 메시지 수신 및 chrome.runtime 전송
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.origin !== window.origin) return; // 보안: 출처 필터링
  if (event.data?.source !== 'page-script') return; // 보안: 출처 확인
  if (event.data?.type === 'dataList') {
     const batch = event.data.data.map(data => data.url);
    //testcode
    // const textLines = batch.map(rec => JSON.stringify(rec)).join('\n');
    // const textBlob = new Blob([textLines], { type: 'text/plain' });
    // const textUrl = URL.createObjectURL(textBlob);

    // const a1 = document.createElement('a');
    // a1.href = textUrl;
    // a1.download = `${testcnt}nth_records.txt`;
    // document.body.appendChild(a1);
    // a1.click();
    // document.body.removeChild(a1);
    // URL.revokeObjectURL(textUrl);
    // testcnt++;
    //
    //chrome.runtime.sendMessage({ type: 'batch', data: batch });
  }
});


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
// addEventListener('pagehide', Flush());



