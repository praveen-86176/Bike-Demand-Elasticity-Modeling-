from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import train, predict, history
from backend.db.database import engine, Base

app = FastAPI(title="Bike Demand Elasticity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(train.router,   prefix="/train",   tags=["Training"])
app.include_router(predict.router, prefix="/predict", tags=["Prediction"])
app.include_router(history.router, prefix="/runs",    tags=["History"])

@app.get("/health")
async def health():
    return {"status": "ok"}