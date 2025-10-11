import { propagateResBodyData} from '../utils/propagate.js';
import {DB, reqTablePromise} from './indexDb.js';
import { CsBatchForWaiting, getCurrentFilteringStepValue } from '../global/backgroundConfig.js';

const retryThreshold = 15 * 1000;

// export async function fetchBatch(CsImgData, tabId) {

//   console.log("fetchdata:" + CsImgData.length);

//   let CsImgDataForFetch = null;
//   try {
//     const tab = await chrome.tabs.get(tabId);
//     const refererUrl = tab.url;

//     CsImgDataForFetch = await Promise.all(
//       CsImgData.map(async imgdata => {
//         const content = await fetchAndReturnBase64Img(imgdata.url, refererUrl);
//         return {
//           url: imgdata.url,
//           content: content,
//           status: imgdata.status,
//           harmful: imgdata.harmful
//         };
//       })
//     );

//   } catch (err) {
//     console.error("이미지 실제 데이터 fetch 과정 중 에러 발생: ", err);
//   }

//   const bodyData = JSON.stringify({ data: CsImgDataForFetch });

//   try {

//     const start = performance.now();
//     console.log("fetch!: ", CsImgDataForFetch.length);
//     const res = await fetch("https://image-interceptor-test-683857194699.asia-northeast3.run.app", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: bodyData
//     });

//     if (!res.ok) throw new Error("서버 응답 오류");// catch로 이동
//     console.log(`response delaytime: ${(performance.now() - start) / 1000}`);

//     const responseBodyData = await res.json()?.then(result => { return result?.data?.images });
//     if (responseBodyData.length > 0) {
//       propagateResBodyData(new Map(responseBodyData.map((el) => {
//         return [el.url, { url: el.url, response: true, status: el.status, harmful: el.harmful }];
//       })));
//     } else console.log("cause - fetch response: bodydata 없음");
//   } catch (err) {
//     console.error(
//       err instanceof SyntaxError
//         ? `JSON parsing failed: ${err.message}`
//         : `Request failed: ${err.message}`
//     );
//   }
// }


/////실험 함수
// Blob을 Base64 문자열로 변환하는 헬퍼 함수
 function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob); // Blob을 읽어 Base64 데이터 URI로 변환 시작
    reader.onloadend = () => {
      resolve(reader.result); // 변환 완료 시 Base64 문자열 반환
    };
    reader.onerror = (error) => {
        reject(error); // 에러 발생 시 거부
    };
  });
}



/////
 async function fetchAndReturnBase64Img(url, refererUrl) {
    return new Promise(async (resolve, reject) => {
    try {

      const res = await fetch(url, {
        headers: {
          'Referer': refererUrl
        }
      });
      const resBlob = await res.blob();
      const Base64 = await blobToBase64(resBlob).then(resNotFilterd => { return resNotFilterd.split(',')[1]; });
      return resolve(Base64);

    } catch (error) {

      return reject(error);
    };

  });
}

async function fetchAndReturnBlobImg(url, refererUrl) {
  return new Promise(async (resolve, reject) => {
    try {

      const res = await fetch(url, {
        headers: {
          'Referer': refererUrl
        }
      });
      const resBlob = await res.blob();
      return resolve(resBlob);

    } catch (error) {

      return reject(error);
    };

  });
}



export async function checkTimeAndRefetch() {
  const reFetchData = new Map();

  const tx = DB.transaction('imgURL', 'readwrite');
  const store = tx.objectStore('imgURL');

  for (const [url, imgData] of CsBatchForWaiting) {
    
    let dbValue = await reqTablePromise(store.get(url[1])).then(result => {
      return result;
    }).catch(error => {
      console.error("table에서 key 조회하고 value 가져오는 중에 Error 발생:", error);
    });
    if (retryThreshold < (Date.now() - dbValue.saveTime)) {
      if (!reFetchData.get(imgData.tabId)) {
        reFetchData.set(imgData.tabId, [imgData]);
      }
      else {
        reFetchData.get(imgData.tabId).push(imgData);
      }

      dbValue.saveTime = Date.now();
      await reqTablePromise(store.put(dbValue));
    }
  }

  for (const [tabId, imgDataArr] of reFetchData) {
    fetchBatch(imgDataArr, tabId);
  }
  await tx.done?.();

}

//createImageBitmap으로 지원 안하는 이미지: svg
//image 객체를 생성해서 우회적으로 해결해야 함. 그러나 비유해 이미지 필터에서 해당 유형의 이미지를 미리 걸러낼 예정이기 때문에 현재 수정 안한 상태
async function resizeAndSendBlob(blob, width, height) {
    // Blob을 ImageBitmap으로 변환
    const imageBitmap = await createImageBitmap(blob);

    // OffscreenCanvas 생성
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d');

    // 캔버스에 그리기
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Blob으로 변환
    const resizedBlob = await offscreen.convertToBlob({
        type: 'image/webP',
        quality: 0.95
    });

    return resizedBlob;
  }


export async function fetchBatch(CsImgData, tabId) {

  //let CsImgDataForFetch = null;
  let formData = new FormData();
  let tabUrl;
  try {
    const tab = await chrome.tabs.get(tabId);
    tabUrl = tab.url;

    // CsImgDataForFetch = await Promise.all(
    //   CsImgData.map(async imgdata => {
    //     const content = await fetchAndReturnBase64Img(imgdata.url, refererUrl);
    //     return {
    //       url: imgdata.url,
    //       content: content,
    //       status: imgdata.status,
    //       harmful: imgdata.harmful
    //     };
    //   })
    // );
    await Promise.all(
      CsImgData.map(async imgdata => {
        const imgBlob = await fetchAndReturnBlobImg(imgdata.url, tabUrl);
        let resizedImgBlob;

        try{
          resizedImgBlob = await resizeAndSendBlob(imgBlob, 224, 224);
        }
        catch(err){
          throw new Error("| resize과정에서 오류 발생 "+ err);
        }
        const imgMetaJson = JSON.stringify(
          {
            url: imgdata.url,
            status: imgdata.status,
            harmful: imgdata.harmful,
            level: getCurrentFilteringStepValue()
          }
        );
        formData.append('images', resizedImgBlob);
        formData.append('imgMeta', imgMetaJson);
      })
    );

  } catch (err) {
    console.error("body data 처리 및 준비 과정 중 에러 발생:", err);
  }

  //const bodyData = JSON.stringify({ data: CsImgDataForFetch });

  try {

    const start = performance.now();
    console.log(`<--fetch!-->\n total: ${CsImgData.length}\nlevel:${getCurrentFilteringStepValue() }`);
    let res;
    if (tabUrl.includes("youtube.com") ){
      res = await fetch("https://image-interceptor-youtube-683857194699.asia-northeast3.run.app", {
        method: "POST",
        body: formData
      });
    }
    else {
      res = await fetch("https://image-interceptor-develop-683857194699.asia-northeast3.run.app", {
        method: "POST",
        body: formData
      });

    }
    if (!res.ok) throw new Error("서버 응답 오류");// catch로 이동
    console.log(`response delaytime: ${(performance.now() - start) / 1000}`);

    const responseBodyData = await res.json()?.then(result => { return result?.image });
    if (responseBodyData.length > 0) {

      const processedResBodyData = new Map(responseBodyData.map((el) => {
        return [el.url, { url: el.url, response: true, status: el.status, harmful: el.harmful }];
      }));

      propagateResBodyData(processedResBodyData);

    } else throw new Error("cause - fetch response: bodydata 없음");
  } catch (err) {
    console.error(
      err instanceof SyntaxError
        ? `JSON parsing failed: ${err.message}`
        : `Request failed: ${err.message}`
    );
  }
}

// REQUEST DATA
// [
//   {
//     canonicalUrl: item.canonicalUrl,
//       url: item.url,
//         status: false,
//           harmful: false
//   }
// ]
// RESPONSE DATA example
// {
//     "data": [
//         {
//             "canonicalUrl": "https://www.google.com/pagead/1p-user-list/962985656/?backend=innertube&cname=1&cver=2_20250807&data=backend%3Dinnertube%3Bcname%3D1%3Bcver%3D2_20250807%3Bel%3Dadunit%3Bptype%3Df_adview%3Btype%3Dview%3Butuid%3Dtdz9LWNNQKUg4Xpma_40Ug%3Butvid%3D4ByJ0z3UMNE&is_vtc=0&ptype=f_adview&random=428766496&utuid=tdz9LWNNQKUg4Xpma_40Ug",
//             "url": "https://www.google.com/pagead/1p-user-list/962985656/?backend=innertube&cname=1&cver=2_20250807&data=backend%3Dinnertube%3Bcname%3D1%3Bcver%3D2_20250807%3Bel%3Dadunit%3Bptype%3Df_adview%3Btype%3Dview%3Butuid%3Dtdz9LWNNQKUg4Xpma_40Ug%3Butvid%3D4ByJ0z3UMNE&is_vtc=0&ptype=f_adview&random=428766496&utuid=tdz9LWNNQKUg4Xpma_40Ug",
//             "status": true,
//             "harmful": false,
//             "category": "medical",
//             "score": 0.4,
//             "details": {
//                 "adult": 1,
//                 "spoof": 1,
//                 "medical": 2,
//                 "violence": 2,
//                 "racy": 2
//             },
//             "processed": true,
//             "error": false,
//             "error_message": null,
//             "error_type": null
//         }
//     ],
//     "summary": {
//         "total": 1,
//         "processed": 1,
//         "harmful": 0,
//         "safe": 1,
//         "errors": 0,
//         "error_types": {}
//     },
//     "message": "총 1개 이미지 중 1개 처리 완료 (배치 API 호출: 1회로 1개 이미지 동시 처리)"
// }
