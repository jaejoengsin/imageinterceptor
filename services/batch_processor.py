"""
시간 기반 배치 처리 서비스
이미지가 16개 모이거나 일정 시간이 지나면 Vision API로 전송
"""
import asyncio
import time
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from services.vision_client import analyze_images_batch
from services.url_validator import is_valid_public_image_url


@dataclass
class BatchItem:
    """배치 처리할 이미지 아이템"""
    id: str
    image_data: Any
    result: Any
    timestamp: float
    callback: Optional[Callable] = None


class TimeBatchProcessor:
    """시간 기반 배치 처리기"""
    
    def __init__(self, max_batch_size: int = 16, max_wait_time: float = 1.5):
        """
        Args:
            max_batch_size: 최대 배치 크기 (16개)
            max_wait_time: 최대 대기 시간 (초) - 이 시간이 지나면 현재까지 모인 이미지만 처리
        """
        self.max_batch_size = max_batch_size
        self.max_wait_time = max_wait_time
        self.batch_queue: List[BatchItem] = []
        self.processing_lock = asyncio.Lock()
        self.background_task: Optional[asyncio.Task] = None
        self.running = False
    
    async def start(self):
        """배치 처리기 시작"""
        if self.running:
            return
        
        self.running = True
        self.background_task = asyncio.create_task(self._background_processor())
    
    async def stop(self):
        """배치 처리기 중지"""
        self.running = False
        if self.background_task:
            self.background_task.cancel()
            try:
                await self.background_task
            except asyncio.CancelledError:
                pass
    
    async def add_image(self, image_id: str, image_data: Any, result: Any, callback: Optional[Callable] = None) -> bool:
        """
        이미지를 배치 큐에 추가
        
        Args:
            image_id: 이미지 고유 ID
            image_data: 이미지 데이터
            result: 결과 객체
            callback: 처리 완료 시 호출할 콜백 함수
            
        Returns:
            bool: 추가 성공 여부
        """
        async with self.processing_lock:
            # 큐가 가득 찬 경우 즉시 처리
            if len(self.batch_queue) >= self.max_batch_size:
                await self._process_current_batch()
            
            # 새 아이템 추가
            batch_item = BatchItem(
                id=image_id,
                image_data=image_data,
                result=result,
                timestamp=time.time(),
                callback=callback
            )
            self.batch_queue.append(batch_item)
            
            # 16개가 모이면 즉시 처리
            if len(self.batch_queue) >= self.max_batch_size:
                await self._process_current_batch()
            
            return True
    
    async def _background_processor(self):
        """백그라운드에서 시간 기반 배치 처리"""
        while self.running:
            try:
                await asyncio.sleep(0.5)  # 0.5초마다 체크 (더 빠른 응답)
                
                async with self.processing_lock:
                    if not self.batch_queue:
                        continue
                    
                    # 가장 오래된 아이템의 대기 시간 확인
                    oldest_item = self.batch_queue[0]
                    wait_time = time.time() - oldest_item.timestamp
                    
                    # 최대 대기 시간 초과 시 현재 배치 처리
                    if wait_time >= self.max_wait_time:
                        await self._process_current_batch()
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"배치 처리기 오류: {e}")
                await asyncio.sleep(1.0)
    
    async def _process_current_batch(self):
        """현재 큐에 있는 이미지들을 배치 처리"""
        if not self.batch_queue:
            return
        
        # 현재 배치 추출
        current_batch = self.batch_queue.copy()
        self.batch_queue.clear()
        
        print(f"배치 처리 시작: {len(current_batch)}개 이미지 (시간 기반 트리거)")
        
        try:
            # 1단계: URL 유효성 검증 (동시 처리)
            valid_items = []
            invalid_items = []
            
            async def validate_item(item: BatchItem):
                is_valid, validation_message = await is_valid_public_image_url(item.image_data.url)
                return item, is_valid, validation_message
            
            validation_tasks = [validate_item(item) for item in current_batch]
            validation_results = await asyncio.gather(*validation_tasks)
            
            for item, is_valid, validation_message in validation_results:
                if is_valid:
                    valid_items.append(item)
                else:
                    # URL 검증 실패 처리
                    item.result.error = True
                    item.result.error_type = "url_invalid"
                    item.result.error_message = f"URL 검증 실패: {validation_message}"
                    invalid_items.append(item)
            
            # 2단계: 유효한 이미지들을 Vision API로 배치 전송
            if valid_items:
                valid_urls = [item.image_data.url for item in valid_items]
                vision_results = await analyze_images_batch(valid_urls)
                
                # 결과 매핑
                for item, vision_result in zip(valid_items, vision_results):
                    if vision_result.get("error", False):
                        item.result.error = True
                        item.result.error_type = "api_error"
                        item.result.error_message = vision_result.get("message", "Vision API 오류")
                    else:
                        item.result.processed = True
                        item.result.harmful = vision_result.get("is_harmful", False)
                        item.result.category = vision_result.get("category")
                        item.result.score = vision_result.get("score")
                        item.result.details = vision_result.get("details")
                        item.result.status = True
            
            # 3단계: 콜백 호출 (결과 전달)
            all_items = valid_items + invalid_items
            for item in all_items:
                if item.callback:
                    try:
                        await item.callback(item.id, item.result)
                    except Exception as e:
                        print(f"콜백 오류 (ID: {item.id}): {e}")
            
            print(f"배치 처리 완료: {len(valid_items)}개 성공, {len(invalid_items)}개 실패")
            
        except Exception as e:
            print(f"배치 처리 중 오류: {e}")
            # 오류 발생 시 모든 아이템에 오류 설정
            for item in current_batch:
                item.result.error = True
                item.result.error_type = "system_error"
                item.result.error_message = f"배치 처리 오류: {str(e)}"
                if item.callback:
                    try:
                        await item.callback(item.id, item.result)
                    except Exception as callback_error:
                        print(f"콜백 오류 (ID: {item.id}): {callback_error}")


# 전역 배치 처리기 인스턴스
batch_processor = TimeBatchProcessor(max_batch_size=16, max_wait_time=1.5)
