import { createRandomImgID } from "../utils/contentUtils.js";
import * as filterModule from "../utils/url_filterModule_based_safe_pattern.js";
import { getPermissionForMasking} from "../global/contentConfig.js";
import dataBuffer from "../global/buffer.js";
import { maybeFlush } from "../utils/flush.js";



let totalimg = 0;
let NoNSafeImgCount = 0;

//상대경로 -> 절대경로
function toAbsoluteUrl(url, baseUrl = document.baseURI) {
  try {
    return new URL(url, baseUrl);
  } catch {
    return url;
  }
}

/**.
 * @param {object} img - dom 이미지 노드
 * @param {string} type - 정적 교체/동적 교체 기록
 */
function checkConditionAndSend(img, type) {
  const url = img.currentSrc || img.src;
  let absUrl;
  if (!url || url === '') {
    console.error("error: url NOT FOUND\nID:", img.dataset.imgId);

    return;          // 빈 URL 걸러냄
  }
  try {
    absUrl = toAbsoluteUrl(url, document.baseURI);
    if (filterModule.filter_based_safeUrlPattern(absUrl)) {
      img.dataset.masking = "None";
      NoNSafeImgCount++;
      console.log("비유해 이미지:", absUrl.toString(), +"\n", img.dataset.imgId , "  총합:", NoNSafeImgCount);
      return;
    }
  } catch (e) {
    console.error("URL 정규화 과정&비유해이미지 필터링 중 오류 발생: - ", e);
    console.error("오류를 발생시킨 이미지의 url:", url);
    return;
  }
  img.dataset.type = type; //static | dynamic img

  dataBuffer.push({ id: img.dataset.imgId, url: absUrl.toString(), harmful: false, status: false });
  maybeFlush();
}

//currentsrc에 값이 생길때까지 다음 repaint 턴을 비동기적으로 기다리고, 반복.
function checkCurrentSrc(img, callback, timeout = 1000) { //lazy loading으로 인해 기다리는 시간이 얼마나 지속되느냐에 따라 currentSrc를 얻을 수도 있고 못 얻을 수도 있음. 특히 유튜브 같은
  //동적 사이트 대상
  const start = performance.now();
  function check() {
    if (img.currentSrc && img.currentSrc !== '') {
      callback(img);
    } else if (performance.now() - start > timeout) {
      console.log("!warning!: currentSrc 값 생성 전에 제한 시간을 초과하였습니다. 추후 이미지 마스킹 해제에 실패할 수 도 있습니다")
      callback(img);
    } else {
      requestAnimationFrame(check);
    }
  }

  requestAnimationFrame(check);
}

/**
 * 
 * @param {HTMLElement} node img node
 * @param {number} topMargin 상단 여백을 뷰포트 높이의 배수로 설정. 기본값은 2
 * @param {number} bottomMargin 하단 여백을 뷰포트 높이의 배수로 설정. 기본값 1
 * @returns {boolean} 요소가 지정된 범위 안에 있으면 true, 아니면 false.
 */
function isElementInViewport(node, topMargin = 1, bottomMargin = 1) {
  const rect = node.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // 뷰포트 상단에서 topMargin 배수만큼 떨어진 위치
  const topThreshold = viewportHeight * topMargin;
  // 뷰포트 하단에서 bottomMargin 배수만큼 떨어진 위치
  const bottomThreshold = -viewportHeight * bottomMargin;

  // 요소의 상단이 topThreshold보다 작고, 요소의 하단이 bottomThreshold보다 커야 합니다.
  return rect.top < topThreshold && rect.bottom > bottomThreshold;
}

//checkCurrentSrc로 requestAnimationFrame 시점에 maskandsend 호출. currentSrc를 안정적으로 얻기 위함.
//언제 다시 이미지가 들어올지 모르므로 일단 disconnect는 안함
//이미지 노드에 srcset이 존재하거나 source 태그가 존재할 경우 브라우저가 srcset을 선택하여 렌더링할 수 도 있음. 이 경우
// srcset이 서비스 워커 데이터 베이스에 등록되며 어떤 srcset이 등록되는지 예측할 수 없으므로 src를 기준으로 함. 따라서 이 경우 src의 url로 데이터베이스 재등록 및 해당 url로 재요청

class imageObservers {

  constructor() {

    this.imgIdList = [];
    this.IsObsvActive = false;

    this.imgViewObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const imgObj = entry.target;
        if (!isElementInViewport(imgObj)) return;
        // console.log("imgviewObserver observe entry, id: ",imgObj.dataset.imgId);
        checkCurrentSrc(imgObj, htmlImgElement => {
          checkConditionAndSend(htmlImgElement, 'dynamicIMG'); //maskAndSend를 바로 호출해도 문제 없는 것을 확인하였으나 안정성을 위해 이렇게 함
        });
        this.imgViewObserver.unobserve(imgObj);
        let rmIdx = this.imgIdList.indexOf(imgObj.dataset.imgId);
        if (rmIdx !== -1) {
          this.imgIdList.splice(rmIdx, 1);
        }

      });

    }, {
      root: null,
      rootMargin: "40% 0px 0px 0px",
      threshold: 0, //rootMargin: 0px, threshold: 0으로 해도 작동이 가능하나, 안정성을 위해 일단 수치를 조금 높인 상태
    });

    this.imgObserver = new MutationObserver(mutations => {
      const elements = [];
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType !== 1 || node.classList.contains('harmful-img-wrapper')) return;  // element만 처리
            else if (node.tagName === 'IMG') {

              if (!node.dataset.imgId) {
                createRandomImgID(node);
                elements.push(node);
                // console.log("이미지의 id는: ", node.dataset.imgId);
              }
              else return;

            } else {
              // <img>가 아닌 요소가 들어온 경우: 자식 img 검색
              node.querySelectorAll('img').forEach(img => {
                // img.style.setProperty('visibility', 'hidden', 'important');
                // img.style.setProperty('opacity', '0', 'important');
                if (!img.dataset.imgId) {
                  createRandomImgID(img);
                  elements.push(img);
                  // console.log("이미지의 id는: ", img.dataset.imgId);
                }


              });
            }
          });
        }

      });
      totalimg += elements.length;
      // console.log("total IMG: ", totalimg)

      elements.forEach(el => {
        requestAnimationFrame(() => {
            if (getPermissionForMasking()) el.dataset.masking = 'imgMasking';
          else el.dataset.masking = '';
          // el.classList.add('imgMasking');//다음 렌더 사이클에서 마스킹
          this.imgIdList.push(el.dataset.imgId);
          this.imgViewObserver.observe(el);//렌더링, 레이아웃 정리가 제대로 이루어지지 않은 상태에서 감지될 수 있으므로 한 프레임 쉬고 호출

        });
      });
    });
  }

  imgObserve() {
    this.imgObserver.observe(document.body, {
      childList: true, //자식
      subtree: true, //자손

    });
  }

  disconntectObeserver() {

    this.IsObsvActive = false;
    this.imgViewObserver.disconnect();
    const remainImgs = this.imgObserver.takeRecords();
    this.imgObserver.disconnect();
    console.log(this.imgIdList.length);

    const maskedImgs = document.querySelectorAll(`img[data-img-id]`);
    maskedImgs.forEach(img => {
      img.dataset.masking = "None";
    });
    // if(this.imgIdList.length > 0){

    //   this.imgIdList.forEach(id => {

    //       const img = document.querySelector(`img[data-img-id="${id}"]`);
    //       if(img){
    //         img.dataset.masking = "None";
    //       }
    //   });

    // }

    if (remainImgs.length > 0) {
      remainImgs.forEach(remainImg => {
        remainImg.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;  // element만 처리
          if (node.tagName === 'IMG') {

            if (!node.dataset.imgId) {
              this.imgIdList.push(createRandomImgID(node));
            }
            else return;

          } else {

            node.querySelectorAll('img').forEach(img => {
              if (!img.dataset.imgId) {
                this.imgIdList.push(createRandomImgID(img));
              }
            });

          }

        });
      });

    }
    // if(dataBuffer.length>0){
    //   console.log(dataBuffer.length);
    //   dataBuffer.forEach(item => {
    //     const id = item.id;
    //     const img = document.querySelector(`img[data-img-id="${id}"]`);
    //     if (img) {
    //       img.dataset.masking = "None";
    //     }

    //   });
    // }
  }

  reconnectObeserver() {

    this.IsObsvActive = true;
    this.imgObserve();

    if (this.imgIdList.length > 0) {
      this.imgIdList.forEach(id => {
        const img = document.querySelector(`img[data-img-id="${id}"]`);
        if (img) {
          img.dataset.masking = "imgMasking";
          this.imgViewObserver.observe(img);
        }
      })
    }
    if (dataBuffer.length > 0) {
      dataBuffer.forEach(item => {
        const img = document.querySelector(`img[data-img-id="${item.id}"]`);
        if (img) img.dataset.masking = "imgMasking";
        maybeFlush();

      });
    }
    console.log("observer reconnected");
  }
}


const IMGObs = new imageObservers();
export default IMGObs;