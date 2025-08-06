"""
이미지 분석 라우터 (비동기)
"""
import asyncio
from fastapi import APIRouter, HTTPException
from models.image import BatchAnalyzeRequest, BatchAnalyzeResponse, ImageResult
from services.vision_client import analyze_images_batch
from services.url_validator import is_valid_public_image_url

router = APIRouter()

@router.post("", response_model=BatchAnalyzeResponse)
async def analyze_images_batch_endpoint(request: BatchAnalyzeRequest):
    """
    여러 이미지를 배치로 처리하는 엔드포인트 (최대 16개)
    
    프론트엔드 요청 형식:
    {
        "data": [
            {
                "canonicalUrl": "정규화url주소",
                "url": "실제url", 
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
    
    # 1단계: URL 유효성 검증 및 유효한 이미지들 분류 (동시 처리)
    
    async def validate_single_image(i: int, image_data):
        result = ImageResult(
            canonicalUrl=image_data.canonicalUrl,
            url=image_data.url,
            status=image_data.status,
            harmful=image_data.harmful
        )
        
        # URL 유효성 검증
        is_valid, validation_message = await is_valid_public_image_url(image_data.url)
        return i, image_data, result, is_valid, validation_message
    
    # 모든 URL을 동시에 검증
    validation_tasks = [
        validate_single_image(i, image_data) 
        for i, image_data in enumerate(request.data)
    ]
    validation_results = await asyncio.gather(*validation_tasks)
    
    # 검증 결과 분류
    valid_images = []
    invalid_results = []
    
    for i, image_data, result, is_valid, validation_message in validation_results:
        if not is_valid:
            result.error = True
            result.error_type = "url_invalid"
            result.error_message = f"URL 검증 실패: {validation_message}"
            summary["errors"] += 1
            summary["error_types"]["url_invalid"] = summary["error_types"].get("url_invalid", 0) + 1
            invalid_results.append((i, result))
        else:
            valid_images.append((i, image_data, result))
    
    # 2단계: 유효한 이미지들을 배치로 Vision API에 전송
    if valid_images:
        try:
            # 유효한 URL들만 추출
            valid_urls = [img_data.url for _, img_data, _ in valid_images]
            
            # Vision API 배치 호출 (한 번의 API 호출로 모든 유효한 이미지 처리)
            vision_results = await analyze_images_batch(valid_urls)
            
            # 결과를 각 이미지에 매핑
            for (original_index, image_data, result), vision_result in zip(valid_images, vision_results):
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
                
                results.append((original_index, result))
        
        except Exception as e:
            # 배치 처리 중 시스템 오류
            for original_index, image_data, result in valid_images:
                result.error = True
                result.error_type = "system_error"
                result.error_message = f"시스템 오류: {str(e)}"
                summary["errors"] += 1
                summary["error_types"]["system_error"] = summary["error_types"].get("system_error", 0) + 1
                results.append((original_index, result))
    
    # 3단계: 모든 결과 합치기 (원래 순서대로)
    all_results = results + invalid_results
    all_results.sort(key=lambda x: x[0])  # 원래 순서로 정렬
    final_results = [result for _, result in all_results]
    
    # 전체 메시지 생성
    message = f"총 {summary['total']}개 이미지 중 {summary['processed']}개 처리 완료"
    if summary["errors"] > 0:
        message += f", {summary['errors']}개 오류 발생"
    
    if valid_images:
        message += f" (배치 API 호출: 1회로 {len(valid_images)}개 이미지 동시 처리)"
    
    return BatchAnalyzeResponse(
        data=final_results,
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
        "max_batch_size": 16,
        "supported_endpoints": ["/analyze/", "/analyze/health"]
    }
