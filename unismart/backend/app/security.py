import os, datetime as dt
from jose import jwt, JWTError
from passlib.context import CryptContext
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET = os.environ["JWT_SECRET"]
hash_pw = _pwd.hash
verify_pw = _pwd.verify
def make_token(uid: int, role: str) -> str:
    return jwt.encode({"sub": str(uid), "role": role, "exp": dt.datetime.utcnow() + dt.timedelta(minutes=30)}, SECRET, "HS256")
def read_token(t: str) -> dict | None:
    try: return jwt.decode(t, SECRET, ["HS256"])
    except JWTError: return None

# ---- تحديد المعدل (في الذاكرة؛ في الإنتاج Redis/nginx limit_req). RATE_LIMIT=0 لتعطيله ----
import time
from collections import defaultdict, deque
_hits: dict[str, deque] = defaultdict(deque)
_fails: dict[str, list] = defaultdict(list)
RATE_ON = os.environ.get("RATE_LIMIT", "1") != "0"
def allow(key: str, limit: int, window: int = 60) -> bool:
    if not RATE_ON: return True
    q, now = _hits[key], time.time()
    while q and q[0] < now - window: q.popleft()
    if len(q) >= limit: return False
    q.append(now); return True
def locked(login: str, max_fail: int = 5, window: int = 300) -> bool:
    if not RATE_ON: return False
    now = time.time(); _fails[login] = [t for t in _fails[login] if t > now - window]; return len(_fails[login]) >= max_fail
def note_fail(login: str): _fails[login].append(time.time())
def clear_fail(login: str): _fails.pop(login, None)
