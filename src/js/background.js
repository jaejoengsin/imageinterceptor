


chrome.runtime.onConnect.addListener(port => {
  switch (port.name) {
    case 'batch':
      port.onMessage.addListener(handleBatch);
      break;
  }
});



function handleBatch(msg, port) {

    if (msg.type !== 'batch' || !Array.isArray(msg.data))
        console.log("서비스워커: 메세지 수신 오류");
}
