// 크롬 확장 프로그램 manifest에 "webRequest", "webRequestBlocking", "<all_urls>" 권한 필요

const successSet = new Set();
const totalSet = new Set();
const failMap = new Map();

// 이미지 요청 추적
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    // 이미지 요청만 필터
    if (details.type !== "image") return;

    const imageUrl = details.url;
    // 중복 요청 방지
    if (successSet.has(imageUrl) || failMap.has(imageUrl)) return;

    totalSet.add(imageUrl);

    try {
      const res = await fetch(imageUrl, { mode: "cors", cache: "no-store" });
      // "no-cors"로 요청하면 res.ok가 항상 false일 수 있으므로 status만 체크
      if (res.status >= 200 && res.status < 400) {
        console.log(`[이미지 성공] ${imageUrl} (status: ${res.status})`);
        console.log('%c ', `font-size:1px; padding:20px; background:url(${imageUrl}) no-repeat; background-size:contain;`);
      
        successSet.add(imageUrl);
      } else {
        // 이미지 데이터 받았으나 상태코드 이상
        const msg = `[이미지 수신 비정상] ${imageUrl} (status: ${res.status})`;
        console.warn(msg);
        failMap.set(imageUrl, msg);
      }
    } catch (err) {
      // fetch가 실제로 거부/차단된 경우
      let reason = "알 수 없는 오류";
      if (err instanceof TypeError) {
        reason = "CORS 정책 또는 네트워크/인증/캐시 문제";
      }
      const msg = `[이미지 실패] ${imageUrl} (원인: ${reason}, 상세: ${err.message})`;
      console.error(msg);
      failMap.set(imageUrl, msg);
    }
  },
  { urls: ["<all_urls>"] }
);

// 5초마다 누적 결과 콘솔 출력
setInterval(() => {
  const ok = successSet.size;
  const fail = failMap.size;
  console.log(`[5초 집계] 이미지 요청 결과 - 성공: ${ok}건, 실패: ${fail}건`);
}, 5000);


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "getSuccessImages") {
    sendResponse(Array.from(totalSet));
  }
});
