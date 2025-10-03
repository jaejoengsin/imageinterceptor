//콘텐츠 스크립트에서 사용하는 utils


const harmfulImgMark = chrome.runtime.getURL('icons/main_icon.png');
export function changeImg(img, flag) {
    if (flag) {
        img.src = harmfulImgMark;
        img.style.backgroundColor = 'white';
        img.style.objectFit = 'contain';
        img.style.objectPosition = 'center';
    }
    else {
        img.style.backgroundColor = '';
        img.style.objectFit = '';
        img.style.objectPosition = '';
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


  