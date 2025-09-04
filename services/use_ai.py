"""
AI 모델 연결 모듈 - PyTorch 모델 사용
nudity 및 violence 검출을 위한 ConvNeXt 모델 사용
"""
import asyncio
import numpy as np
import torch
import torch.nn.functional as F
from typing import Dict, List, Any
from PIL import Image
import io
import os
import sys
from concurrent.futures import ThreadPoolExecutor

# AI 모델 클래스 임포트
import os
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
                print("경고: AI 모델 클래스를 import할 수 없습니다.")
                self.model = None
                return
                
            if self.model_path.exists():
                # PyTorch 모델 로드
                self.model = ConvNeXtTinyMultiHead()
                checkpoint = torch.load(str(self.model_path), map_location='cpu')
                self.model.load_state_dict(checkpoint)
                self.model.eval()
                print(f"PyTorch 모델 로드 완료: {self.model_path}")
            else:
                print(f"경고: PyTorch 모델 파일을 찾을 수 없습니다: {self.model_path}")
                self.model = None
        except Exception as e:
            print(f"PyTorch 모델 로드 실패: {e}")
            print(f"모델 경로: {self.model_path}")
            print(f"경로 존재 여부: {self.model_path.exists() if hasattr(self.model_path, 'exists') else 'Path 객체가 아님'}")
            self.model = None
    
    def _preprocess_image(self, image_bytes: bytes) -> torch.Tensor:
        """이미지 전처리"""
        try:
            # PIL로 이미지 열기
            image = Image.open(io.BytesIO(image_bytes))
            
            # RGB로 변환
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # 리사이즈 (224x224)
            image = image.resize((224, 224))
            
            # numpy 배열로 변환 및 정규화
            image_array = np.array(image, dtype=np.float32)
            image_array = image_array / 255.0  # 0-1 정규화
            
            # ImageNet 정규화
            mean = np.array([0.485, 0.456, 0.406])
            std = np.array([0.229, 0.224, 0.225])
            image_array = (image_array - mean) / std
            
            # 채널 순서 변경 (HWC -> CHW)
            image_array = np.transpose(image_array, (2, 0, 1))
            
            # PyTorch 텐서로 변환 및 배치 차원 추가
            image_tensor = torch.from_numpy(image_array).unsqueeze(0)
            
            return image_tensor
            
        except Exception as e:
            raise ValueError(f"이미지 전처리 실패: {e}")
    
    def _predict_single_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """단일 이미지 예측"""
        if self.model is None:
            return {
                "error": True,
                "message": "AI 모델이 로드되지 않았습니다",
                "nudity": 0.0,
                "violence": 0.0
            }
        
        try:
            # 이미지 전처리
            x = self._preprocess_image(image_bytes)
            
            # PyTorch 모델 추론
            with torch.no_grad():
                outputs = self.model(x)  # [B, 2] - [nudity, violence]
                
            # Sigmoid 함수 적용 (로그오즈를 확률로 변환)
            probs = torch.sigmoid(outputs).cpu().numpy()
            
            # 스칼라 값으로 변환
            nudity_score = float(probs[0, 0])
            violence_score = float(probs[0, 1])
            
            return {
                "error": False,
                "nudity": nudity_score,
                "violence": violence_score
            }
            
        except Exception as e:
            return {
                "error": True,
                "message": f"AI 모델 예측 실패: {e}",
                "nudity": 0.0,
                "violence": 0.0
            }
    
    async def analyze_images_batch(
        self, 
        image_bytes_list: List[bytes]
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
        
        try:
            # ThreadPoolExecutor를 사용해 CPU 집약적 작업을 병렬 처리
            loop = asyncio.get_event_loop()
            
            async def process_single_image(image_bytes: bytes) -> Dict[str, Any]:
                # 별도 스레드에서 AI 모델 실행
                with ThreadPoolExecutor() as executor:
                    result = await loop.run_in_executor(
                        executor, 
                        self._predict_single_image, 
                        image_bytes
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
            
            # 모든 이미지를 병렬로 처리
            tasks = [process_single_image(img_bytes) for img_bytes in image_bytes_list]
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
    image_bytes_list: List[bytes]
) -> List[Dict[str, Any]]:
    """
    AI 모델을 사용한 이미지 분석 함수 (외부에서 사용)
    
    Args:
        image_bytes_list: 이미지 바이트 데이터 리스트
        
    Returns:
        각 이미지별 분석 결과 리스트
    """
    return await ai_model.analyze_images_batch(image_bytes_list)
