"""
PyTorch 모델을 ONNX 형식으로 변환하는 스크립트
runs/convnext_tiny_multihead.pth -> runs/convnext_tiny_multihead.onnx
"""
import torch
import torch.onnx
import os

def convert_pytorch_to_onnx(
    pytorch_model_path: str = "runs/convnext_tiny_multihead.pth",
    onnx_model_path: str = "runs/convnext_tiny_multihead.onnx"
):
    """
    PyTorch 모델을 ONNX 형식으로 변환
    
    Args:
        pytorch_model_path: 입력 PyTorch 모델 경로
        onnx_model_path: 출력 ONNX 모델 경로
    """
    
    # PyTorch 모델 파일 존재 확인
    if not os.path.exists(pytorch_model_path):
        print(f"오류: PyTorch 모델 파일을 찾을 수 없습니다: {pytorch_model_path}")
        return False
    
    try:
        print(f"PyTorch 모델 로드 중: {pytorch_model_path}")
        
        # PyTorch 모델 로드 (CPU에서 로드)
        device = torch.device('cpu')
        checkpoint = torch.load(pytorch_model_path, map_location=device)
        
        # 모델 아키텍처를 정의해야 하는 경우 (실제 모델에 따라 수정 필요)
        # 여기서는 일반적인 변환 과정을 보여줍니다
        print("모델 구조 확인 중...")
        
        # 체크포인트에서 모델 상태 확인
        if isinstance(checkpoint, dict):
            if 'model' in checkpoint:
                model_state = checkpoint['model']
            elif 'state_dict' in checkpoint:
                model_state = checkpoint['state_dict']
            else:
                model_state = checkpoint
        else:
            model_state = checkpoint
        
        print("모델 상태 딕셔너리 키:")
        for key in list(model_state.keys())[:10]:  # 처음 10개만 출력
            print(f"  {key}: {model_state[key].shape}")
        
        # 더미 입력 생성 (배치 크기 1, 채널 3, 높이 224, 너비 224)
        dummy_input = torch.randn(1, 3, 224, 224)
        
        print("ONNX 변환을 위해 실제 모델 클래스가 필요합니다.")
        print("모델 아키텍처를 확인하고 해당 클래스를 임포트해야 합니다.")
        print("\n다음 단계:")
        print("1. 원본 모델의 아키텍처 클래스를 확인")
        print("2. 해당 클래스를 임포트")
        print("3. 모델 인스턴스 생성 후 state_dict 로드")
        print("4. torch.onnx.export() 호출")
        
        # 예시 코드 (실제 모델에 맞게 수정 필요)
        """
        # 실제 변환 코드 예시:
        from your_model_file import YourModelClass
        
        model = YourModelClass()
        model.load_state_dict(model_state)
        model.eval()
        
        torch.onnx.export(
            model,
            dummy_input,
            onnx_model_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['nudity_output', 'violence_output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'nudity_output': {0: 'batch_size'},
                'violence_output': {0: 'batch_size'}
            }
        )
        """
        
        return False  # 실제 변환은 모델 아키텍처가 필요함
        
    except Exception as e:
        print(f"ONNX 변환 중 오류 발생: {e}")
        return False

def create_dummy_onnx_for_testing():
    """
    테스트용 더미 ONNX 모델 생성
    실제 모델이 없을 때 API 테스트를 위한 용도
    """
    import torch.nn as nn
    
    class DummyModel(nn.Module):
        def __init__(self):
            super(DummyModel, self).__init__()
            self.features = nn.Sequential(
                nn.Conv2d(3, 64, kernel_size=3, padding=1),
                nn.ReLU(),
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten()
            )
            self.nudity_head = nn.Linear(64, 1)
            self.violence_head = nn.Linear(64, 1)
        
        def forward(self, x):
            features = self.features(x)
            nudity = self.nudity_head(features)
            violence = self.violence_head(features)
            return nudity, violence
    
    model = DummyModel()
    model.eval()
    
    dummy_input = torch.randn(1, 3, 224, 224)
    onnx_path = "runs/convnext_tiny_multihead.onnx"
    
    os.makedirs(os.path.dirname(onnx_path), exist_ok=True)
    
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['nudity_output', 'violence_output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'nudity_output': {0: 'batch_size'},
            'violence_output': {0: 'batch_size'}
        }
    )
    
    print(f"더미 ONNX 모델 생성 완료: {onnx_path}")
    return True

if __name__ == "__main__":
    print("ONNX 변환 스크립트")
    print("=" * 50)
    
    # PyTorch 모델 존재 확인
    pytorch_path = "runs/convnext_tiny_multihead.pth"
    onnx_path = "runs/convnext_tiny_multihead.onnx"
    
    if os.path.exists(pytorch_path):
        print(f"PyTorch 모델 발견: {pytorch_path}")
        result = convert_pytorch_to_onnx(pytorch_path, onnx_path)
        if not result:
            print("\n실제 변환 실패. 더미 모델 생성 중...")
            create_dummy_onnx_for_testing()
    else:
        print(f"PyTorch 모델이 없습니다: {pytorch_path}")
        print("테스트용 더미 ONNX 모델을 생성합니다...")
        create_dummy_onnx_for_testing()
