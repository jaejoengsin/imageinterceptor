"""
2025.09.11 수정 - 멀티헤드 분류 -> 이진 분류로 변경
AI 모델 연결 모듈 
ConvNeXt-Tiny 기반 이진 분류 체크포인트를 로드하여 추론합니다.
"""

import asyncio
import io
import os
from pathlib import Path
from typing import Dict, List, Any
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import torch
import torch.nn as nn
from PIL import Image, ImageFile, UnidentifiedImageError

# 손상/대용량 이미지 허용
ImageFile.LOAD_TRUNCATED_IMAGES = True
Image.MAX_IMAGE_PIXELS = None


# 설정

LEVEL_THRESHOLDS = {1: 0.80, 2: 0.60, 3: 0.40}  # harmful 확률 임계값
IMG_SIZE = 224


def _imagenet_preprocess(pil_img: Image.Image) -> torch.Tensor:
    """PIL 이미지 -> (1,3,224,224) float32 텐서 (ImageNet 정규화)"""
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")
    pil_img = pil_img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(pil_img, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std
    arr = np.transpose(arr, (2, 0, 1))               # HWC->CHW
    x = torch.from_numpy(arr).float().unsqueeze(0)   # (1,3,224,224)
    return x


class AIModelManager:
    """Binary classifier manager: safe(0) vs harmful(1)"""

    def __init__(self, model_path: str | None = None):
        project_root = Path(__file__).parent.parent
        default_path = project_root / "ai" / "checkpoints" / "best.pt"
        self.model_path = Path(model_path) if model_path else default_path

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu") # 일단 냅다 GPU, 없으면 CPU
        self.model: nn.Module | None = None
        self.classes: List[str] = ["0", "1"]  # 비유해 0 유해 1
        self._init_model()

    def _build_model(self) -> nn.Module:
        from torchvision import models
        m = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.IMAGENET1K_V1)
        in_feats = m.classifier[2].in_features
        m.classifier[2] = nn.Linear(in_feats, 2)
        return m

    def _init_model(self) -> None:
        try:
            if not self.model_path.exists():
                print(f"[AI] 모델 파일이 없습니다: {self.model_path}")
                return
            ckpt = torch.load(str(self.model_path), map_location="cpu")
            # train_1.py 저장 형식: {"model": state_dict, "img_size":..., "model_name":..., "classes":[...]}
            state_dict = ckpt["model"] if isinstance(ckpt, dict) and "model" in ckpt else ckpt
            if isinstance(ckpt, dict) and "classes" in ckpt:
                self.classes = [str(c) for c in ckpt["classes"]]

            m = self._build_model()
            m.load_state_dict(state_dict, strict=True)
            m.eval().to(self.device)
            self.model = m
            print(f"[AI] 모델 로드 완료: {self.model_path} | device={self.device} | classes={self.classes}")
        except Exception as e:
            print(f"[AI] 모델 로드 실패: {e}")
            self.model = None

    # -------------------------
    # 내부 추론
    # -------------------------
    def _predict_single(self, image_bytes: bytes, level: int = 2) -> Dict[str, Any]:
        if self.model is None:
            return {"error": True, "message": "AI 모델이 로드되지 않았습니다."}

        try:
            img = Image.open(io.BytesIO(image_bytes))
        except UnidentifiedImageError:
            return {"error": True, "message": "유효하지 않은 이미지 형식입니다."}
        except Exception as e:
            return {"error": True, "message": f"이미지 로딩 오류: {e}"}

        x = _imagenet_preprocess(img).to(self.device)

        with torch.no_grad():
            logits = self.model(x)                 # (1,2)
            probs  = torch.softmax(logits, dim=-1).detach().cpu().numpy()[0]  # [p0, p1]

        # 클래스 매핑: 0 -> safe, 1 -> harmful
        safe_prob    = float(probs[0])
        harmful_prob = float(probs[1])

        th = LEVEL_THRESHOLDS.get(level, 0.60)
        is_harmful = (harmful_prob >= th)

        top_idx = int(np.argmax(probs))
        top_class = "harmful" if top_idx == 1 else "safe"
        top_score = float(max(safe_prob, harmful_prob))

        return {
            "error": False,
            "probs": {"safe": safe_prob, "harmful": harmful_prob},
            "threshold": th,
            "is_harmful": is_harmful,
            "category": "harmful" if is_harmful else "safe",
            "score": harmful_prob if is_harmful else safe_prob,
            "top_class": top_class,
            "top_score": top_score,
        }

    # -------------------------
    # 배치 비동기 추론
    # -------------------------
    async def analyze_images_batch(
        self, image_bytes_list: List[bytes], levels: List[int] | None = None
    ) -> List[Dict[str, Any]]:
        if not image_bytes_list:
            return []

        if levels is None:
            levels = [2] * len(image_bytes_list)
        elif len(levels) != len(image_bytes_list):
            # 부족분 기본값 보정
            levels = levels + [2] * (len(image_bytes_list) - len(levels))

        loop = asyncio.get_event_loop()
        results: List[Dict[str, Any]] = []
        try:
            max_workers = min(4, len(image_bytes_list))
            with ThreadPoolExecutor(max_workers=max_workers) as ex:
                tasks = [
                    loop.run_in_executor(ex, self._predict_single, b, lvl)
                    for b, lvl in zip(image_bytes_list, levels)
                ]
                done = await asyncio.gather(*tasks, return_exceptions=True)

            for i, r in enumerate(done):
                if isinstance(r, Exception):
                    results.append({
                        "error": True, "message": f"이미지 {i+1} 처리 중 오류: {r}"
                    })
                else:
                    results.append(r)
            return results
        except Exception as e:
            # 전체 실패 시 동일 메시지로 채움
            return [{"error": True, "message": f"배치 처리 오류: {e}"} for _ in image_bytes_list]


# 전역 인스턴스
ai_model = AIModelManager(
    model_path=os.getenv("MODEL_WEIGHTS")  # 미설정 시 기본 경로 사용
)


# 외부에서 사용하는 함수
async def analyze_images_with_ai(
    image_bytes_list: List[bytes], levels: List[int] | None = None
) -> List[Dict[str, Any]]:
    return await ai_model.analyze_images_batch(image_bytes_list, levels)
