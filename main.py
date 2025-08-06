"""
FastAPI 앱 진입점 (Cloud Run 최적화)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze

app = FastAPI(
    title="Image Interceptor API",
    description="이미지 유해성 분석 API (배치 처리 지원)",
    version="1.0.0"
)

# CORS 설정 (웹에서 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Cloud Run에서는 Dockerfile의 gunicorn으로 실행됨
# 로컬 실행이 필요한 경우: uvicorn main:app --host 0.0.0.0 --port 8000
