"""
이미지 분석 요청 모델 정의 (FormData 처리 - blob 이미지 데이터)
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# 이미지 메타데이터 모델
class ImageMeta(BaseModel):
    url: str = Field(..., description="이미지 URL")
    status: bool = Field(default=False, description="처리 상태")
    harmful: bool = Field(default=False, description="유해 여부")
    level: Optional[int] = Field(default=2, description="필터 강도 (1=약, 2=중, 3=강)")

class ImageResult(BaseModel):
    """처리 결과가 포함된 이미지 데이터"""
    # 기본 이미지 정보
    url: str = Field(..., description="이미지 URL")
    status: bool = Field(default=False, description="처리 상태")
    harmful: bool = Field(default=False, description="유해 여부")
    
    # AI 모델 결과 필드들
    category: Optional[str] = Field(default=None, description="유해 카테고리 (nudity, violence)")
    score: Optional[float] = Field(default=None, description="유해 점수 (0-1)")
    
    # 처리 상태 및 오류 정보
    processed: Optional[bool] = Field(default=None, description="AI 분석 완료 여부")
    error: Optional[bool] = Field(default=None, description="오류 발생 여부")
    error_message: Optional[str] = Field(default=None, description="오류 메시지")
    error_type: Optional[str] = Field(default=None, description="오류 유형")

class AnalyzeSummary(BaseModel):
    """분석 요약 정보"""
    total: int = Field(..., description="총 이미지 수")
    status: int = Field(default=0, description="처리 완료된 이미지 수")
    harmful: int = Field(default=0, description="유해한 이미지 수")
    safe: int = Field(default=0, description="안전한 이미지 수")

class BatchAnalyzeResponse(BaseModel):
    """배치 분석 결과 응답"""
    image: List[ImageResult] = Field(default_factory=list, description="이미지 분석 결과 배열")
    summary: AnalyzeSummary = Field(..., description="전체 요약 정보")
    message: str = Field(..., description="처리 결과 메시지")
