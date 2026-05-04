"""
migrate_db.py — Idempotent schema migrations for the training_runs table.

Run once after deploying the updated backend:
    python3 migrate_db.py

All statements use IF NOT EXISTS — safe to re-run any number of times.

Column history
--------------
v1: metrics_status, top3_drivers
v2: elasticity, elapsed_seconds, split_method
v3: shap_importance, cv_scores, best_params, comparison_results, tuned
"""

import asyncio
import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


MIGRATIONS = [
    # v1
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS metrics_status   JSONB;",
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS top3_drivers     JSONB;",
    # v2
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS elasticity       JSONB;",
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS elapsed_seconds  FLOAT;",
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS split_method     TEXT DEFAULT 'chronological';",
    # v3 — stretch goals
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS shap_importance    JSONB;",
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS cv_scores          JSONB;",
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS best_params        JSONB;",
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS comparison_results JSONB;",
    "ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS tuned              TEXT DEFAULT 'false';",
]


async def migrate():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        for sql in MIGRATIONS:
            await conn.execute(text(sql))
            print(f"  ✓ {sql.strip()}")
    await engine.dispose()
    print("\n✅ All migrations applied successfully.")


if __name__ == "__main__":
    asyncio.run(migrate())
