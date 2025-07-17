# url 비교 및 이미지 트래킹 테스트 코드

## 구체적인 구현 내용
- 주입 코드 - 콘텐츠 스크립트 - 서비스 워커 사이 양방향 통신 체계 구축
- 주입 코드에서 추출한 이미지 url 패킷 단위로 서비스 워커에 전송
- 서비스 워커에서 url을 패킷을 받으면 url 정규화 후 indexDB 조회. 없으면 {정규화 url, url, ..} 추가 후 반환 패킷에 추가. 있으면 그냥 반환 패킷에 추가, 중복 +1
- 서비스워커 - 콘텐츠 스크립트로부터 페이지 코드에 url 패킷 결과가 전송되면, url로 이미지를 찾아 이미지 객체 기반의 tracking 
- 콘텐츠 스크립트에서 페이지 reload 감지에 따른 반환 패킷 무시 시스템 추가 


### 테스트 코드 사용 시 manifest.json 파일

{
    "name": "ImageInterceptor",
    "description": "Chrome extension that replaces harmful images with safe ones on visited websites.",
    "version": "1.0",
    "manifest_version": 3,

    "action": {
      "default_popup": "/src/interact.html",
      "default_icon": "/images/icons/main_icon.png"
    },

    "content_scripts": [{
      "matches": ["<all_urls>"],
      "js": [
         "/src/js/content_scripts.js"
      ],
      "run_at": "document_start",
      "all_frames": true,
      "match_about_blank": false
    }],

    "background": {
    "service_worker": "src/js/background.js",
    "type": "module"
  },

  "host_permissions": [
    "<all_urls>"
  ],

  "web_accessible_resources": [
  {
    "resources": ["test/url_compare&image_tracking/injectedContent.js","test/url_compare&image_tracking/iframe_injectedContent.js", 
                  "src/css/test.css", "src/css/masking.css", 
                  "images/icons/*.png", "test/url_compare&image_tracking/utils/nomarlize-url-main"
                  ],
    "matches": ["<all_urls>"]
  }
],
"permissions": ["webRequest", "storage"]

}

