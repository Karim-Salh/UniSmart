import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)
def get_db():
    with SessionLocal() as db:
        yield db
