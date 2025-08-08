"""
이미지 분석 라우터 (시간 기반 배치 처리)
"""
import asyncio
import uuid
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.image import BatchAnalyzeRequest, BatchAnalyzeResponse, ImageResult
from services.batch_processor import batch_processor

router = APIRouter()

# 결과 저장소 (실제로는 Redis나 DB 사용 권장)
pending_results: Dict[str, Dict[str, Any]] = {}

@router.post("/queue", response_model=Dict[str, Any])
async def add_images_to_batch_queue(request: BatchAnalyzeRequest):
    """
    이미지를 배치 큐에 추가 (초고속 시간 기반 처리)
    
    - 16개가 모이면 즉시 처리
    - 1.5초 동안 이미지가 추가되지 않으면 현재까지 모인 것만 처리
    """
    if len(request.data) > 16:
        raise HTTPException(
            status_code=400,
            detail="한 번에 최대 16개 이미지만 처리할 수 있습니다."
        )
    
    # 배치 처리기 시작 (이미 실행 중이면 무시됨)
    await batch_processor.start()
    
    # 각 이미지에 고유 ID 할당
    image_ids = []
    
    for image_data in request.data:
        image_id = str(uuid.uuid4())
        image_ids.append(image_id)
        
        # 결과 객체 생성
        result = ImageResult(
            canonicalUrl=image_data.canonicalUrl,
            url=image_data.url,
            status=image_data.status,
            harmful=image_data.harmful
        )
        
        # 대기 중인 결과에 등록
        pending_results[image_id] = {
            "result": result,
            "completed": False,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        # 배치 큐에 추가
        async def result_callback(img_id: str, processed_result: ImageResult):
            if img_id in pending_results:
                pending_results[img_id]["result"] = processed_result
                pending_results[img_id]["completed"] = True
        
        await batch_processor.add_image(
            image_id=image_id,
            image_data=image_data,
            result=result,
            callback=result_callback
        )
    
    return {
        "message": f"{len(request.data)}개 이미지를 배치 큐에 추가했습니다",
        "image_ids": image_ids,
        "queue_info": {
            "max_batch_size": 16,
            "max_wait_time": "1.5초",
            "processing_method": "16개 모이거나 1.5초 후 자동 처리"
        },
        "status_check_url": "/analyze/status",
        "estimated_processing_time": "최대 1.5초"
    }

@router.get("/status")
async def check_batch_status(image_ids: str = None):
    """
    배치 처리 상태 확인
    
    Args:
        image_ids: 쉼표로 구분된 이미지 ID 목록 (예: "id1,id2,id3")
    """
    if not image_ids:
        # 전체 상태 반환
        total_pending = len([r for r in pending_results.values() if not r["completed"]])
        total_completed = len([r for r in pending_results.values() if r["completed"]])
        
        return {
            "total_pending": total_pending,
            "total_completed": total_completed,
            "queue_size": len(batch_processor.batch_queue) if batch_processor else 0
        }
    
    # 특정 이미지들의 상태 확인
    requested_ids = [id.strip() for id in image_ids.split(",")]
    results = {}
    
    for img_id in requested_ids:
        if img_id in pending_results:
            if pending_results[img_id]["completed"]:
                results[img_id] = {
                    "status": "completed",
                    "result": pending_results[img_id]["result"]
                }
            else:
                results[img_id] = {
                    "status": "pending",
                    "message": "처리 대기 중..."
                }
        else:
            results[img_id] = {
                "status": "not_found",
                "message": "해당 ID를 찾을 수 없습니다"
            }
    
    return {
        "results": results,
        "completed_count": len([r for r in results.values() if r["status"] == "completed"]),
        "pending_count": len([r for r in results.values() if r["status"] == "pending"])
    }

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
        "batch_processing": {
            "max_batch_size": 16,
            "max_wait_time": "1.5초",
            "queue_size": len(batch_processor.batch_queue) if batch_processor else 0,
            "processor_running": batch_processor.running if batch_processor else False
        },
        "supported_endpoints": [
            "/analyze/ (즉시 처리)",
            "/analyze/queue (시간 기반 배치)",
            "/analyze/status (상태 확인)",
            "/analyze/health"
        ],
        "features": [
            "즉시 처리: 기존 방식 (최대 16개)",
            "초고속 배치: 16개 모이거나 1.5초 후 자동 처리",
            "연결 풀링: HTTP 연결 재사용으로 네트워크 지연 최소화",
            "프론트엔드 중복 처리: URL 중복 검사는 클라이언트에서 담당",
            "비동기 상태 확인: 처리 상태 실시간 조회"
        ]
    }
