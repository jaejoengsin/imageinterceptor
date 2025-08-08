"""
글로벌 HTTP 클라이언트 풀
연결 재사용으로 네트워크 지연시간 최소화
"""
import httpx
from typing import Optional

class GlobalHTTPClient:
    """전역 HTTP 클라이언트 (싱글톤 패턴)"""
    
    _instance: Optional[httpx.AsyncClient] = None
    
    @classmethod
    async def get_client(cls) -> httpx.AsyncClient:
        """최적화된 HTTP 클라이언트 반환"""
        if cls._instance is None:
            cls._instance = httpx.AsyncClient(
                timeout=httpx.Timeout(
                    connect=1.0,    # 연결 타임아웃: 1초
                    read=2.0,       # 읽기 타임아웃: 2초
                    write=1.0,      # 쓰기 타임아웃: 1초
                    pool=5.0        # 풀 타임아웃: 5초
                ),
                limits=httpx.Limits(
                    max_connections=50,         # 최대 연결 수
                    max_keepalive_connections=20,  # Keep-alive 연결 수
                    keepalive_expiry=30.0      # Keep-alive 만료 시간
                ),
                http2=True,  # HTTP/2 지원으로 성능 향상
                follow_redirects=True
            )
        return cls._instance
    
    @classmethod
    async def close(cls):
        """클라이언트 종료"""
        if cls._instance:
            await cls._instance.aclose()
            cls._instance = None

# 편의 함수
async def get_http_client() -> httpx.AsyncClient:
    """최적화된 HTTP 클라이언트 가져오기"""
    return await GlobalHTTPClient.get_client()

async def close_http_client():
    """HTTP 클라이언트 정리"""
    await GlobalHTTPClient.close()
