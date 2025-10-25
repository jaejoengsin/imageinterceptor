//checking image 

//png도 유해 이미지일 수도 있어서 확장자 제외. 이 경우 파일 크기를 통해 분류
const DISALLOWED_EXT = ['svg', 'svgz', 'ico', 'cur'];

//확실히 유해 이미지가 아닌 키워드 -> 키워드 기반 필터링은 제외
// const DISALLOWED_KEYWORD = []
const DISALLOWED_MIME = ['image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']; // 확장자에 대응하는 MIME

//파일 크기에서 어느 정도 걸러지므로 최대, 최소 크기는 고려 안함. 유해 이미지가 이 기준 때문에 걸러질 수도 있음
// const MIN_WIDTH = 100;
// const MIN_HEIGHT = 100;
const MAX_WIDTH = 2000;
const MAX_HEIGHT = 1000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (예시)
const MIN_FILE_SIZE = 4500; //약 4~5KB

// URL에서 확장자 추출 후 필터링
//1. 파일 확장자 기반 필터
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
    if (blob.size < MIN_FILE_SIZE ||blob.size > MAX_FILE_SIZE) {
        console.log("파일 크기가 너무 작거나 큽니다: " , blob.size);
        return true;
    }
    // if (discardUnnecessaryImgByMime(blob.type)) {
    //     return true;
    // }
    // 파일 크기 검사
    // ImageBitmap으로 픽셀 크기 검사
    const imageBitmap = await createImageBitmap(blob);
    const w = imageBitmap.width;  // ImageBitmap.width는 CSS 픽셀 단위의 너비를 반환:contentReference[oaicite:3]{index=3}
    const h = imageBitmap.height;
    return (w > MAX_WIDTH || h > MAX_HEIGHT); //true -> discard
  }
