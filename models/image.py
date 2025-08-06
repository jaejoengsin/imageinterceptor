"""
이미지 분석 요청 모델 정의 (배치 처리 전용)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# 배치 처리용 모델들
class ImageData(BaseModel):
    canonicalUrl: str  # 정규화된 URL 주소
    url: str  # 실제 URL
    status: bool = False  # 처리 상태 (True: 완료, False: 미완료)
    harmful: bool = False  # 유해 여부 (Vision API 결과로 업데이트됨)

class BatchAnalyzeRequest(BaseModel):
    data: List[ImageData]  # 이미지 데이터 배열 (최대 16개)
    
    def __init__(self, **data):
        super().__init__(**data)
        # 최대 16개 제한 검증
        if len(self.data) > 16:
            raise ValueError("한 번에 최대 16개 이미지만 처리할 수 있습니다.")

class ImageResult(ImageData):
    """처리 결과가 포함된 이미지 데이터"""
    # 기존 ImageData 필드들 상속받음 (canonicalUrl, url, status, harmful)
    
    # Vision API 결과 필드들 (harmful 필드는 Vision API 결과로 업데이트됨)
    category: Optional[str] = None  
    score: Optional[float] = None
    details: Optional[Dict[str, int]] = None
    
    # 처리 상태 및 오류 정보
    processed: bool = False  # Vision API 분석 완료 여부 (True: 분석 성공, False: 분석 실패/미완료)
    error: bool = False  # 오류 발생 여부 (True: 오류 있음, False: 오류 없음)
    error_message: Optional[str] = None  # 오류 메시지
    error_type: Optional[str] = None  # 오류 유형 (url_invalid, api_error, system_error)

class BatchAnalyzeResponse(BaseModel):
    """배치 분석 결과 응답"""
    data: List[ImageResult]  # 처리된 이미지 결과들
    summary: Dict[str, Any]  # 전체 요약 정보
    message: Optional[str] = None  # 전체 처리 메시지
