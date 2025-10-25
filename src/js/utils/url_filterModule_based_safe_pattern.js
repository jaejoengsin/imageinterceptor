// url_filterModule_based_safe_pattern.js ─────────────────────────────
//data url(base64), blob data, url 끝에 붙는 확장자, CSS 스프라이트
const protoData   = new URLPattern({ protocol: 'data'   });
const protoBlob   = new URLPattern({ protocol: 'blob'   });
const extPattern  = new URLPattern({ pathname: '/*. :ext(svg|svgz|ico|cur|png)' });
const spritePat   = new URLPattern({ pathname: '*sprite*.{avif,webp}' });

//키워드
// 유해 이미지가 포함될 가능성이 낮은 키워드
const nameRegex   = /(?:\/|^)(logo|favicon|sprite|icons?|badge|twemoji|flag|emoji|spinner|loading|placeholder|blank|transparent|1x1|pixel|spacer|ajax-loader)[\w\-.]*\.(png|gif|svg|ico|cur|webp|avif)$/i;
//트래킹 픽셀/애널리틱스 - 1xx 크기의 gif일 확률이 높은 키워드
const trackRegex  = /(?:pixel|track|open)\.gif$/i;
//안전한 광고 키워드
const adSafeRegex = /adsafeprotected|brandshield|doubleclick.*gstatic|imagecache\/protect/i;

//화이트리스트 도메인 - 아이콘, 썸네일 등을 제공하는 도메인 제외
const WHITELIST = new Set([
  'gstatic.com', 'yt3.ggpht.com',
  'twemoji.maxcdn.com', 'cdnjs.cloudflare.com', 'www.gravatar.com',
]);


/* 스킴 & 확장자 검사 함수---------------------------------------------------- */
function matchProtocolOrExt(u) {
  return protoData.test(u) || protoBlob.test(u);
}

/* ❷ 키워드 검사 함수 ---------------------------------------------------- */
function matchKeyword(u) {
  return nameRegex.test(u.pathname);
}

/* ❸ 작게 명시된 쿼리 파라미터 (≤64)기반 검사 함수 -------------------------------- */
function matchTinySize(u) {
  return ['w','h','width','height','size','s','quality','q']
    .some(k => {
      const v = parseInt(u.searchParams.get(k), 10);
      return !Number.isNaN(v) && v <= 64;
    });
}

/* 화이트리스트 CDN 검사 함수 ------------------------------------------------- */
function matchWhitelist(u) {
  const host = u.hostname.replace(/^www\./, '');
  return [...WHITELIST].some(h => host === h || host.endsWith(`.${h}`));
}

/* ❺ 트래킹 픽셀 & 안전한 광고 검사 함수 -------------------------------------- */
function matchTracking(u) { return trackRegex.test(u.pathname); }
function matchAdSafe (u) { return adSafeRegex.test(u.href);    }

/* 규칙 검사를 위한 함수 모음 (함수 원형 배열) ------------------------------------------- */

export const SAFE_RULES = [
  matchProtocolOrExt
];

/* ❼ 단일 헬퍼 -------------------------------------------------------- */
export function filter_based_safeUrlPattern(url) {
  let result;
  try{
   result = SAFE_RULES.some(fn => fn(url));
  } catch(e) {
    console("비유해 이미지 필터링 중 오류 발생, url: ", url);
    return false;
  }
  return result;
}
