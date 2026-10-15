"""تشفير بصمات الوجه (بيانات بيومترية) أثناء التخزين. المفتاح من متغير بيئة FACE_KEY (Fernet) ولا يُخزَّن في الكود."""
import json, os
from cryptography.fernet import Fernet
_f = Fernet(os.environ["FACE_KEY"].encode())
enc = lambda obj: _f.encrypt(json.dumps(obj).encode()).decode()
dec = lambda tok: json.loads(_f.decrypt(tok.encode())) if tok else None
