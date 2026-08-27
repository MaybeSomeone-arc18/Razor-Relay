import logging
from typing import Dict, Any
import requests

logger = logging.getLogger("razor-relay.redis")

class RedisStateStore:
    """Wrapper for Upstash Redis via REST API, with an in-memory fallback."""
    def __init__(self, url: str, token: str):
        self.url = url.rstrip('/') if url else None
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}
        self._mock_db: Dict[str, Any] = {}
    
    def _call(self, *args):
        if not self.url or not self.url.startswith("http"):
            # Fallback to simple in-memory mock if URL is not configured
            return self._mock_call(*args)
            
        try:
            res = requests.post(self.url, headers=self.headers, json=list(args), timeout=5)
            res.raise_for_status()
            return res.json().get('result')
        except Exception as e:
            logger.error(f"Redis HTTP Request Error: {e}")
            return self._mock_call(*args) # Fallback on error
            
    def _mock_call(self, *args):
        cmd = args[0].upper()
        key = args[1] if len(args) > 1 else None
        
        if cmd == "SET":
            val = args[2]
            opts = args[3:]
            if "NX" in opts and key in self._mock_db:
                return None
            self._mock_db[key] = val
            return "OK"
        elif cmd == "GET":
            return self._mock_db.get(key)
        elif cmd == "INCRBYFLOAT":
            val = float(args[2])
            current = float(self._mock_db.get(key, 0.0))
            self._mock_db[key] = str(current + val)
            return self._mock_db[key]
        elif cmd == "RPUSH":
            val = args[2]
            if key not in self._mock_db:
                self._mock_db[key] = []
            self._mock_db[key].append(val)
            return len(self._mock_db[key])
        elif cmd == "LRANGE":
            start = int(args[2])
            end = int(args[3])
            if key not in self._mock_db:
                return []
            lst = self._mock_db[key]
            if end == -1:
                return lst[start:]
            else:
                return lst[start:end+1]
        elif cmd == "DEL":
            if key in self._mock_db:
                del self._mock_db[key]
                return 1
            return 0
        return None

    def setnx_ex(self, key: str, value: str, expire_seconds: int):
        """SETNX with sliding lock expiry."""
        res = self._call("SET", key, value, "NX", "EX", expire_seconds)
        return res == "OK"
        
    def get(self, key: str):
        return self._call("GET", key)
        
    def set(self, key: str, value: str):
        return self._call("SET", key, value)
        
    def incrbyfloat(self, key: str, value: float):
        res = self._call("INCRBYFLOAT", key, str(value))
        return float(res) if res else 0.0

    def delete(self, key: str):
        return self._call("DEL", key)
