
import {updateDB } from '../modules/indexDb.js';
import {checkTimeAndRefetch} from '../modules/requestImgAnalyze.js';
import { CsBatchForWaiting } from '../global/backgroundConfig.js';
import {setNumOfHarmfulImgInStorageSession, addTotalNumOfHarmfulImg} from '../utils/backgroundUtils.js'

export async function propagateResBodyData(responseData) {
    const readyToSend = new Map(); // tabid : [imgData, ....]
    const numOfHarmfulImgInPageMap = new Map();
    let totalNumOfHarmfulWaitingImg = 0;
    updateDB(responseData);

    for (const [url, imgData] of CsBatchForWaiting) {
        if (responseData.has(url[1])) {
            const imgResData = responseData.get(url[1]);
            let frames;
            imgData.status = imgResData.status;
            imgData.harmful = imgResData.harmful;

            if (imgResData.harmful) {
                if(!numOfHarmfulImgInPageMap.has(url[0])){
                    numOfHarmfulImgInPageMap.set(url[0],0);
                }
                else {
                     numOfHarmfulImgInPageMap.set(url[0], numOfHarmfulImgInPageMap.get(url[0])+1);
                }
            }

            if (!readyToSend.get(imgData.tabId)) {
                frames = new Map();
                frames.set(imgData.frameId, [imgData]);
                readyToSend.set(imgData.tabId, frames);

            }
            else {
                frames = readyToSend.get(imgData.tabId);
                if (!frames.get(imgData.frameId)) frames.set(imgData.frameId, [imgData]);
                else frames.get(imgData.frameId).push(imgData);
            }

            CsBatchForWaiting.delete(url);
        }
    }
    sendWaitingCsDataToCs(readyToSend);//.then(res => { console.log("response status(WaitingCsData Sended): ", res); })contentscript와 runtimemessage 교신
    checkTimeAndRefetch();
    
    for(const [pageUrl, count] of numOfHarmfulImgInPageMap) {
        //console.log("pageCountInfo\n"+pageUrl+'\n'+count);
        await setNumOfHarmfulImgInStorageSession(pageUrl,count);//mutual exclusion로 인한 await. 나중에 공유 promise를 생성해서 서비스워커에서 기다리는 일이 없게 만들 수도 있음
        totalNumOfHarmfulWaitingImg+= count;
    }
   addTotalNumOfHarmfulImg(totalNumOfHarmfulWaitingImg);

    console.log("현재 기다리고 있는 content: " + CsBatchForWaiting.size);
}


export async function sendWaitingCsDataToCs(readyData) {
    let sendData;
    let sendDataOne;
    const result = [];
    for (const tabId of readyData.keys()) {
        sendData = readyData.get(tabId);
        for (const frameId of sendData.keys()) {
            sendDataOne = sendData.get(frameId);

            try {
                result.push(await chrome.tabs.sendMessage(tabId,
                    { type: "imgDataWaitingFromServiceWork", data: sendDataOne },
                    { frameId }
                ));
            } catch (e) {
                if (!e.message.includes('Could not establish connection')) console.error("contentscript 응답 오류[type: wating data]: ", e);//Receiving end does not exist → 잠시 후 재시도
            }

        }
    }
    console.log("contentscript 응답 결과[type: wating data]");
    result.forEach(res => { console.log(res); });
    console.log("총 수량: ", result.length);

  }

