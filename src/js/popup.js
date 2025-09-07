document.addEventListener('DOMContentLoaded', async function () {

  const onOffSwitch = document.getElementById('onOffSwitch');
  
  const result = await chrome.storage.local.get(['interceptorStatus']);
  let savedStatus = result.interceptorStatus;

  if (savedStatus === undefined) {
    chrome.storage.local.set({ 'interceptorStatus': 1 });
    savedStatus = 1;
  }
  
  
  onOffSwitch.checked = (savedStatus === 1);
  
  onOffSwitch.addEventListener('change', async function () {
    
    const isChecked = onOffSwitch.checked;
    await chrome.storage.local.set({'interceptorStatus': isChecked ? 1 : 0 });
    chrome.runtime.sendMessage({ active: isChecked, source: 'popup' });
  });
});
