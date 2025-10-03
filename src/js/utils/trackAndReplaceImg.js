import {changeImg} from './contentUtils.js';
import {getPermissionForMasking} from '../global/contentConfig.js';


let ALLremoveFalse = 0;
let ALLremoveTrue = 0;
export function trackAndReplaceImg(responseFromSW) {


    const responseBatch = responseFromSW.data; // 배열 [{ id, url, ... }, ...]
    let removeFalse = 0;
    let removeTrue = 0;
    let totalStatus = 0;
    let succeedStatus = 0;
    let isHarmful = 0;

    responseBatch.forEach(item => {
        totalStatus++;

        console.log("id: " + item.id);
        try {

            if (item.status) {
                succeedStatus++;
                const object = document.querySelector(`img[data-img-id="${item.id}"]`);

                if (item.harmful) {
                    if (object) {

                        removeTrue++;
                        // object.style.removeProperty('visibility');
                        // object.style.removeProperty('opacity');

                        console.log("유해 이미지: " + item.url);
                        //object.style.border = "8px solid red";
                        object.dataset.originalSrc = object.src;
                        if (getPermissionForMasking()) {
                            changeImg(object, true);
                            // myImage.style.backgroundColor = 'white';
                            // myImage.style.objectFit = 'contain';
                            // imageElement.style.objectPosition = 'center'; 
                            // object.src = harmfulImgMark;

                        }

                        // object.classList.remove('imgMasking');

                        object.dataset.masking = "None";

                        object.dataset.type += " Harmful";

                    }
                    else {
                        removeFalse = removeFalse + 1;
                        console.log("실패 id: " + item.id);
                    }

                    isHarmful++;
                }

                else {



                    if (object) {

                        removeTrue++;
                        // object.style.removeProperty('visibility');
                        // object.style.removeProperty('opacity');

                        // object.classList.remove('imgMasking');

                        object.dataset.masking = "None";

                        console.log("성공 id: " + item.id);
                        //object.style.border = "8px solid blue";

                    }
                    else {
                        removeFalse = removeFalse + 1;
                        console.log("실패 id: " + item.id);
                    }

                }

            }
            else {

                const object = document.querySelector(`img[data-img-id="${item.id}"]`);
                if (object) {
                    removeTrue++;
                    // object.style.removeProperty('visibility');
                    // object.style.removeProperty('opacity');

                    object.dataset.masking = "None";

                    // object.classList.remove('imgMasking');
                    console.log("성공 id: " + item.id);
                    //object.style.border = "8px solid blue";

                }
                else {
                    removeFalse = removeFalse + 1;
                    console.log("실패 id: " + item.id);
                }

            }
        }
        catch (e) {
            throw new Error("응답 데이터 마스킹 해제 중에 오류 발생: " + e.message);
        }
    }
    );
    ALLremoveFalse += removeFalse;
    ALLremoveTrue += removeTrue;
    console.log(`서비스 워커 응답 이미지 결과: ${totalStatus}/${succeedStatus}/${(totalStatus - succeedStatus)}/${isHarmful}[총합/이미지 분석 성공/이미지 분석 실패/유해이미지]`);
    console.log(`마스킹 해제 결과: ${totalStatus}/${removeTrue}/${removeFalse}/${isHarmful}[총합/성공/실패/유해이미지]`);
    console.log(`누적 합계: ${ALLremoveTrue}/${ALLremoveFalse}/${(ALLremoveTrue + ALLremoveFalse)}[누적 성공/누적 실패/총 누적 합] | 성공률: ${(ALLremoveTrue / (ALLremoveFalse + ALLremoveTrue)).toFixed(2)}`);

}
