

export async function setNumOfHarmfulImgInStorageSession(url, numOfHarmfulImg) {
  const storedData = await chrome.storage.session.get(['numOfHarmfulImgInPage']);
  let numOfHarmfulImgInPage = storedData.numOfHarmfulImgInPage || {};

  console.log(numOfHarmfulImgInPage);

  if (url in numOfHarmfulImgInPage) {
    numOfHarmfulImgInPage[url] += numOfHarmfulImg;
  } else {
    numOfHarmfulImgInPage[url] = numOfHarmfulImg;
  }

  await chrome.storage.session.set({ 'numOfHarmfulImgInPage': numOfHarmfulImgInPage });
}

export async function initNumOfHarmfulImgInStorageSession(url) {
    const storedData = await chrome.storage.session.get(['numOfHarmfulImgInPage']);

     let numOfHarmfulImgInPage = storedData.numOfHarmfulImgInPage || {};
     numOfHarmfulImgInPage[url] = 0;

      chrome.storage.session.set({ 'numOfHarmfulImgInPage': numOfHarmfulImgInPage });
}

export async function getNumOfHarmfulImgInthispage(url) {
    const storedData = await chrome.storage.session.get(['numOfHarmfulImgInPage']);
    let numOfHarmfulImgInPage = storedData.numOfHarmfulImgInPage || {};

    return numOfHarmfulImgInPage[url] ? numOfHarmfulImgInPage[url] : 0;
}

export async function addTotalNumOfHarmfulImg(num) {

    const totalNumOfHarmfulImg = await chrome.storage.local.get(['totalNumOfHarmfulImg']).then(result => result.totalNumOfHarmfulImg);
    chrome.storage.local.set({'totalNumOfHarmfulImg':(totalNumOfHarmfulImg+ num)});
}

