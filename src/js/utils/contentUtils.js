//콘텐츠 스크립트에서 사용하는 utils


const harmfulImgMark = chrome.runtime.getURL('images/changedImg.svg');


export function changeImg(img, flag) {
    if (flag) {
        const originImgStyle = window.getComputedStyle(img);

        
        const imgParent = img.parentElement;
        if (imgParent){

           
            if (!imgParent.classList.contains('harmful-img-wrapper')) {
                
                const newWrapper = document.createElement('div');
                newWrapper.classList.add('harmful-img-wrapper');
    
            
              
                newWrapper.style.overflow = 'hidden';
                
                newWrapper.style.backgroundImage = `url(${harmfulImgMark})`;
                newWrapper.style.backgroundRepeat = 'no-repeat';
                newWrapper.style.backgroundSize = '24px 24px';
                newWrapper.style.backgroundPosition = 'center';
                // newWrapper.style.border = '1px solid black';
                // newWrapper.style.margin = '5px';
                newWrapper.style.setProperty('z-index', `9999`, 'important');


                imgParent.insertBefore(newWrapper, img);
                newWrapper.appendChild(img);
            }
            else {
                img.dataset.masking = "imgMasking";
                imgParent.style.backgroundImage = `url(${harmfulImgMark})`;
                imgParent.style.overflow = 'hidden';
                // imgParent.style.border = '';
                // imgParent.style.margin = '';
            }
        }
    }
    else {
        // img.style.top = "";
        // img.style.left = "";     
        // img.style.width = "";
        // img.style.height = "";
        // img.src = img.dataset.originalSrc;

        img.parentElement.style.backgroundImage = 'none';
        img.parentElement.style.overflow = 'auto';
        img.dataset.masking = "None";
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


  