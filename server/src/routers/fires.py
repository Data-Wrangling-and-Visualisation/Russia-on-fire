import csv
from io import StringIO
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import FireDB
from ..schemas import Fire

router = APIRouter(prefix="/fires", tags=["fires"])


@router.get("/", response_model=List[Fire])
async def get_fires(
    db: Session = Depends(get_db),
    region_name: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    fire_type: Optional[str] = Query(None),
    min_latitude: Optional[float] = None,
    max_latitude: Optional[float] = None,
    min_longitude: Optional[float] = None,
    max_longitude: Optional[float] = None,
    limit: int = Query(100, ge=1, le=1000),
):
    query = db.query(FireDB)

    # Apply filters
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

    return [Fire.model_validate(item) for item in query.limit(limit).all()]


@router.get("/paginated", response_model=dict)
async def get_paginated_fires(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=1000),
):
    offset = (page - 1) * per_page
    query = db.query(FireDB)

    total = query.count()
    results = query.offset(offset).limit(per_page).all()

    total_pages = (total + per_page - 1) // per_page
    next_page = (
        f"{request.url.include_query_params(page=page + 1)}"
        if page < total_pages
        else None
    )
    prev_page = (
        f"{request.url.include_query_params(page=page - 1)}" if page > 1 else None
    )

    return {
        "data": [Fire.model_validate(item) for item in results],
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "next_page": next_page,
            "prev_page": prev_page,
        },
    }


@router.get("/stats/regions", response_model=List[dict])
async def get_region_stats(db: Session = Depends(get_db)):
    return (
        db.query(
            FireDB.region_name,
            func.count(FireDB.fire_id).label("count"),
            func.sum(FireDB.area_total).label("total_area"),
        )
        .group_by(FireDB.region_name)
        .all()
    )


@router.get("/nearby", response_model=List[dict])
async def get_nearby_fires(
    db: Session = Depends(get_db),
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(10, ge=1),
    limit: int = Query(100, ge=1, le=1000),
):
    # Haversine formula implementation
    dlat = func.radians(FireDB.latitude - latitude)
    dlon = func.radians(FireDB.longitude - longitude)
    a = func.pow(func.sin(dlat / 2), 2) + func.cos(func.radians(latitude)) * func.cos(
        func.radians(FireDB.latitude)
    ) * func.pow(func.sin(dlon / 2), 2)
    c = 2 * func.atan2(func.sqrt(a), func.sqrt(1 - a))
    distance = c * 6371  # Earth radius in km

    query = (
        db.query(FireDB, distance.label("distance_km"))
        .filter(distance <= radius_km)
        .order_by(distance)
        .limit(limit)
    )

    return [
        {**Fire.model_validate(item[0]).dict(), "distance_km": float(item[1])}
        for item in query.all()
    ]


@router.get("/export")
async def export_fires(
    db: Session = Depends(get_db), format: str = Query("csv", regex="^(csv|json)$")
):
    query = db.query(FireDB)

    if format == "csv":

        def generate_csv():
            buffer = StringIO()
            writer = csv.writer(buffer)

            # Write header
            writer.writerow([column.name for column in FireDB.__table__.columns])
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

            # Stream data
            for chunk in db.query(FireDB).yield_per(1000):
                for row in chunk:
                    writer.writerow(
                        [
                            getattr(row, column.name)
                            for column in FireDB.__table__.columns
                        ]
                    )
                    yield buffer.getvalue()
                    buffer.seek(0)
                    buffer.truncate(0)

        return StreamingResponse(
            generate_csv(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=fires_export.csv"},
        )
    else:
        raise HTTPException(status_code=400, detail="JSON export not implemented")
