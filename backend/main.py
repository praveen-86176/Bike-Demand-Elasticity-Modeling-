from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import train, predict, history, auth

app = FastAPI(title="ElasticityAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
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