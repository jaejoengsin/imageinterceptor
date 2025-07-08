


chrome.runtime.onConnect.addListener(port => {
  switch (port.name) {
    case 'batch':
      port.onMessage.addListener(handleBatch);
      break;
  }
});



const fs = require('fs');
const path = require('path');

async function handleBatch(msg, port) {
    if (msg.type !== 'batch' || !Array.isArray(msg.data)) {
        console.log("서비스워커: 메세지 수신 오류");
        return;
    }

    const testDir = path.join(__dirname, '..', '..', 'test');
    const textFile = path.join(testDir, 'records.txt');

    // ensure directory and file exist
    await fs.promises.mkdir(testDir, { recursive: true });
    if (!fs.existsSync(textFile)) {
        await fs.promises.writeFile(textFile, '', 'utf8');
    }

    // append records
    const lines = msg.data.map(rec => JSON.stringify(rec)).join('\n') + '\n';
    await fs.promises.appendFile(textFile, lines, 'utf8');

    // download images
    for (const rec of msg.data) {
        try {
            const res = await fetch(rec.url);
            if (!res.ok) continue;
            const arrayBuffer = await res.arrayBuffer();
            const extMatch = rec.url.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
            const ext = extMatch ? '.' + extMatch[1] : '';
            const filePath = path.join(testDir, rec.id + ext);
            await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));
        } catch (e) {
            console.log('Failed to fetch', rec.url, e);
        }
    }
}
