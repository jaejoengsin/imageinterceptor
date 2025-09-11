"""
2025-09-11 수정
FastAPI 앱 진입점
"""
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze  # analyze.router 를 사용

@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    print("Image Interceptor API 시작")
    try:
        yield
    finally:
        print("Image Interceptor API 종료")

app = FastAPI(
    title="Image Interceptor API",
    description="이미지 유해성 분석 API",
    version="2.0.0",
    lifespan=lifespan
)

# CORS 설정 (확장프로그램에서 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # 프로덕션에선 도메인 제한 권장
    allow_credentials=False,
    allow_methods=["*"],              # 프리플라이트(OPTIONS) 포함
    allow_headers=["*"],              # 필요시 좁히기
)

# 이미지 분석 API 라우터 등록
# analyze.py 에 이미 prefix="/analyze" 가 있으므로 여기서는 prefix를 다시 붙이지 않습니다.
app.include_router(analyze.router)

# 루트 엔드포인트
@app.get("/")
async def root():
    return {
        "message": "Image Interceptor API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/analyze/health"
    }

# 루트 경로에서도 이미지 분석 가능하도록 추가 (FormData 지원)
@app.post("/")
async def root_analyze(
    images: List[UploadFile] = File(...),
    imgMeta: List[str] = Form(...),
):
    """루트 경로에서 이미지 분석 요청을 /analyze 핸들러로 위임"""
    from routers.analyze import analyze_images_batch_endpoint
    return await analyze_images_batch_endpoint(images=images, imgMeta=imgMeta)


# Cloud Run에서는 Dockerfile의 gunicorn으로 실행됨
# 로컬 실행이 필요한 경우: uvicorn main:app --host 0.0.0.0 --port 8000