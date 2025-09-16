"""
이미지 분석 라우터 - FormData로 blob 이미지 처리 (Binary: safe vs harmful)
"""
import asyncio
import json
from typing import List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, Form, File

from models.image import (
    BatchAnalyzeResponse,
    ImageResult,
    AnalyzeSummary,
    ImageMeta,
)
from services.use_ai import analyze_images_with_ai, ai_model, LEVEL_THRESHOLDS


# /analyze 하위로 라우팅
router = APIRouter(prefix="/analyze", tags=["analyze"])

@router.post("", response_model=BatchAnalyzeResponse)
async def analyze_images_batch_endpoint(
    images: List[UploadFile] = File(...),
    imgMeta: List[str] = Form(...),
    filter: Optional[str] = Form(None),
):
    """
    여러 이미지를 FormData로 배치 처리 (최대 20개)

    확장프로그램 요청 형식:
      - images: 이미지 blob 파일들 (UploadFile 형태, 같은 키로 여러 파일)
      - imgMeta: 각 이미지의 메타데이터 JSON 문자열 배열 (url, status, harmful)
      - filter: 전역 필터 레벨 (1=약, 2=중, 3=강) - 선택사항

    예시:
      formData.append('images', img1.blob, 'image1.jpg');
      formData.append('images', img2.blob, 'image2.jpg');
      formData.append('imgMeta', JSON.stringify({url: "...", status: false, harmful: false}));
      formData.append('imgMeta', JSON.stringify({url: "...", status: false, harmful: false}));
      formData.append('filter', '2');  // 전역 필터 레벨
    """

    # 업로드 개수 제한
    if len(images) > 20:
        raise HTTPException(400, "이미지는 한 번에 최대 20개까지만 업로드할 수 있습니다.")

    # 이미지/메타 개수 일치 확인
    if len(images) != len(imgMeta):
        raise HTTPException(400, "이미지 개수와 메타데이터 개수가 일치하지 않습니다.")

    # MIME 사전 검증
    for f in images:
        if f.content_type and not f.content_type.startswith("image/"):
            raise HTTPException(400, f"{f.filename}: 이미지 파일만 업로드하세요.")

    # 1) 메타데이터 파싱
    parsed_meta: List[Optional[ImageMeta]] = []
    for meta_str in imgMeta:
        try:
            meta_dict = json.loads(meta_str)
            parsed_meta.append(ImageMeta(**meta_dict))
        except Exception as e:
            parsed_meta.append(None)

    # 2) 결과 리스트 미리 생성 (url/status/harmful 기본 반영)
    results: List[ImageResult] = []
    for pm in parsed_meta:
        if pm is None:
            results.append(
                ImageResult(
                    url="",
                    status=False,
                    harmful=False,
                    error=True,
                    error_type="meta_invalid",
                    error_message="메타데이터 파싱 실패",
                )
            )
        else:
            results.append(
                ImageResult(
                    url=pm.url,
                    status=pm.status,
                    harmful=pm.harmful,
                )
            )

    # 3) 이미지 파일 읽기 (비동기 병렬)
    read_tasks = [img.read() for img in images]
    raw_bytes_list = await asyncio.gather(*read_tasks, return_exceptions=True)

    image_bytes_list: List[Optional[bytes]] = []
    valid_indices: List[int] = []
    for i, (raw, pm) in enumerate(zip(raw_bytes_list, parsed_meta)):
        if pm is None or isinstance(raw, Exception):
            image_bytes_list.append(None)
            # 에러 상세 업데이트
            results[i].error = True
            results[i].error_type = "image_invalid" if pm is not None else "meta_invalid"
            results[i].error_message = (
                f"이미지 처리 실패: {raw}" if isinstance(raw, Exception) else "메타데이터 오류"
            )
            continue

        try:
            img_bytes = raw
            if not img_bytes:
                raise ValueError("이미지 데이터가 비어있습니다")
            image_bytes_list.append(img_bytes)
            valid_indices.append(i)
        except Exception as e:
            image_bytes_list.append(None)
            results[i].error = True
            results[i].error_type = "image_invalid"
            results[i].error_message = f"이미지 처리 실패: {e}"

    # 4) AI 추론 (유효 이미지만 배치로)
    valid_image_bytes = [b for b in image_bytes_list if b is not None]
    
    # filter 값이 있으면 모든 이미지에 적용, 없으면 imgMeta의 level 사용
    if filter:
        try:
            global_level = int(filter)
            if global_level in (1, 2, 3):
                valid_levels = [global_level] * len(valid_image_bytes)
            else:
                valid_levels = [2] * len(valid_image_bytes)  # 기본값
        except (ValueError, TypeError):
            valid_levels = [2] * len(valid_image_bytes)  # 기본값
    else:
        # filter 값이 없으면 기본값 2 사용
        valid_levels = [2] * len(valid_image_bytes)

    summary = AnalyzeSummary(total=len(images))

    if valid_image_bytes:
        try:
            ai_results = await analyze_images_with_ai(valid_image_bytes, valid_levels)

            # 유효한 인덱스 순서대로 결과 매핑
            for idx_in_batch, original_idx in enumerate(valid_indices):
                ai_res = ai_results[idx_in_batch]
                if ai_res.get("error", False):
                    results[original_idx].error = True
                    results[original_idx].error_type = "ai_error"
                    results[original_idx].error_message = ai_res.get("message", "AI 분석 오류")
                    continue

                # 성공 매핑
                results[original_idx].processed = True
                results[original_idx].status = True
                results[original_idx].harmful = ai_res.get("is_harmful", False)
                results[original_idx].category = ai_res.get("category")
                results[original_idx].score = ai_res.get("score")

                # 선택 필드(모델 스키마에 있다면)
                try:
                    if hasattr(results[original_idx], "threshold"):
                        results[original_idx].threshold = ai_res.get("threshold")
                except Exception:
                    pass
                try:
                    if hasattr(results[original_idx], "probs"):
                        results[original_idx].probs = ai_res.get("probs")
                except Exception:
                    pass
                

                # 요약 집계
                summary.status += 1
                if results[original_idx].harmful:
                    summary.harmful += 1
                else:
                    summary.safe += 1

        except Exception as e:
            # 배치 전체 실패 시, 유효 인덱스에 시스템 오류 기록
            for original_idx in valid_indices:
                if not getattr(results[original_idx], "error", False):
                    results[original_idx].error = True
                    results[original_idx].error_type = "ai_system_error"
                    results[original_idx].error_message = f"AI 시스템 오류: {e}"

    # 5) 응답 메시지 생성
    if summary.status > 0:
        message = f"총 {summary.total}개 이미지 중 {summary.status}개 처리 완료"
        if summary.harmful > 0:
            message += f" (유해: {summary.harmful}개, 안전: {summary.safe}개)"
    else:
        message = f"총 {summary.total}개 이미지 처리 실패"

    return BatchAnalyzeResponse(
        image=results,
        summary=summary,
        message=message,
    )


@router.get("/health")
async def health_check():
    """
    API/AI 상태 확인 엔드포인트
    """
    model_exists = False
    model_path_str = ""
    try:
        model_exists = ai_model.model_path.exists()
        model_path_str = str(ai_model.model_path)
    except Exception:
        pass

    return {
        "status": "healthy",
        "ai_model": {
            "status": "loaded" if ai_model.model is not None else "not_loaded",
            "model_path": model_path_str,
            "model_exists": model_exists,
            "level_thresholds": LEVEL_THRESHOLDS,  # {1:0.8, 2:0.6, 3:0.4}
            "default_level": 2,
        },
        "supported_endpoints": [
            "POST /analyze         (이미지 배치 분석 - FormData)",
            "GET  /analyze/health  (상태 확인)",
        ],
        "features": [
            "AI 모델 기반 유해성 검사 (safe/harmful)",
            "비동기 배치 처리로 성능 최적화",
            "레벨별 임계값: 1(0.8) / 2(0.6) / 3(0.4)",
            "FormData 업로드(Blob) 지원",
        ],
        "limits": {"supported_formats": ["JPEG", "PNG", "GIF", "WebP"]},
    }