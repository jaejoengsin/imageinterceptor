"""
Vision API 호출 서비스 (비동기 배치 처리 전용)
"""
import os
import asyncio
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor
from google.cloud import vision
from config import config

async def analyze_images_batch(img_urls: List[str]) -> List[Dict[str, Any]]:
    """
    여러 이미지 URL을 Vision API로 배치 전송하여 유해 여부 분석 (최대 16개)
    
    Args:
        img_urls (List[str]): 분석할 이미지 URL 리스트 (최대 16개)
        
    Returns:
        List[Dict[str, Any]]: 각 이미지별 분석 결과 리스트
        
    Note:
        - Google Cloud Vision API의 배치 처리 기능 사용
        - 한 번의 API 호출로 여러 이미지 동시 처리
        - 비용 효율적이고 성능 향상
    """
    
    # API 설정 확인
    if not config.is_configured():
        error_result = {
            "error": True,
            "message": "Google Cloud Vision API가 설정되지 않았습니다. 환경 변수를 확인해주세요.",
            "is_harmful": None
        }
        return [error_result] * len(img_urls)
    
    # 최대 16개 제한 확인
    if len(img_urls) > 16:
        error_result = {
            "error": True,
            "message": "Vision API는 한 번에 최대 16개 이미지만 처리할 수 있습니다.",
            "is_harmful": None
        }
        return [error_result] * len(img_urls)
    
    try:
        # 동기 Vision API 호출을 별도 스레드에서 실행
        loop = asyncio.get_event_loop()
        
        def _sync_vision_call():
            # Vision API 클라이언트 생성 (타임아웃 설정)
            client = vision.ImageAnnotatorClient()
            
            # 배치 요청 생성
            requests = []
            for img_url in img_urls:
                image = vision.Image()
                image.source.image_uri = img_url
                
                request = vision.AnnotateImageRequest(
                    image=image,
                    features=[vision.Feature(type_=vision.Feature.Type.SAFE_SEARCH_DETECTION)]
                )
                requests.append(request)
            
            # 배치 Safe Search Detection 수행 (타임아웃 30초)
            return client.batch_annotate_images(requests=requests, timeout=30.0)
        
        # ThreadPoolExecutor로 동기 함수를 비동기로 실행
        with ThreadPoolExecutor() as executor:
            response = await loop.run_in_executor(executor, _sync_vision_call)
        
        # 결과 처리
        results = []
        for i, image_response in enumerate(response.responses):
            if image_response.error.message:
                # 개별 이미지 오류
                result = {
                    "error": True,
                    "message": f"Vision API 오류 (이미지 {i+1}): {image_response.error.message}",
                    "is_harmful": None,
                    "image_url": img_urls[i]
                }
            else:
                # 성공적으로 처리된 경우
                result = _analyze_safe_search_results(image_response.safe_search_annotation)
                result["image_url"] = img_urls[i]
            
            results.append(result)
        
        return results
        
    except Exception as e:
        # 전체 배치 오류
        error_result = {
            "error": True,
            "message": f"Vision API 배치 호출 중 오류 발생: {str(e)}",
            "is_harmful": None
        }
        return [error_result] * len(img_urls)

def _analyze_safe_search_results(safe_search) -> dict:
    """
    Safe Search 결과를 분석하여 유해 여부 판단
    
    Args:
        safe_search: Google Vision API의 SafeSearchAnnotation 객체
        
    Returns:
        dict: 분석 결과
    """
    # Google Vision API의 Likelihood 값들
    # UNKNOWN = 0, VERY_UNLIKELY = 1, UNLIKELY = 2, POSSIBLE = 3, LIKELY = 4, VERY_LIKELY = 5
    
    categories = {
        "adult": safe_search.adult.value,
        "spoof": safe_search.spoof.value, 
        "medical": safe_search.medical.value,
        "violence": safe_search.violence.value,
        "racy": safe_search.racy.value
    }
    
    # 가장 높은 점수와 카테고리 찾기
    max_category = max(categories, key=categories.get)
    max_score = categories[max_category]
    
    # 유해 여부 판단 (3 이상이면 유해로 판단)
    is_harmful = max_score >= 3
    
    # 점수를 0-1 사이로 정규화 (5점 만점을 1점 만점으로)
    normalized_score = max_score / 5.0
    
    return {
        "error": False,
        "is_harmful": is_harmful,  # 라우터에서 harmful 필드로 매핑됨
        "category": max_category,
        "score": round(normalized_score, 2),
        "details": {
            "adult": categories["adult"],
            "spoof": categories["spoof"],
            "medical": categories["medical"], 
            "violence": categories["violence"],
            "racy": categories["racy"]
        },
        "auth_method": config.get_auth_method()
    }
