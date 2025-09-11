"""
이미지 분석 요청/응답 모델 정의 (Binary: safe vs harmful)
FormData로 전달되는 blob 이미지 메타를 수신하고
AI 분석 결과(safe/harmful)와 부가 정보를 반환하기 위한 스키마
"""
from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field


# =========================
# 요청 메타데이터
# =========================
class ImageMeta(BaseModel):
    url: str = Field(..., description="이미지 원본 URL 또는 식별자(페이지 URL 등)")
    status: bool = Field(False, description="클라이언트 측 처리 상태(초기 false)")
    harmful: bool = Field(False, description="클라이언트 측 초기 유해 여부(초기 false)")
    level: int = Field(
        2,
        ge=1,
        le=3,
        description="필터 강도 (1=약, 2=중, 3=강). 서버는 level에 따른 임계값으로 유해성 판단",
    )


# =========================
# 단일 이미지 결과
# =========================
class ImageResult(BaseModel):
    """AI 분석 결과가 포함된 단일 이미지 응답 모델"""

    # 기본 이미지 정보
    url: str = Field(..., description="이미지 URL 또는 식별자")
    status: bool = Field(False, description="서버 처리 완료 여부(성공 시 true)")
    harmful: bool = Field(False, description="유해 여부 (임계값 적용 결과)")

    # AI 모델 결과 필드(이진 분류)
    category: Optional[Literal["safe", "harmful"]] = Field(
        None, description="분류 결과 카테고리"
    )
    score: Optional[float] = Field(
        None,
        description="최종 판단에 사용된 점수 (harmful일 때는 p(harmful), safe일 때는 p(safe))",
    )
    threshold: Optional[float] = Field(
        None, description="현재 level에 대응하는 유해 판정 임계값"
    )
    probs: Optional[Dict[str, float]] = Field(
        None, description='클래스 확률 분포 {"safe": p0, "harmful": p1}'
    )

    # 처리/오류 상태
    processed: bool = Field(False, description="AI 분석 수행 여부")
    error: bool = Field(False, description="오류 발생 여부")
    error_message: Optional[str] = Field(None, description="오류 메시지")
    error_type: Optional[str] = Field(
        None, description="오류 유형(meta_invalid | image_invalid | ai_error | ai_system_error 등)"
    )


# =========================
# 요약 & 배치 응답
# =========================
class AnalyzeSummary(BaseModel):
    """배치 분석 요약 정보"""

    total: int = Field(..., description="총 이미지 수")
    status: int = Field(0, description="처리 완료된 이미지 수")
    harmful: int = Field(0, description="유해로 판정된 이미지 수")
    safe: int = Field(0, description="안전으로 판정된 이미지 수")


class BatchAnalyzeResponse(BaseModel):
    """배치 분석 결과 응답"""

    image: List[ImageResult] = Field(
        default_factory=list, description="이미지별 분석 결과 리스트"
    )
    summary: AnalyzeSummary = Field(..., description="배치 요약 정보")
    message: str = Field(..., description="처리 결과 메시지")