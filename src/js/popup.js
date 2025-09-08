document.addEventListener('DOMContentLoaded', async function () {

  const onOffSwitch = document.getElementById('onOffSwitch');
  const controlProcessButton = document.getElementById('ControlProcess');

  const storedFilterStatus = await chrome.storage.local.get(['filterStatus']);
  let isFilteringOn = storedFilterStatus.filterStatus;

  if (isFilteringOn === undefined) {
    chrome.storage.local.set({ 'filterStatus': true });
    isFilteringOn = true;
  }
  controlProcessButton.querySelector('span').textContent = isFilteringOn ? 'Show' : 'Hide';


  const storedInterceptorStatus = await chrome.storage.local.get(['interceptorStatus']);
  let savedStatus = storedInterceptorStatus.interceptorStatus;

  if (savedStatus === undefined) {
    chrome.storage.local.set({ 'interceptorStatus': 1 });
    savedStatus = 1;
  }


  onOffSwitch.checked = (savedStatus === 1);

  //EVENT LISTNER//
  onOffSwitch.addEventListener('change', async function () {

    const isChecked = onOffSwitch.checked;
    await chrome.storage.local.set({ 'interceptorStatus': isChecked ? 1 : 0 });
    chrome.runtime.sendMessage({ source: 'popup', type: 'active_interceptor', active: isChecked }, function (response) {
      
    });
  });

  controlProcessButton.addEventListener('click', async function () {

    isFilteringOn = !isFilteringOn;
    await chrome.storage.local.set({ 'filterStatus': isFilteringOn });
    chrome.runtime.sendMessage({ source: 'popup', type: 'set_filter_status', FilterStatus: isFilteringOn }, function (response) {
      if (!response.ok) {
        console.error("reponse failed. eventType: set_filter_status");
        return;
      }
      const controlButtonTxt = controlProcessButton.querySelector('span');
      if (controlButtonTxt) {
        controlButtonTxt.textContent = isFilteringOn ? 'Show' : 'Hide';
      }
    });

  });
});
