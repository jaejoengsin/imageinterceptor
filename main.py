"""
FastAPI 앱 진입점 (시간 기반 배치 처리 지원)
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze
from services.batch_processor import batch_processor
from services.http_client import close_http_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # 시작 시: 배치 처리기 시작
    await batch_processor.start()
    print("초고속 배치 처리기가 시작되었습니다")
    print("지연시간 최적화 기능 활성화 (연결풀링, 1.5초 배치)")
    print("프론트엔드에서 URL 중복 처리, 백엔드는 순수 검증만 담당")
    
    yield
    
    # 종료 시: 리소스 정리
    await batch_processor.stop()
    await close_http_client()
    print("모든 서비스가 안전하게 종료되었습니다")

app = FastAPI(
    title="Image Interceptor API",
    description="이미지 유해성 분석 API (시간 기반 배치 처리 지원)",
    version="2.0.0",
    lifespan=lifespan
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
