"""
AI 모델 연결 모듈 - PyTorch 모델 사용
nudity 및 violence 검출을 위한 ConvNeXt 모델 사용
"""
import asyncio
import numpy as np
import torch
from typing import Dict, List, Any
from PIL import Image
import io
import os
import sys
from concurrent.futures import ThreadPoolExecutor

# AI 모델 클래스 임포트
from pathlib import Path

# 프로젝트 루트 기준으로 절대 경로 설정
project_root = Path(__file__).parent.parent
ai_scripts_path = project_root / "ImageInterceptor_AI" / "Scripts"

sys.path.append(str(ai_scripts_path))

try:
    from convnext_multihead import ConvNeXtTinyMultiHead
except ImportError as e:
    print(f"AI 모델 클래스 import 실패: {e}")
    ConvNeXtTinyMultiHead = None


class AIModelManager:
    """AI 모델 관리 클래스"""
    
    def __init__(self, model_path: str = None):
        # 기본 모델 경로를 프로젝트 루트 기준으로 설정
        if model_path is None:
            project_root = Path(__file__).parent.parent
            self.model_path = project_root / "ImageInterceptor_AI" / "runs" / "convnext_tiny_multihead.pth"
        else:
            self.model_path = Path(model_path)
        
        self.model = None
        self.threshold = 0.6  # 0.6 이상이면 유해
        self._initialize_model()
    
    def _initialize_model(self):
        """PyTorch 모델 초기화"""
        try:
            if ConvNeXtTinyMultiHead is None:
                self.model = None
                return
                
            if self.model_path.exists():
                # PyTorch 모델 로드
                self.model = ConvNeXtTinyMultiHead()
                checkpoint = torch.load(str(self.model_path), map_location='cpu')
                self.model.load_state_dict(checkpoint)
                self.model.eval()
            else:
                self.model = None
        except Exception as e:
            print(f"PyTorch 모델 로드 실패: {e}")
            self.model = None
    
    def _preprocess_image(self, image_bytes: bytes, debug: bool = False) -> tuple:
        """이미지 전처리"""
        debug_info = {}
        
        try:
            # 입력 이미지 정보 수집
            debug_info["input_size"] = len(image_bytes)
            debug_info["input_format"] = "bytes"
            
            
            # PIL로 이미지 열기
            image = Image.open(io.BytesIO(image_bytes))
            debug_info["original_size"] = image.size
            debug_info["original_mode"] = image.mode
            debug_info["original_format"] = image.format
            
            
            # RGB로 변환
            if image.mode != 'RGB':
                image = image.convert('RGB')
                debug_info["converted_to_rgb"] = True
            else:
                debug_info["converted_to_rgb"] = False
            
            # 리사이즈 (224x224)
            original_size = image.size
            image = image.resize((224, 224))
            debug_info["resized_from"] = original_size
            debug_info["resized_to"] = (224, 224)
            
            # numpy 배열로 변환 및 정규화
            image_array = np.array(image, dtype=np.float32)
            debug_info["array_shape_after_conversion"] = image_array.shape
            debug_info["pixel_value_range_before_norm"] = {
                "min": float(image_array.min()),
                "max": float(image_array.max()),
                "mean": float(image_array.mean())
            }
            
            image_array = image_array / 255.0  # 0-1 정규화
            debug_info["pixel_value_range_after_0_1_norm"] = {
                "min": float(image_array.min()),
                "max": float(image_array.max()),
                "mean": float(image_array.mean())
            }
            
            # ImageNet 정규화
            mean = np.array([0.485, 0.456, 0.406])
            std = np.array([0.229, 0.224, 0.225])
            image_array = (image_array - mean) / std
            debug_info["pixel_value_range_after_imagenet_norm"] = {
                "min": float(image_array.min()),
                "max": float(image_array.max()),
                "mean": float(image_array.mean())
            }
            
            # 채널 순서 변경 (HWC -> CHW)
            image_array = np.transpose(image_array, (2, 0, 1))
            debug_info["array_shape_after_transpose"] = image_array.shape
            
            # PyTorch 텐서로 변환 및 배치 차원 추가 (float32로 명시적 변환)
            image_tensor = torch.from_numpy(image_array).float().unsqueeze(0)
            debug_info["tensor_shape"] = list(image_tensor.shape)
            debug_info["tensor_dtype"] = str(image_tensor.dtype)
            debug_info["tensor_device"] = str(image_tensor.device)
            debug_info["tensor_requires_grad"] = image_tensor.requires_grad
            
            # 텐서 통계
            debug_info["tensor_stats"] = {
                "min": float(image_tensor.min()),
                "max": float(image_tensor.max()),
                "mean": float(image_tensor.mean()),
                "std": float(image_tensor.std())
            }
            
            if debug:
                return image_tensor, debug_info
            else:
                return image_tensor, None
            
        except Exception as e:
            debug_info["error"] = str(e)
            raise ValueError(f"이미지 전처리 실패: {e}")
    
    def _predict_single_image(self, image_bytes: bytes, level: int = 2, debug: bool = False) -> Dict[str, Any]:
        """단일 이미지 예측"""
        if self.model is None:
            return {
                "error": True,
                "message": "AI 모델이 로드되지 않았습니다",
                "nudity": 0.0,
                "violence": 0.0
            }
        
        try:
            # 이미지 전처리 (디버그 정보 포함)
            result = self._preprocess_image(image_bytes, debug=debug)
            if debug:
                x, preprocessing_debug = result
            else:
                x, _ = result
            
            # 모델 입력 검증
            model_input_info = {
                "input_shape": list(x.shape),
                "input_dtype": str(x.dtype),
                "input_device": str(x.device),
                "input_stats": {
                    "min": float(x.min()),
                    "max": float(x.max()),
                    "mean": float(x.mean()),
                    "std": float(x.std())
                }
            }
            
            # PyTorch 모델 추론
            with torch.no_grad():
                outputs = self.model(x)  # [B, 2] - [nudity, violence]
                
                # 모델 출력 정보
                model_output_info = {
                    "output_shape": list(outputs.shape),
                    "output_dtype": str(outputs.dtype),
                    "raw_outputs": outputs.cpu().numpy().tolist(),
                    "output_stats": {
                        "min": float(outputs.min()),
                        "max": float(outputs.max()),
                        "mean": float(outputs.mean()),
                        "std": float(outputs.std())
                    }
                }
                
            # Sigmoid 함수 적용 (로그오즈를 확률로 변환)
            probs = torch.sigmoid(outputs).cpu().numpy()
            
            # 스칼라 값으로 변환
            nudity_score = float(probs[0, 0])
            violence_score = float(probs[0, 1])
            
            # level에 따른 임계값 설정
            level_thresholds = {
                1: 0.8,  # 약 - 엄격한 기준 (높은 임계값)
                2: 0.6,  # 중 - 기본 기준
                3: 0.4   # 강 - 관대한 기준 (낮은 임계값)
            }
            current_threshold = level_thresholds.get(level, 0.6)
            
            max_score = max(nudity_score, violence_score)
            final_harmful = max_score >= current_threshold
            
            result = {
                "error": False,
                "nudity": nudity_score,
                "violence": violence_score
            }
            
            # 디버그 모드일 때 추가 정보 포함
            if debug:
                result["debug_info"] = {
                    "preprocessing": preprocessing_debug,
                    "model_input": model_input_info,
                    "model_output": model_output_info,
                    "final_probabilities": {
                        "nudity": nudity_score,
                        "violence": violence_score
                    }
                }
            
            return result
            
        except Exception as e:
            error_result = {
                "error": True,
                "message": f"AI 모델 예측 실패: {e}",
                "nudity": 0.0,
                "violence": 0.0
            }
            
            if debug:
                error_result["debug_info"] = {
                    "error_location": "prediction",
                    "error_details": str(e)
                }
            
            return error_result
    
    async def analyze_images_batch(
        self, 
        image_bytes_list: List[bytes],
        levels: List[int] = None
    ) -> List[Dict[str, Any]]:
        """
        여러 이미지 배치 분석 (비동기)
        
        Args:
            image_bytes_list: 이미지 바이트 데이터 리스트
            
        Returns:
            각 이미지별 분석 결과 리스트
        """
        if not image_bytes_list:
            return []
        
        # levels가 제공되지 않으면 모든 이미지에 대해 기본값(2) 사용
        if levels is None:
            levels = [2] * len(image_bytes_list)
        elif len(levels) != len(image_bytes_list):
            # levels 개수가 이미지 개수와 다르면 부족한 부분은 기본값으로 채움
            levels = levels + [2] * (len(image_bytes_list) - len(levels))
        
        try:
            # ThreadPoolExecutor를 사용해 CPU 집약적 작업을 병렬 처리
            loop = asyncio.get_event_loop()
            
            async def process_single_image(image_bytes: bytes, level: int) -> Dict[str, Any]:
                # 별도 스레드에서 AI 모델 실행
                with ThreadPoolExecutor() as executor:
                    result = await loop.run_in_executor(
                        executor, 
                        self._predict_single_image, 
                        image_bytes,
                        level
                    )
                
                if result["error"]:
                    return {
                        "error": True,
                        "message": result["message"],
                        "is_harmful": False,
                        "category": "unknown",
                        "score": 0.0
                    }
                
                # 유해 여부 판단 (0.6 기준)
                nudity_score = result["nudity"]
                violence_score = result["violence"]
                
                # 둘 중 더 높은 점수로 유해성 판단
                max_score = max(nudity_score, violence_score)
                is_harmful = max_score >= self.threshold
                
                # 더 높은 점수의 카테고리 선택
                if nudity_score > violence_score:
                    category = "nudity"
                else:
                    category = "violence"
                
                return {
                    "error": False,
                    "is_harmful": is_harmful,
                    "category": category,
                    "score": round(max_score, 3)
                }
            
            # 모든 이미지를 병렬로 처리 (각각의 level과 함께)
            tasks = [process_single_image(img_bytes, level) for img_bytes, level in zip(image_bytes_list, levels)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 예외 처리
            final_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    final_results.append({
                        "error": True,
                        "message": f"이미지 {i+1} 처리 중 오류: {str(result)}",
                        "is_harmful": False,
                        "category": "error",
                        "score": 0.0
                    })
                else:
                    final_results.append(result)
            
            return final_results
            
        except Exception as e:
            # 전체 배치 오류
            error_result = {
                "error": True,
                "message": f"배치 처리 중 오류: {str(e)}",
                "is_harmful": False,
                "category": "error",
                "score": 0.0
            }
            return [error_result] * len(image_bytes_list)


# 전역 AI 모델 매니저 인스턴스
ai_model = AIModelManager()


async def analyze_images_with_ai(
    image_bytes_list: List[bytes],
    levels: List[int] = None
) -> List[Dict[str, Any]]:
    """
    AI 모델을 사용한 이미지 분석 함수 (외부에서 사용)
    
    Args:
        image_bytes_list: 이미지 바이트 데이터 리스트
        levels: 각 이미지별 필터 강도 (1=약, 2=중, 3=강)
        
    Returns:
        각 이미지별 분석 결과 리스트
    """
    return await ai_model.analyze_images_batch(image_bytes_list, levels)


