import { trackAndReplaceImg } from "./trackAndReplaceImg";
import { terminateContentScript } from "./terminate";
import dataBuffer from "../global/buffer";
import { getInterceptorActive } from "../global/contentConfig";


const MAX_N = 16, IDLE = 50;

let idleT = null;

export function maybeFlush() {
    if (dataBuffer.length >= MAX_N) Flush();
    clearTimeout(idleT);
    idleT = setTimeout(Flush, IDLE);
}


function Flush() {
    if (!dataBuffer.length || !getInterceptorActive()) return;
    if (!chrome?.runtime) {
        //함수 호출?
        terminateContentScript('can not use chrome.runtime anymore. extension may be reloaded or disabled');
    }
    const batchFromContentScript = dataBuffer.splice(0, dataBuffer.length).filter(item => document.querySelector(`img[data-img-id="${item.id}"]`)); // 0부터 dataBuffer.length번째 인덱스(전체)를 복사한 객체 반환 & 해당 크기만큼 기존 객체 내 원소 삭제 -> 0으로 초기화

    try {
        chrome.runtime.sendMessage({
            source: "content",
            type: "imgDataFromContentScript",
            data: batchFromContentScript, // 20개만 보내고, 배열은 자동으로 비움
        },
            function (response) {
                const err = chrome.runtime.lastError;
                if (err) {
                    throw new Error('chrome.runtime 메세지 송신이 불가능합니다. extension을 새로고침하였을 가능성이 높습니다');
                }
                console.log("service worker 송신:" + batchFromContentScript.length + "--------------" + "수신" + response.data.length);
                trackAndReplaceImg(response);

            })
    } catch (e) {
        terminateContentScript(e.message);
    }
}

