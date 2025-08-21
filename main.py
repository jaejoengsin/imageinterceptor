"""
FastAPI 앱 진입점
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze  
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    print("Image Interceptor API 시작")
    
    yield
    
    # 종료 시: 리소스 정리
    print("Image Interceptor API 종료")

app = FastAPI(
    title="Image Interceptor API",
    description="이미지 유해성 분석 API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정 (확장프로그램에서 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # 개발 단계에서는 모든 origin 허용
        # 프로덕션에서는 아래처럼 제한:
        # "chrome-extension://*",  # Chrome 확장프로그램
        # "moz-extension://*",     # Firefox 확장프로그램
    ],
    allow_credentials=False,  # 확장프로그램에서는 credentials 불필요
    allow_methods=["GET", "POST"],  # 필요한 메서드만
    allow_headers=["Content-Type", "Authorization"],  # 필요한 헤더만
)

# 이미지 분석 API 라우터 등록
app.include_router(analyze.router, prefix="/analyze", tags=["Analyze"])


# 루트 엔드포인트
@app.get("/")
async def root():
    return {
        "message": "Image Interceptor API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/analyze/health"
    }

# 루트 경로에서도 이미지 분석 가능하도록 추가
@app.post("/")
async def root_analyze(request: dict):
    """루트 경로에서 이미지 분석 요청을 /analyze/로 리다이렉트"""
    from routers.analyze import analyze_images_batch_endpoint
    from models.image import BatchAnalyzeRequest
    
    # 요청을 BatchAnalyzeRequest로 변환
    batch_request = BatchAnalyzeRequest(**request)
    return await analyze_images_batch_endpoint(batch_request)

# Cloud Run에서는 Dockerfile의 gunicorn으로 실행됨
# 로컬 실행이 필요한 경우: uvicorn main:app --host 0.0.0.0 --port 8000