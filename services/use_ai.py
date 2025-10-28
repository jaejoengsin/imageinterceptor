"""
AI 모델 연결 모듈 
ImageInterceptor_AI/Scripts/infer.py의 함수들을 직접 호출하여 사용합니다.
"""

import asyncio
import os
import sys
import tempfile
from pathlib import Path
from typing import Dict, List, Any
from concurrent.futures import ThreadPoolExecutor

from PIL import ImageFile, UnidentifiedImageError

# 손상 이미지 허용 (infer.py에서도 설정됨)
ImageFile.LOAD_TRUNCATED_IMAGES = True

# AI Scripts 경로 추가
project_root = Path(__file__).parent.parent
ai_scripts_path = project_root / "ImageInterceptor_AI" / "Scripts"
sys.path.insert(0, str(ai_scripts_path))

# infer.py에서 직접 import
try:
    from infer import load_model, infer_one, FILTER_LEVEL_THRESHOLDS, resolve_threshold
    print(f"[AI] infer.py 모듈 로드 성공: {ai_scripts_path}")
except ImportError as e:
    print(f"[AI] infer.py 모듈 로드 실패: {e}")
    load_model = None
    infer_one = None
    FILTER_LEVEL_THRESHOLDS = {1: 0.40, 2: 0.50, 3: 0.65}
    resolve_threshold = None

# infer.py의 설정을 그대로 사용
LEVEL_THRESHOLDS = FILTER_LEVEL_THRESHOLDS


class AIModelManager:
    """infer.py를 직접 호출하는 AI 모델 관리자 (상주 모델)"""
    
    _instance = None
    _initialized = False

    def __new__(cls, model_path: str | None = None):
        """싱글턴 패턴으로 인스턴스 생성"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, model_path: str | None = None):
        # 이미 초기화된 경우 중복 초기화 방지
        if self._initialized:
            return
            
        default_path = project_root / "ImageInterceptor_AI" / "runs" / "best.pt"
        self.model_path = Path(model_path) if model_path else default_path
        
        # infer.py에서 사용하는 device 설정
        import torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.model_loaded = False
        self._initialized = True
        
        # GPU 상태 상세 로깅
        print(f"[AI] ==================== GPU 상태 ====================")
        print(f"[AI] PyTorch 버전: {torch.__version__}")
        print(f"[AI] CUDA 사용 가능: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"[AI] CUDA 버전: {torch.version.cuda}")
            print(f"[AI] GPU 개수: {torch.cuda.device_count()}")
            print(f"[AI] GPU 이름: {torch.cuda.get_device_name(0)}")
            print(f"[AI] 디바이스: {self.device} ✓ GPU 가속 활성화")
        else:
            print(f"[AI] 디바이스: {self.device} (CPU 모드)")
            print(f"[AI] GPU를 사용하려면 CUDA 버전 PyTorch 설치 필요")
            print(f"[AI] 설치 명령어: pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu118")
        print(f"[AI] 모델 경로: {self.model_path}")
        print(f"[AI] ===================================================")
        print(f"[AI] AIModelManager 초기화 완료 (모델 미로드 상태)")

    def load_model(self) -> bool:
        """
        상주 모델 로드 - FastAPI 시작 시 호출
        Returns: 로드 성공 여부
        """
        if self.model_loaded and self.model is not None:
            print(f"[AI] 모델이 이미 로드되어 있습니다.")
            return True
            
        try:
            if not self.model_path.exists():
                print(f"[AI] 모델 파일이 없습니다: {self.model_path}")
                return False
                
            if load_model is None:
                print(f"[AI] infer.py 모듈을 사용할 수 없습니다")
                return False
                
            print(f"[AI] 상주 모델 로딩 시작...")
            print(f"[AI] 모델 경로: {self.model_path}")
            print(f"[AI] 디바이스: {self.device}")
            
            # infer.py의 load_model 함수 직접 호출
            self.model = load_model(str(self.model_path), self.device)
            self.model_loaded = True
            
            print(f"[AI] 상주 모델 로드 완료! (infer.py 사용)")
            print(f"[AI] 이제 모든 요청에서 이 모델을 재사용합니다.")
            return True
            
        except Exception as e:
            print(f"[AI] 모델 로드 실패: {e}")
            self.model = None
            self.model_loaded = False
            return False
    
    def is_model_ready(self) -> bool:
        """모델이 사용 가능한 상태인지 확인"""
        return self.model_loaded and self.model is not None

    # -------------------------
    # 내부 추론
    # -------------------------
    def _predict_single(self, image_bytes: bytes, level: int = 2) -> Dict[str, Any]:
        """infer.py의 infer_one 함수를 직접 호출 (상주 모델 사용)"""
        if not self.is_model_ready():
            return {"error": True, "message": "상주 모델이 로드되지 않았습니다. 서버를 다시 시작해주세요."}
            
        if infer_one is None:
            return {"error": True, "message": "infer.py 모듈을 사용할 수 없습니다."}

        try:
            # 임시 파일에 이미지 저장
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                tmp_file.write(image_bytes)
                tmp_path = Path(tmp_file.name)
            
            # infer.py의 resolve_threshold 함수 사용
            if resolve_threshold is not None:
                threshold = resolve_threshold(level, None)
            else:
                threshold = LEVEL_THRESHOLDS.get(level, 0.50)
            
            # infer.py의 infer_one 함수 직접 호출
            result = infer_one(self.model, tmp_path, self.device, threshold, "safe")
            
            # 임시 파일 삭제
            tmp_path.unlink(missing_ok=True)
            
            # 결과에 오류가 있는지 확인
            if "error" in result:
                return {"error": True, "message": result["error"]}
            
            # 새로운 AI 출력 형식에 맞춰 변환
            # result = {"url": str, "status": bool, "harmful": bool, "category": str, "score": float}
            prob_harmful = result["score"]  # 이제 score가 p_harmful
            safe_prob = 1.0 - prob_harmful
            is_harmful = result["harmful"]
            
            return {
                "error": False,
                "probs": {"safe": safe_prob, "harmful": prob_harmful},
                "threshold": threshold,
                "is_harmful": is_harmful,
                "category": result["category"],  # AI에서 제공하는 category 사용
                "score": prob_harmful if is_harmful else safe_prob,
                "top_class": "harmful" if is_harmful else "safe",
                "top_score": float(max(safe_prob, prob_harmful)),
                "infer_result": result  # 원본 결과도 포함
            }
            
        except Exception as e:
            return {"error": True, "message": f"추론 중 오류: {e}"}

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


# 전역 인스턴스 (상주 모델 - 지연 로딩)
ai_model = AIModelManager(
    model_path=os.getenv("MODEL_WEIGHTS")  # 미설정 시 기본 경로 사용
)

# FastAPI 시작 시 호출할 초기화 함수
async def initialize_resident_model() -> bool:
    """상주 모델 초기화 - FastAPI lifespan에서 호출"""
    print(f"[AI] 상주 모델 초기화 시작...")
    success = ai_model.load_model()
    if success:
        print(f"[AI] 상주 모델 준비 완료! 이제 빠른 추론이 가능합니다.")
    else:
        print(f"[AI] 상주 모델 로드 실패. 요청 시 오류가 발생할 수 있습니다.")
    return success


# 외부에서 사용하는 함수
async def analyze_images_with_ai(
    image_bytes_list: List[bytes], levels: List[int] | None = None
) -> List[Dict[str, Any]]:
    return await ai_model.analyze_images_batch(image_bytes_list, levels)
