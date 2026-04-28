import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def migrate():
    engine = create_async_engine('postgresql+asyncpg://bikeuser:bike1234@localhost:5432/bikedb')
    async with engine.begin() as conn:
        print("Adding dataset_type column to training_runs...")
        await conn.execute(text("ALTER TABLE training_runs ADD COLUMN IF NOT EXISTS dataset_type VARCHAR DEFAULT 'hourly';"))
        print("Migration complete.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
