# Google Cloud Run GPU용 Dockerfile
# NVIDIA CUDA 12.1 베이스 이미지 (Ubuntu 22.04)
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# 비대화형 모드 설정 (apt-get 설치 시 프롬프트 방지)
ENV DEBIAN_FRONTEND=noninteractive

# Python 3.11 및 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3-pip \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# python3.11을 기본 python으로 설정
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# pip 업그레이드
RUN python -m pip install --upgrade pip

# 작업 디렉토리 설정
WORKDIR /app

# requirements.txt 먼저 복사 (Docker 캐시 최적화)
COPY requirements.txt .

# PyTorch GPU 버전 설치 (CUDA 12.1)
RUN pip install --no-cache-dir torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu121

# 나머지 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 보안을 위한 비-루트 사용자 생성
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

# 파일 소유권 변경 및 PyTorch 캐시 디렉토리 권한 설정
RUN chown -R appuser:appuser /app && \
    mkdir -p /home/appuser/.cache && \
    chown -R appuser:appuser /home/appuser/.cache && \
    mkdir -p /home/appuser/.torch && \
    chown -R appuser:appuser /home/appuser/.torch

# GPU 사용을 위한 환경변수 설정
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# 비-루트 사용자로 전환
USER appuser

# 포트 설정
EXPOSE 8080

# Google Cloud Run은 PORT 환경 변수를 8080으로 설정
ENV PORT=8080

# 헬스체크 설정 (간단한 HTTP 요청)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen(f'http://localhost:8080/analyze/health', timeout=5)"

# 프로덕션 서버로 실행 (Cloud Run 최적화)
CMD exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --timeout-keep-alive 60 --timeout-graceful-shutdown 30 