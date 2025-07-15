document.getElementById('download').onclick = async () => {
  const status = document.getElementById('status');
  status.textContent = '이미지 목록을 가져오는 중...';

  // 이미지 url 배열 요청
  chrome.runtime.sendMessage("getSuccessImages", async (urls) => {
    if (!urls || urls.length === 0) {
      status.textContent = '다운로드할 이미지가 없습니다.';
      return;
    }

    status.textContent = `이미지 ${urls.length}개 수집, zip 파일 준비 중...`;

    const zip = new JSZip();
    let count = 0;
    let failed = 0;

    for (let i = 0; i < urls.length; ++i) {
      const url = urls[i];
      try {
        // blob 다운로드 (cors 불가시 실패)
        const res = await fetch(url, { mode: "no-cors" });
        // 일부 이미지 fetch에서 실제 blob 데이터 접근 불가(CORS) → zip엔 빈 파일로 들어갈 수 있음
        const blob = await res.blob();
        const ext = (url.split('.').pop().split(/\#|\?/)[0] || 'jpg').substr(0,4);
        zip.file(`image_${i+1}.${ext}`, blob);
        count++;
      } catch (e) {
        failed++;
        zip.file(`failed_image_${i+1}.txt`, `다운로드 실패: ${url}`);
      }
      status.textContent = `처리 중... (${i+1}/${urls.length})`;
    }

    // zip 파일 만들기
    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.zip";
      a.click();
      URL.revokeObjectURL(url);
      status.textContent = `완료! 성공: ${count}개, 실패: ${failed}개`;
    });
  });
};
