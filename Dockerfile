# Google Cloud Run용 Dockerfile (멀티스테이지 빌드)
FROM python:3.11-slim as builder

# 빌드 도구 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 종속성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 프로덕션 스테이지
FROM python:3.11-slim

# 보안을 위한 비-루트 사용자 생성
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 스테이지에서 패키지 복사
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 애플리케이션 코드 복사
COPY . .

# 파일 소유권 변경 및 PyTorch 캐시 디렉토리 권한 설정
RUN chown -R appuser:appuser /app && \
    mkdir -p /home/appuser/.cache && \
    chown -R appuser:appuser /home/appuser/.cache

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