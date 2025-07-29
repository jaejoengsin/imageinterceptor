
const dataBuffer = [];
const MAX_N = 500, IDLE = 2000;
// const DOMLoadComplete = false;
let idleT = null
let testcnt = 0;

setInterval(() => {
  const a = document.querySelectorAll('img');
  console.log(a.length);
}, 1000);



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


function Flush() {
  if (!dataBuffer.length) return;
  const batch = dataBuffer.splice(0, dataBuffer.length); // 0부터 dataBuffer.length번째 인덱스(전체)를 복사한 객체 반환 & 해당 크기만큼 기존 객체 내 원소 삭제 -> 0으로 초기화

  // 모든 rec.id 가 이미 채워져 있음 → 바로 전송
   window.postMessage({
    source: 'page-script', // 콘텐츠 스크립트가 출처 확인용으로 사용
    type: 'dataList',
    data: batch
  }, window.origin); //마지막 인자는 어디로 보낼지

}


function maskAndSend (img, type) {
  
  if (img.classList.contains('imgMasking')) return;

  img.classList.add("imgMasking", type); //일단은 static 이미지는 static이라고 클래스에 명시. 현재는 클래스 사용. 나중에 필요하면 새로운 속성을 추가하는 식으로 바꿀수도
// Generate SHA-256 based id and update attributes & store meta data.
  generateSHA256(img.src).then(hash => {
    dataBuffer.push({ id: hash, url: img.src, harmful: false, sended: false });
    img.dataset.imgId = hash;
    maybeFlush();
  }).catch(error => {
      console.error("static 이미지 해싱 중 오류 발생:", img.src, error);
  });


}


const imgSrcObject = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
if (!imgSrcObject || !imgSrcObject.set)
  console.log(imgSrcObject+"src 속성을 불러오지 못했습니다");


Object.defineProperty(HTMLImageElement.prototype, 'src', {
  configurable: false, //프로퍼티 삭제 및 변경 가능 여부
  enumerable: imgSrcObject.enumerable, //for...in 등 열거 가능 여부
  get: imgSrcObject.get,
  set: function (url) {
    // if (this.src !== transparentGif) {
    //   imgSrcObject.set.call(this, transparentGif);
    //     }
    // css로 이미지 감추기
    // const transparentGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    // this.src = transparentGif;
    maskAndSend(this,"dynamicIMG")
    imgSrcObject.set.call(this, url); //후킹하기 전에 보관해 둔 기존 src 세터를 호출하여  <img> 요소를 this로, 새 URL을 인수로 넘겨서 정상적인 컨텍스트로 실행 -> 원본 이미지 다운로드
    console.log("함수 활성화!"+"url:"+url);
  }
});

//다른 탭을 사용중일때, 15초마다 확인.
setInterval(() => { if (dataBuffer.length) Flush(); }, 15000);
//페이지가 감추어졌을때

addEventListener('pagehide', Flush());











