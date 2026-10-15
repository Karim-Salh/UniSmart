import os, sys, tempfile
from cryptography.fernet import Fernet
os.environ.update(JWT_SECRET="test-secret", FACE_KEY=Fernet.generate_key().decode(), RATE_LIMIT="0",
                  DATABASE_URL="sqlite:///" + os.path.join(tempfile.mkdtemp(), "t.db"), CORS_ORIGINS="http://localhost")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import pytest
from fastapi.testclient import TestClient

@pytest.fixture(scope="session")
def client():
    from app.db import engine
    from app.models import Base
    import runpy; runpy.run_module("app.seed", run_name="seed")      # نفس بيانات التشغيل الفعلية
    from app.main import app
    return TestClient(app)

def login(client, user, pw="1234"):
    r = client.post("/api/auth/login", data={"username": user, "password": pw}); assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["access_token"]}
@pytest.fixture(scope="session")
def stu(client): return login(client, "20240001")
@pytest.fixture(scope="session")
def stu2(client): return login(client, "20240002")
@pytest.fixture(scope="session")
def admin(client): return login(client, "admin")
@pytest.fixture(scope="session")
def doc(client): return login(client, "dr.ahmed")
