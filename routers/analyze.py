"""
이미지 분석 라우터 - 이미지 데이터 직접 처리
"""
import asyncio
from typing import Any
from fastapi import APIRouter, HTTPException
from models.image import BatchAnalyzeRequest, BatchAnalyzeResponse, ImageResult
from services.vision_client import analyze_images_batch

router = APIRouter()

@router.post("", response_model=BatchAnalyzeResponse)
async def analyze_images_batch_endpoint(request: BatchAnalyzeRequest):
    """
    여러 이미지 데이터를 배치로 처리하는 엔드포인트 (최대 16개)
    
    확장프로그램 요청 형식:
    {
        "data": [
            {
                "url": "https://example.com/image.jpg",
                "content": "base64_인코딩된_이미지_데이터",
                "status": false,
                "harmful": false
            }
        ]
    }
    """
    
    # 최대 16개 제한 확인
    if len(request.data) > 16:
        raise HTTPException(
            status_code=400,
            detail="한 번에 최대 16개 이미지만 처리할 수 있습니다."
        )
    
    results = []
    summary = {
        "total": len(request.data),
        "processed": 0,
        "harmful": 0,
        "safe": 0,
        "errors": 0,
        "error_types": {}
    }
    
    # 1단계: Base64 데이터 검증 (프론트엔드에서 검증 완료된 데이터)
    valid_images = []
    invalid_results = []
    
    for i, image_data in enumerate(request.data):
        result = ImageResult(
            url=image_data.url,
            status=image_data.status,
            harmful=image_data.harmful
        )
        
        try:
            # Base64 형식 검증만 수행 (실제 디코딩은 vision_client에서)
            if not image_data.content or len(image_data.content.strip()) == 0:
                raise ValueError("이미지 데이터가 비어있습니다")
            
            valid_images.append((i, image_data, result, image_data.content))
            
        except Exception as e:
            result.error = True
            result.error_type = "data_invalid"
            result.error_message = f"이미지 데이터 검증 실패: {str(e)}"
            summary["errors"] += 1
            summary["error_types"]["data_invalid"] = summary["error_types"].get("data_invalid", 0) + 1
            invalid_results.append((i, result))
    
    # 2단계: 유효한 이미지들을 Vision API에 전송
    valid_results = []
    if valid_images:
        try:
            # 검증된 이미지 Base64 데이터들만 추출
            image_base64_list = [image_base64 for _, _, _, image_base64 in valid_images]
            
            # Vision API 배치 처리
            vision_results = await analyze_images_batch(image_base64_list)
            
            # 결과를 각 이미지에 매핑
            for (original_index, image_data, result, _), vision_result in zip(valid_images, vision_results):
                if vision_result.get("error", False):
                    # Vision API 오류
                    result.error = True
                    result.error_type = "api_error"
                    result.error_message = vision_result.get("message", "Vision API 오류")
                    summary["errors"] += 1
                    summary["error_types"]["api_error"] = summary["error_types"].get("api_error", 0) + 1
                else:
                    # 성공적으로 처리됨
                    result.processed = True
                    
                    # Vision API 결과를 harmful 필드에 직접 반영
                    result.harmful = vision_result.get("is_harmful", False)
                    result.category = vision_result.get("category")
                    result.score = vision_result.get("score")
                    result.details = vision_result.get("details")
                    
                    # 처리 완료 상태 업데이트
                    result.status = True
                    
                    summary["processed"] += 1
                    if result.harmful:
                        summary["harmful"] += 1
                    else:
                        summary["safe"] += 1
                
                valid_results.append((original_index, result))
        
        except Exception as e:
            # 배치 처리 중 시스템 오류
            for original_index, image_data, result, _ in valid_images:
                result.error = True
                result.error_type = "system_error"
                result.error_message = f"시스템 오류: {str(e)}"
                summary["errors"] += 1
                summary["error_types"]["system_error"] = summary["error_types"].get("system_error", 0) + 1
                valid_results.append((original_index, result))
    
    # 3단계: 모든 결과 합치기 (원래 순서대로)
    all_results = valid_results + invalid_results
    all_results.sort(key=lambda x: x[0])  # 원래 순서로 정렬
    final_results = [result for _, result in all_results]
    
    # 전체 메시지 생성
    message = f"총 {summary['total']}개 이미지 중 {summary['processed']}개 처리 완료"
    if summary["errors"] > 0:
        message += f", {summary['errors']}개 오류 발생"
    
    return BatchAnalyzeResponse(
        data={"images": final_results},
        summary=summary,
        message=message
    )

@router.get("/health")
async def health_check():
    """
    API 상태 및 Vision API 설정 확인
    """
    from config import config
    
    return {
        "status": "healthy",
        "environment": config.get_environment(),
        "vision_api_configured": config.is_configured(),
        "auth_method": config.get_auth_method(),
        "supported_endpoints": [
            "/analyze/ (이미지 분석)"
        ],
        "features": [
            "이미지 분석: Vision API를 통한 유해성 검사 (최대 16개)",
            "배치 처리: 한 번의 API 호출로 여러 이미지 동시 처리"
        ]
    }