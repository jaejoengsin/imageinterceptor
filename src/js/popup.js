document.addEventListener('DOMContentLoaded', function () {

  const onOffSwitch = document.getElementById('onOffSwitch');


  let savedStatus = localStorage.getItem('interceptorStatus');
  if (savedStatus === null) {
    localStorage.setItem('interceptorStatus', '1');
    savedStatus = '1';
  }


  onOffSwitch.checked = (savedStatus === '1');

  onOffSwitch.addEventListener('change', function () {
  

    const isChecked = onOffSwitch.checked;
    localStorage.setItem('interceptorStatus', isChecked ? '1' : '0');

    chrome.runtime.sendMessage({ active: isChecked });
  });
});
