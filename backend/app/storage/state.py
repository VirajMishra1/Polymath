import json
from typing import Dict, Any, Optional
from app.config import get_settings
import redis

settings = get_settings()

class Storage:
    def __init__(self):
        self.use_redis = False
        try:
            self.redis = redis.from_url(settings.REDIS_URL)
            self.redis.ping()
            self.use_redis = True
        except Exception as e:
            print(f"Redis not available, using in-memory storage: {str(e)}")
            self.memory: Dict[str, str] = {}

    def set(self, key: str, value: Any, expire: int = 3600):
        val_str = json.dumps(value)
        if self.use_redis:
            self.redis.setex(key, expire, val_str)
        else:
            self.memory[key] = val_str

    def get(self, key: str) -> Optional[Any]:
        if self.use_redis:
            val = self.redis.get(key)
            return json.loads(val) if val else None
        else:
            val = self.memory.get(key)
            return json.loads(val) if val else None

# Singleton instance
storage = Storage()
