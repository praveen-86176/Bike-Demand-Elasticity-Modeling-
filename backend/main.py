from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import train, predict, history, auth
from backend.db.database import engine, Base

app = FastAPI(title="ElasticityAI API", version="1.0.0")

# Create tables on startup (Essential for fresh deployments like Render)
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/api/auth",    tags=["Auth"])
app.include_router(train.router,   prefix="/api/train",   tags=["Training"])
app.include_router(predict.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(history.router, prefix="/api/runs",    tags=["History"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}