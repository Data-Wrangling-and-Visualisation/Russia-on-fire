from fastapi import FastAPI

from .database import Base, engine
from .routers import fires

app = FastAPI()


app.include_router(fires.router)


@app.on_event("startup")
async def startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created")
    except Exception as e:
        print(f"Database connection error: {e}")
        raise


@app.get("/")
async def root():
    return {"message": "Wildfire Tracking API"}
