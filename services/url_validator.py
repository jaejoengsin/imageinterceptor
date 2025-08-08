"""
URL 유효성 검증 서비스 (고속 비동기)
공개적으로 접근 가능한 이미지 URL인지 확인
"""
from urllib.parse import urlparse
from services.http_client import get_http_client
import httpx

async def is_valid_public_image_url(img_url: str) -> tuple[bool, str]:
    """
    공개적으로 접근 가능한 이미지 URL인지 확인
    
    Args:
        img_url (str): 검증할 이미지 URL
        
    Returns:
        tuple[bool, str]: (유효성 여부, 오류 메시지)
        
    검증 항목:
        - URL 형식 유효성
        - HTTP/HTTPS 프로토콜 확인
        - URL 접근성 (HEAD 요청)
        - Content-Type이 이미지인지 확인
        
    최적화:
        - 연결 풀링 (HTTP/2, Keep-alive)
        - 단축된 타임아웃 (2초)
        
    Note:
        - URL 중복 처리는 프론트엔드에서 담당
        - 백엔드는 순수 검증 로직만 처리
    """
    try:
        # 1. URL 형식 검증
        parsed_url = urlparse(img_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            return False, "유효하지 않은 URL 형식입니다"
        
        # 2. HTTP/HTTPS 프로토콜 확인
        if parsed_url.scheme not in ['http', 'https']:
            return False, "HTTP 또는 HTTPS 프로토콜만 지원됩니다"
        
        # 3. HEAD 요청으로 접근성 및 메타데이터 확인 (고속 연결 풀 사용)
        client = await get_http_client()
        head_response = await client.head(img_url)
        head_response.raise_for_status()
        
        # 4. Content-Type 확인 (이미지 파일인지 검증)
        content_type = head_response.headers.get('content-type', '').lower()
        if not content_type.startswith('image/'):
            return False, f"이미지 파일이 아닙니다 (Content-Type: {content_type})"
        
        # 파일 크기 검증 제거 - Vision API에서 자체 처리
        # Google Vision API는 최대 20MB까지 지원하며 자체적으로 크기 제한 처리
        
        return True, "유효한 공개 이미지 URL입니다"
        
    except httpx.TimeoutException:
        return False, "URL 접근 시간 초과"
    except httpx.ConnectError:
        return False, "URL에 연결할 수 없습니다"
    except httpx.HTTPStatusError as e:
        return False, f"HTTP 오류: {e.response.status_code}"
    except Exception as e:
        return False, f"URL 검증 중 오류 발생: {str(e)}" 