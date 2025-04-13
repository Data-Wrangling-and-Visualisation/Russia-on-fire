from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import FireDB
from ..schemas import Fire

router = APIRouter(prefix="/fires", tags=["fires"])


@router.get("/", response_model=List[Fire])
async def get_fires(
    region_name: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    fire_type: Optional[str] = Query(None),
    min_latitude: Optional[float] = None,
    max_latitude: Optional[float] = None,
    min_longitude: Optional[float] = None,
    max_longitude: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(FireDB)

    if region_name:
        query = query.filter(FireDB.region_name.ilike(f"%{region_name}%"))
    if year:
        query = query.filter(FireDB.year == year)
    if fire_type:
        query = query.filter(FireDB.fire_type == fire_type)
    if min_latitude:
        query = query.filter(FireDB.latitude >= min_latitude)
    if max_latitude:
        query = query.filter(FireDB.latitude <= max_latitude)
    if min_longitude:
        query = query.filter(FireDB.longitude >= min_longitude)
    if max_longitude:
        query = query.filter(FireDB.longitude <= max_longitude)

    # Convert SQLAlchemy models to Pydantic models
    return [Fire.model_validate(item) for item in query.limit(100).all()]
