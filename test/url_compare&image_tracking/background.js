import * as URLJs from './utils/normalize-url-main/index.js'


const batchMap = new Map();
const eventTimer = new Map();
const BATCH_LIMIT = 10;
const IDLE = 500;





/*
sortQueryParameters: true	파라미터 키를 알파벳 순으로 정렬하여 일관된 비교 문자열 생성 
removeQueryParameters: [/^utm_/, /^fbclid$/]	utm_*, fbclid 등의 추적 파라미터 제거
stripHash: true	URL의 #fragment 전체 삭제
stripTextFragment: true	텍스트 해시 (#:~:text=)까지 제거
stripWWW: true	www. 접두사 제거로 www 유무 차이 무시
removeTrailingSlash: true	경로 끝의 / 제거하여 /img와 /img/ 통일
normalizeProtocol: true	http://와 https:// 일관성 유지(기본값)
*/
async function canonicalizeImageUrl(rawUrl) {
  return await URLJs.default(rawUrl, {
    sortQueryParameters: true,
    removeQueryParameters: [/^utm_/, /^fbclid$/],
    stripHash: true,
    stripTextFragment: true,
    stripWWW: true,
    removeTrailingSlash: true,
    normalizeProtocol: true,
  });
}


async function confirmFlush(batch) {
 if (batch.size >= BATCH_LIMIT) {
    await flushBatch(tabId);
  }
  clearTimeout(idleT); //flushBatch 
  idleT = setTimeout(flushBatch, IDLE);
}



async function flushBatch(tabId) {
  const batch = batchMap.get(tabId);
  if(!batch || batch.length === 0 ) return;
  // 모든 canonicalUrlPromise가 끝나기를 기다림
  const resolvedBatch = await Promise.all(
    batch.map(async (item) => {
      let canonicalUrl;
      try {
        canonicalUrl = await item.canonicalUrlPromise;
      } catch (e) {
        console.log(item.url+"<-정규화 에러")
        canonicalUrl = item.url; //일단은 고유 url 넣고 push
      }
      return {
        canonicalUrl: canonicalUrl,   // 정규화 url, 인덱스/PK
        url: item.url,            // 원본 url
        domain: item.domain,         // (선택)
        harmful: item.harmful,
        checked: item.checked
      };
    })
  );
  await saveBatchToIndexDB(resolvedBatch);
  batchMap.set(tabId, []); // flush 후 비움
}



async function storeImage(tabId, url) {
  if(!batchMap.has(tabId)) {
    batchMap.set(tabId,[]);

  }
  const batch = batchMap.get(tabId);
  batch.push(
    {
    canonicalUrlPromise: canonicalizeImageUrl(url),
    domain: (new URL(url)).hostname.replace(/^www\./, '') ,//수정예정,
    url,
    harmful: false,   // 기본값
    checked: false,   // 검사완료
    }
  );
  
  if (batch.length >= BATCH_LIMIT) {
    await flushBatch(tabId);
  }

  if(!eventTimer.has(tabId)){
    eventTimer.set(tabId, setTimeout( async () => {
      try {
        await flushBatch(tabId);

      } catch(e) {
        console.error(e);
      }
    }), IDLE);
      
  }
  else{
    clearTimeout(eventTimer.get(tabId));
     eventTimer.set(tabId, setTimeout( async () => {
      try {
        await flushBatch(tabId);

      } catch(e) {
        console.error(e);
      }
    }), IDLE);
  }
}






/*webRequest로 이미지 네트워크 수신 감지*/
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    if (details.type === "image" && details.tabId >= 0) {
      await storeImage(details.tabId, details.url);
    }
  },
  { urls: ["<all_urls>"] },
  []
);















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
