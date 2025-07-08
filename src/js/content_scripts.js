
const dataBuffer = [];
const MAX_N = 500, IDLE = 2000;
let idleT = null

const batchPort = chrome.runtime.connect({ name: 'batch' });

function maybeFlush() {
  if (buf.length >= MAX_N) Flush();
  clearTimeout(idleT);
  idleT = setTimeout(Flush, IDLE);
}

function Flush() {
  if (!dataBuffer.length) return;
  const batch = buf.splice(0, dataBuffer.length); // 0부터 dataBuffer.length번째 인덱스(전체)를 복사한 객체 반환 & 해당 크기만큼 기존 객체 내 원소 삭제 -> 0으로 초기화

  // 모든 rec.id 가 이미 채워져 있음 → 바로 전송
  batchPort.postMessage({ type: 'batch', data: batch });
}
  


const imgSrcObject = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');


if (!imgSrcObject || !imgSrcObject.set)
  console.log(imgSrcObject+"객체 오류");


Object.defineProperty(HTMLImageElement.prototype, 'src', {
  configurable: true, //프로퍼티 삭제 및 변경 가능 여부
  enumerable: imgSrcObject.enumerable, //for...in 등 열거 가능 여부
  get: imgSrcObject.get,

  set: function (url) {
    // css로 이미지 감추기
    this.style.setProperty('visibility', 'hidden', 'important');
    native.set.call(this, newURL); //후킹하기 전에 보관해 둔 기존 src 세터를 호출하여  <img> 요소를 this로, 새 URL을 인수로 넘겨서 정상적인 컨텍스트로 실행 -> 원본 이미지 다운로드
    
    // Generate SHA-256 based id and update attributes & store meta data.
    generateSHA256(url).then(hash => {
      dataBuffer.push({ id: hash, url: url, harmful: false, sended: false });
      this.dataset.imgId = hash;
      maybeFlush();
    });

  }
});



//다른 탭을 사용중일때, 15초마다 확인.
setInterval(() => { if (dataBuffer.length) flush(); }, 15000);
//페이지가 감추어졌을때
addEventListener('pagehide', flush);