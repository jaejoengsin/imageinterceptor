"""
이미지 분석 요청 모델 정의 (배치 처리 전용 - 이미지 데이터 직접 전송)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import base64

# 배치 처리용 모델들
class ImageData(BaseModel):
    url: str = Field(..., description="이미지 URL")
    content: str = Field(..., description="Base64 인코딩된 이미지 데이터")
    status: bool = Field(default=False, description="처리 상태")
    harmful: bool = Field(default=False, description="유해 여부 (Vision API 결과로 업데이트됨)")

class BatchAnalyzeRequest(BaseModel):
    data: List[ImageData]  # 이미지 데이터 배열 (최대 16개)
    
    def __init__(self, **data):
        super().__init__(**data)
        # 최대 16개 제한 검증
        if len(self.data) > 16:
            raise ValueError("한 번에 최대 16개 이미지만 처리할 수 있습니다.")

class ImageResult(BaseModel):
    """처리 결과가 포함된 이미지 데이터"""
    # 기본 이미지 정보
    url: str = Field(..., description="이미지 URL")
    status: bool = Field(default=False, description="처리 상태")
    harmful: bool = Field(default=False, description="유해 여부 (Vision API 결과로 업데이트됨)")
    
    # Vision API 결과 필드들 (선택사항 - 추가 정보용)
    category: Optional[str] = Field(default=None, description="유해 카테고리")
    score: Optional[float] = Field(default=None, description="유해 점수 (0-1)")
    details: Optional[Dict[str, int]] = Field(default=None, description="세부 카테고리별 점수")
    
    # 처리 상태 및 오류 정보 (선택사항 - 추가 정보용)
    processed: Optional[bool] = Field(default=None, description="Vision API 분석 완료 여부")
    error: Optional[bool] = Field(default=None, description="오류 발생 여부")
    error_message: Optional[str] = Field(default=None, description="오류 메시지")
    error_type: Optional[str] = Field(default=None, description="오류 유형 (data_invalid, api_error, system_error)")

class BatchAnalyzeResponse(BaseModel):
    """배치 분석 결과 응답"""
    data: Dict[str, List[ImageResult]] = Field(default_factory=lambda: {"images": []})  # {"images": [...]} 구조
    summary: Dict[str, Any]  # 전체 요약 정보
    message: Optional[str] = None  # 전체 처리 메시지
