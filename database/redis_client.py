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
        import time
        cmd = args[0].upper()
        key = args[1] if len(args) > 1 else None
        
        # Helper to clean up expired keys
        def _cleanup():
            now = time.time()
            keys_to_delete = [k for k, v in self._mock_db.items() if isinstance(v, tuple) and v[1] is not None and v[1] < now]
            for k in keys_to_delete:
                del self._mock_db[k]
                
        _cleanup()
        
        if cmd == "SET":
            val = args[2]
            opts = [str(o).upper() for o in args[3:]]
            if "NX" in opts and key in self._mock_db:
                return None
            
            expiry_ts = None
            if "EX" in opts:
                idx = opts.index("EX")
                if idx + 1 < len(opts):
                    expiry_ts = time.time() + float(args[3 + idx + 1])
                    
            self._mock_db[key] = (val, expiry_ts)
            return "OK"
        elif cmd == "GET":
            entry = self._mock_db.get(key)
            if isinstance(entry, tuple):
                return entry[0]
            return entry
        elif cmd == "INCRBYFLOAT":
            val = float(args[2])
            entry = self._mock_db.get(key)
            current = float(entry[0]) if isinstance(entry, tuple) else float(entry or 0.0)
            self._mock_db[key] = (str(current + val), entry[1] if isinstance(entry, tuple) else None)
            return self._mock_db[key][0]
        elif cmd == "RPUSH":
            val = args[2]
            if key not in self._mock_db:
                self._mock_db[key] = ([], None)
            elif not isinstance(self._mock_db[key], tuple):
                self._mock_db[key] = (self._mock_db[key], None)
            self._mock_db[key][0].append(val)
            return len(self._mock_db[key][0])
        elif cmd == "LRANGE":
            start = int(args[2])
            end = int(args[3])
            if key not in self._mock_db:
                return []
            entry = self._mock_db[key]
            lst = entry[0] if isinstance(entry, tuple) else entry
            if end == -1:
                return lst[start:]
            else:
                return lst[start:end+1]
        elif cmd == "DEL":
            if key in self._mock_db:
                del self._mock_db[key]
                return 1
            return 0
        elif cmd == "EXPIRE":
            seconds = int(args[2])
            entry = self._mock_db.get(key)
            if entry is not None:
                if isinstance(entry, tuple):
                    self._mock_db[key] = (entry[0], time.time() + seconds)
                else:
                    self._mock_db[key] = (entry, time.time() + seconds)
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

    def expire(self, key: str, seconds: int):
        res = self._call("EXPIRE", key, str(seconds))
        return res == 1
