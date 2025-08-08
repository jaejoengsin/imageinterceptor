"""
메모리 캐시 관리자
URL 검증 및 Vision API 결과 캐싱으로 지연시간 최소화
"""
import time
import hashlib
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

@dataclass
class CacheEntry:
    """캐시 엔트리"""
    value: Any
    timestamp: float
    ttl: float  # Time To Live (초)
    
    def is_expired(self) -> bool:
        """만료 여부 확인"""
        return time.time() - self.timestamp > self.ttl

class MemoryCache:
    """메모리 기반 캐시"""
    
    def __init__(self, max_size: int = 1000):
        self.cache: Dict[str, CacheEntry] = {}
        self.max_size = max_size
    
    def _generate_key(self, data: str) -> str:
        """데이터를 기반으로 캐시 키 생성"""
        return hashlib.md5(data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 조회"""
        cache_key = self._generate_key(key)
        
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if not entry.is_expired():
                return entry.value
            else:
                # 만료된 엔트리 삭제
                del self.cache[cache_key]
        
        return None
    
    def set(self, key: str, value: Any, ttl: float = 300.0):
        """캐시에 값 저장 (기본 TTL: 5분)"""
        cache_key = self._generate_key(key)
        
        # 캐시 크기 제한
        if len(self.cache) >= self.max_size:
            self._evict_oldest()
        
        self.cache[cache_key] = CacheEntry(
            value=value,
            timestamp=time.time(),
            ttl=ttl
        )
    
    def _evict_oldest(self):
        """가장 오래된 엔트리 제거"""
        if not self.cache:
            return
        
        oldest_key = min(self.cache.keys(), 
                        key=lambda k: self.cache[k].timestamp)
        del self.cache[oldest_key]
    
    def clear_expired(self):
        """만료된 엔트리들 정리"""
        expired_keys = [
            key for key, entry in self.cache.items() 
            if entry.is_expired()
        ]
        for key in expired_keys:
            del self.cache[key]
    
    def stats(self) -> Dict[str, Any]:
        """캐시 통계"""
        current_time = time.time()
        active_entries = sum(
            1 for entry in self.cache.values() 
            if not entry.is_expired()
        )
        
        return {
            "total_entries": len(self.cache),
            "active_entries": active_entries,
            "expired_entries": len(self.cache) - active_entries,
            "hit_rate": getattr(self, '_hit_count', 0) / max(getattr(self, '_access_count', 1), 1)
        }

# 전역 캐시 인스턴스 (Vision API 결과만 캐싱)
vision_api_cache = MemoryCache(max_size=500)       # Vision API 결과 캐시

def get_vision_cache() -> MemoryCache:
    """Vision API 캐시 반환"""
    return vision_api_cache
