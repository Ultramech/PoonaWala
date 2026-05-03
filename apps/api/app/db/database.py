import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Fallback to sqlite for dev if Postgres URL is not provided
# but the plan demands Postgres, so we use async psycopg by default.
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite+aiosqlite:///./goldeye.db" if not os.getenv("POSTGRES_DB") else "postgresql+psycopg://goldeye:goldeye_dev@localhost:5432/goldeye"
)

# SQLite async driver needs different connection args than Postgres
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
