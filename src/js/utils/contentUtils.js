//콘텐츠 스크립트에서 사용하는 utils


const harmfulImgMark = chrome.runtime.getURL('icons/main_icon.png');
export function changeImg(img, flag) {
    if (flag) {
        img.src = harmfulImgMark;
        //기존 코드
        img.style.backgroundColor = 'white';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center';
        // img.style.position = "absolute";          // 절대 위치
        // img.style.top = "0";                      // 상단
        // img.style.right = "0";                    // 우측
        // img.style.width = "50px";                 // 최대 폭
        // img.style.height = "50px";                // 최대 높이
        
        img.style.background = "white"; 
    }
    else {
        img.style.backgroundColor = '';
        img.style.objectFit = '';
        img.style.objectPosition = '';
        //추가
        // img.style.position = ""; 
        // img.style.width = "";                 // 최대 폭
        // img.style.height = "";  
        //
        img.src = img.dataset.originalSrc;

    }

}


/**.
 * @param {htmlImgElement} img - dom 이미지 객체
 */
export function createRandomImgID(img) {
    const ID = crypto.randomUUID();
    img.dataset.imgId = ID;
    return ID;
}


  