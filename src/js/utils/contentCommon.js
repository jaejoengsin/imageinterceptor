
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


  