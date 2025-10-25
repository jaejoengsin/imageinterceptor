
//input data => [siteurl, imgurl] :{imgMetaData}
export const CsBatchForWaiting = new Map(); 

//default = 1
let currentFilteringStepValue;

export function setCurrentFilteringStepValue(value) {
  currentFilteringStepValue = value;
}

export function getCurrentFilteringStepValue() {
  return currentFilteringStepValue;
}