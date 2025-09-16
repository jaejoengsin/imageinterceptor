"""
환경 설정 파일 (Cloud Run 최적화)
Google Cloud Vision API 사용을 위한 설정
"""
import os
from dotenv import load_dotenv

# .env 파일 로드 (로컬 개발 시에만 사용)
load_dotenv()

class Config:
    """환경 설정 클래스 (Cloud Run 최적화)"""
    
    # Google Cloud Vision API 설정
    GOOGLE_CLOUD_API_KEY = os.getenv("GOOGLE_CLOUD_API_KEY")
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # Cloud Run 환경 감지 (간소화)
    is_cloud_run = bool(os.getenv("K_SERVICE"))
    
    @classmethod
    def is_configured(cls) -> bool:
        """Vision API 사용 가능한지 확인"""
        # Cloud Run 환경에서는 자동 인증
        if cls.is_cloud_run:
            return True
        
        # 로컬 개발환경에서는 API 키 또는 서비스 계정 필요
        return bool(cls.GOOGLE_CLOUD_API_KEY or cls.GOOGLE_APPLICATION_CREDENTIALS)
    
    @classmethod
    def get_auth_method(cls) -> str:
        """사용 중인 인증 방법 반환"""
        if cls.is_cloud_run:
            return "CLOUD_RUN_AUTO"
        elif cls.GOOGLE_CLOUD_API_KEY:
            return "API_KEY"
        elif cls.GOOGLE_APPLICATION_CREDENTIALS:
            return "SERVICE_ACCOUNT"
        else:
            return "NONE"
    
    @classmethod
    def get_environment(cls) -> str:
        """실행 환경 반환"""
        return "Cloud Run" if cls.is_cloud_run else "Local"

# 설정 인스턴스
config = Config() 