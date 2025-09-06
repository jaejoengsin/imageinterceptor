"""
이미지 분석 라우터 - FormData로 blob 이미지 처리
"""
import asyncio
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, Form, File, Request
from models.image import BatchAnalyzeResponse, ImageResult, AnalyzeSummary, ImageMeta
from services.use_ai import analyze_images_with_ai

router = APIRouter()

@router.post("", response_model=BatchAnalyzeResponse)
async def analyze_images_batch_endpoint(
    images: List[UploadFile] = File(...),
    imgMeta: List[str] = Form(...)
):
    """
    여러 이미지를 FormData로 배치 처리하는 엔드포인트 (최대 20개)
    
    확장프로그램 요청 형식:
    - images: 이미지 blob 파일들 (UploadFile 형태)
    - imgMeta: 각 이미지의 메타데이터 JSON 문자열 배열
    
    FormData 예시:
    formData.append('images', img1.blob, 'image1.jpg');
    formData.append('images', img2.blob, 'image2.jpg');  // 같은 키로 여러 파일
    formData.append('imgMeta', JSON.stringify({url: "...", status: false, harmful: false, level: 2}));
    formData.append('imgMeta', JSON.stringify({url: "...", status: false, harmful: false, level: 3}));
    """
    
    
    # 이미지와 메타데이터 개수 일치 확인
    if len(images) != len(imgMeta):
        raise HTTPException(
            status_code=400,
            detail="이미지 개수와 메타데이터 개수가 일치하지 않습니다."
        )
    

    
    results = []
    summary = AnalyzeSummary(total=len(images))
    
    # 1단계: 메타데이터 파싱 및 검증
    parsed_meta = []
    for i, meta_str in enumerate(imgMeta):
        try:
            meta_dict = json.loads(meta_str)
            meta = ImageMeta(**meta_dict)
            parsed_meta.append(meta)
        except Exception as e:
            # 메타데이터 파싱 실패
            result = ImageResult(
                url="",
                status=False,
                harmful=False,
                error=True,
                error_type="meta_invalid",
                error_message=f"메타데이터 파싱 실패: {str(e)}"
            )
            results.append(result)
            parsed_meta.append(None)
    
    # 2단계: 이미지 파일 읽기 및 검증
    image_bytes_list = []
    valid_indices = []
    
    for i, (image_file, meta) in enumerate(zip(images, parsed_meta)):
        if meta is None:
            # 메타데이터가 잘못된 경우 스킵
            image_bytes_list.append(None)
            continue
            
        try:
            # 이미지 파일 읽기
            image_bytes = await image_file.read()
            
            if not image_bytes:
                raise ValueError("이미지 데이터가 비어있습니다")
            
            image_bytes_list.append(image_bytes)
            valid_indices.append(i)
            
            # 유효한 이미지에 대해 기본 결과 생성
            if len(results) <= i:
                results.append(ImageResult(
                    url=meta.url,
                    status=meta.status,
                    harmful=meta.harmful
                ))
            else:
                results[i].url = meta.url
                results[i].status = meta.status
                results[i].harmful = meta.harmful
            
        except Exception as e:
            # 이미지 읽기 실패
            if len(results) <= i:
                results.append(ImageResult(
                    url=meta.url if meta else "",
                    status=False,
                    harmful=False,
                    error=True,
                    error_type="image_invalid",
                    error_message=f"이미지 처리 실패: {str(e)}"
                ))
            else:
                results[i].error = True
                results[i].error_type = "image_invalid"
                results[i].error_message = f"이미지 처리 실패: {str(e)}"
            
            image_bytes_list.append(None)
    
    # 3단계: AI 모델로 유효한 이미지들 분석
    valid_image_bytes = [img_bytes for img_bytes in image_bytes_list if img_bytes is not None]
    valid_levels = [parsed_meta[i].level for i, img_bytes in enumerate(image_bytes_list) if img_bytes is not None]
    
    if valid_image_bytes:
        try:
            # AI 모델 배치 분석 (level 정보와 함께)
            ai_results = await analyze_images_with_ai(valid_image_bytes, valid_levels)
            
            # 결과를 해당 인덱스에 매핑
            ai_result_idx = 0
            for i, img_bytes in enumerate(image_bytes_list):
                if img_bytes is not None:
                    ai_result = ai_results[ai_result_idx]
                    ai_result_idx += 1
                    
                    if ai_result.get("error", False):
                        # AI 분석 오류
                        results[i].error = True
                        results[i].error_type = "ai_error"
                        results[i].error_message = ai_result.get("message", "AI 분석 오류")
                    else:
                        # AI 분석 성공
                        results[i].processed = True
                        results[i].status = True
                        results[i].harmful = ai_result.get("is_harmful", False)
                        results[i].category = ai_result.get("category")
                        results[i].score = ai_result.get("score")
                        
                        # 요약 통계 업데이트
                        summary.status += 1
                        if results[i].harmful:
                            summary.harmful += 1
                        else:
                            summary.safe += 1
        
        except Exception as e:
            # AI 분석 전체 실패
            for i in valid_indices:
                if not results[i].error:
                    results[i].error = True
                    results[i].error_type = "ai_system_error"
                    results[i].error_message = f"AI 시스템 오류: {str(e)}"
    
    # 4단계: 응답 메시지 생성
    if summary.status > 0:
        message = f"총 {summary.total}개 이미지 중 {summary.status}개 처리 완료"
        if summary.harmful > 0:
            message += f" (유해: {summary.harmful}개, 안전: {summary.safe}개)"
    else:
        message = f"총 {summary.total}개 이미지 처리 실패"
    
    return BatchAnalyzeResponse(
        image=results,
        summary=summary,
        message=message
    )

@router.get("/health")
async def health_check():
    """
    API 상태 및 AI 모델 설정 확인
    """
    from services.use_ai import ai_model
    import os
    
    # AI 모델 상태 확인
    ai_status = "loaded" if ai_model.model is not None else "not_loaded"
    model_exists = ai_model.model_path.exists() if hasattr(ai_model.model_path, 'exists') else False
    
    return {
        "status": "healthy",
        "ai_model": {
            "status": ai_status,
            "model_path": ai_model.model_path,
            "model_exists": model_exists,
            "threshold": ai_model.threshold
        },
        "supported_endpoints": [
            "/analyze/ (이미지 분석 - FormData)"
        ],
        "features": [
            "이미지 분석: AI 모델을 통한 유해성 검사",
            "배치 처리: 비동기 병렬 처리로 성능 최적화",
            "유해성 판단: 0.6 기준으로 단순 유해성 판단",
            "FormData 지원: blob 이미지 파일 직접 업로드"
        ],
        "limits": {
            "supported_formats": ["JPEG", "PNG", "GIF", "WebP"]
        }
    }

