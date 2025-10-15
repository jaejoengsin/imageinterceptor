//checking image 

const DISALLOWED_EXT = ['svg', 'svgz', 'ico', 'cur', 'png'];
const DISALLOWED_MIME = ['image/svg+xml', 'image/png', 'image/x-icon', 'image/vnd.microsoft.icon']; // 확장자에 대응하는 MIME
const MIN_WIDTH = 100;
const MIN_HEIGHT = 100;
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (예시)


// URL에서 확장자 추출 후 필터링
export function discardUnnecessaryImgbyUrl(url) {
    try {
        const pathname = new URL(url).pathname.toLowerCase();
        const ext = pathname.split('.').pop().split('?')[0].split('#')[0];
        console.log("url 처리 후 결과:"+ ext);
        return DISALLOWED_EXT.includes(ext);
    } catch (e) {
        return false;
    }
}

// MIME 타입 필터링
function discardUnnecessaryImgByMime(mimeType) {
    if (typeof mimeType === 'string') {
        return DISALLOWED_MIME.some(t => mimeType.startsWith(t));
    }
    return false;
}


export async function discardUnnecessaryImgBlob(blob) {
    // MIME 타입 필터
    if (discardUnnecessaryImgByMime(blob.type)) {
        return true;
    }
    // 파일 크기 검사
    if (blob.size > MAX_FILE_SIZE) {
        return true;
    }
    // ImageBitmap으로 픽셀 크기 검사
    const imageBitmap = await createImageBitmap(blob);
    const w = imageBitmap.width;  // ImageBitmap.width는 CSS 픽셀 단위의 너비를 반환:contentReference[oaicite:3]{index=3}
    const h = imageBitmap.height;
    return (w < MIN_WIDTH || h < MIN_HEIGHT || w > MAX_WIDTH || h > MAX_HEIGHT); //true -> discard
  }
