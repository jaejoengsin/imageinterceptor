# ImageInterceptor API

이미지 유해성 분석을 위한 FastAPI 서버 (Google Cloud Vision API 활용)

## ✨ 주요 기능

- **배치 처리**: 최대 16개 이미지 동시 분석
- **Google Vision API**: 5가지 유해성 카테고리 분석 (adult, violence, racy, medical, spoof)
- **Cloud Run 최적화**: 서버리스 환경에서 효율적 실행
- **자동 URL 검증**: 공개 접근 가능한 이미지 URL만 처리

## 🚀 빠른 배포 (Cloud Run)

### 1. Google Cloud 설정
```bash
# Google Cloud CLI 로그인
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Vision API 활성화
gcloud services enable vision.googleapis.com
```

### 2. Cloud Run 배포 (원클릭)
```bash
gcloud run deploy image-interceptor \
    --source . \
    --platform managed \
    --region asia-northeast3 \
    --allow-unauthenticated
```

### 3. 배포 완료! 🎉
배포 URL이 출력되면 바로 사용 가능합니다.

## 📋 API 사용법

### 엔드포인트
- **POST** `/analyze/` - 배치 이미지 분석
- **GET** `/analyze/health` - API 상태 확인
- **GET** `/docs` - API 문서

### 요청 예시
```bash
curl -X POST https://your-service-url/analyze/ \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {
        "canonicalUrl": "https://example.com/image1.jpg",
        "url": "https://picsum.photos/200/300",
        "status": false,
        "harmful": false
      }
    ]
  }'
```

### 응답 예시
```json
{
  "data": [
    {
      "canonicalUrl": "https://example.com/image1.jpg",
      "url": "https://picsum.photos/200/300",
      "status": true,
      "harmful": false,
      "category": "adult",
      "score": 0.1,
      "details": {
        "adult": 1,
        "violence": 0,
        "racy": 1,
        "medical": 0,
        "spoof": 0
      },
      "processed": true,
      "error": false
    }
  ],
  "summary": {
    "total": 1,
    "processed": 1,
    "harmful": 0,
    "safe": 1,
    "errors": 0
  }
}
```

## 💻 로컬 개발 (선택사항)

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. API 키 설정
```bash
# .env 파일 생성
echo "GOOGLE_CLOUD_API_KEY=your_api_key_here" > .env
```

### 3. 로컬 실행
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🔧 주요 특징

### 배치 처리 최적화
- **효율성**: 16개 이미지를 1회 API 호출로 처리
- **성능**: 개별 처리 대비 3-5배 빠름
- **비용**: API 호출 횟수 최소화

### Vision API 분석 카테고리
- **adult**: 성인 콘텐츠
- **violence**: 폭력성 콘텐츠
- **racy**: 선정적 콘텐츠
- **medical**: 의료 관련 콘텐츠
- **spoof**: 조작된 콘텐츠

### 유해성 판단 기준
점수 3 이상 (5점 만점)을 유해로 판단:
- 0-2: 안전 (`harmful: false`)
- 3-5: 유해 (`harmful: true`)

## 📊 제한사항

- **최대 배치 크기**: 16개 이미지
- **최대 파일 크기**: 20MB (Vision API 제한)
- **지원 형식**: JPEG, PNG, GIF, WEBP 등
- **URL 요구사항**: 공개 접근 가능한 HTTP/HTTPS URL

## 🔍 문제 해결

### API 키 관련
```bash
# 상태 확인
curl https://your-service-url/analyze/health

# 정상 응답 예시
{
  "status": "healthy",
  "environment": "Cloud Run",
  "vision_api_configured": true,
  "auth_method": "CLOUD_RUN_AUTO"
}
```

### 일반적인 오류
- **URL 검증 실패**: 이미지 URL이 공개 접근 불가능
- **Vision API 오류**: 파일 크기 초과 또는 지원하지 않는 형식
- **배치 크기 초과**: 16개 이상 이미지 요청

## 🏗️ 아키텍처

```
[클라이언트] → [FastAPI] → [URL 검증] → [Vision API 배치 처리] → [응답]
```

## 📄 라이선스

MIT License - 상업적 이용 가능

## 🔗 관련 링크

- [Google Cloud Vision API 문서](https://cloud.google.com/vision/docs)
- [Cloud Run 문서](https://cloud.google.com/run/docs)
- [FastAPI 문서](https://fastapi.tiangolo.com/) 