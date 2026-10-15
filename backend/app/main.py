"""FastAPI entrypoint. Creates tables, seeds deterministic demo data, mounts /api/v1."""
from dotenv import load_dotenv

load_dotenv()  # read backend/.env (Twilio keys etc.) before anything else

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app import models  # noqa: F401  (register models on Base)
from app.api import router
from app.seed import run_seed

app = FastAPI(title="Kisan Setu API")

# Dev CORS (the frontend normally uses the same-origin proxy, but this is harmless).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    run_seed()


app.include_router(router, prefix="/api/v1", tags=["kisan"])


@app.get("/")
def root():
    return {"app": "Kisan Setu", "docs": "/docs", "api": "/api/v1"}
