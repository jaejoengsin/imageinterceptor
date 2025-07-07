console.log("확장프로그램이다.");

// Dynamically import the module that installs the image interceptor.
const moduleUrl = chrome.runtime.getURL('/src/js/utils/image_extract.js');
import(moduleUrl)
  .then(({ installImageInterceptor }) => {
    if (typeof installImageInterceptor === 'function') {
      installImageInterceptor();
    }
  })
  .catch(err => console.error('Failed to load image_extract module', err));
