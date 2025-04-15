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
    """Get a list of fires with optional filters by region, year, type, coordinates and limit."""
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

    return [Fire.model_validate(item) for item in query.limit(limit).all()]


@router.get("/paginated", response_model=dict)
async def get_paginated_fires(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=1000),
):
    """Get fires data with pagination.

    Returns paginated results with next and previous page links.
    """
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
    """Get statistics on the number of fires and total area burned by region."""
    result = (
        db.query(
            FireDB.region_name,
            func.count(FireDB.fire_id).label("count"),
            func.sum(FireDB.area_total).label("total_area"),
        )
        .group_by(FireDB.region_name)
        .all()
    )
    return [
        {"region_name": r[0], "count": r[1], "total_area": float(r[2] or 0)}
        for r in result
    ]


@router.get("/stats/years", response_model=List[dict])
async def get_year_stats(db: Session = Depends(get_db)):
    """Get statistics by year: total number of fires and area burned."""
    result = (
        db.query(
            FireDB.year,
            func.count(FireDB.fire_id).label("count"),
            func.sum(FireDB.area_total).label("total_area"),
        )
        .group_by(FireDB.year)
        .order_by(FireDB.year)
        .all()
    )
    return [
        {"year": r[0], "count": r[1], "total_area": float(r[2] or 0)} for r in result
    ]


@router.get("/stats/types", response_model=List[dict])
async def get_type_stats(db: Session = Depends(get_db)):
    """Get statistics grouped by fire type: number of fires and total area."""
    result = (
        db.query(
            FireDB.fire_type,
            func.count(FireDB.fire_id).label("count"),
            func.sum(FireDB.area_total).label("total_area"),
        )
        .group_by(FireDB.fire_type)
        .all()
    )
    return [
        {"fire_type": r[0], "count": r[1], "total_area": float(r[2] or 0)}
        for r in result
    ]


@router.get("/heatmap-points", response_model=List[dict])
async def get_heatmap_points(
    db: Session = Depends(get_db),
    year: Optional[int] = Query(None),
    limit: int = Query(10000, ge=100, le=50000),
):
    """Get coordinates and area of fires for heatmap visualization."""
    query = db.query(FireDB.latitude, FireDB.longitude, FireDB.area_total).filter(
        FireDB.latitude.isnot(None), FireDB.longitude.isnot(None)
    )

    if year:
        query = query.filter(FireDB.year == year)

    result = query.limit(limit).all()

    return [
        {
            "latitude": float(lat),
            "longitude": float(lon),
            "area_total": float(area or 0),
        }
        for lat, lon, area in result
    ]


@router.get("/nearby", response_model=List[dict])
async def get_nearby_fires(
    db: Session = Depends(get_db),
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(10, ge=1),
    limit: int = Query(100, ge=1, le=1000),
):
    """Find nearby fires within a given radius (in kilometers) from a point.

    Returns a list of fires with their distance from the specified point.
    """
    dlat = func.radians(FireDB.latitude - latitude)
    dlon = func.radians(FireDB.longitude - longitude)
    a = func.pow(func.sin(dlat / 2), 2) + func.cos(func.radians(latitude)) * func.cos(
        func.radians(FireDB.latitude)
    ) * func.pow(func.sin(dlon / 2), 2)
    c = 2 * func.atan2(func.sqrt(a), func.sqrt(1 - a))
    distance = c * 6371

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
    db: Session = Depends(get_db), format: str = Query("csv", pattern="^(csv|json)$")
):
    """Export fires data as CSV. JSON export is not implemented."""
    query = db.query(FireDB)

    if format == "csv":

        def generate_csv():
            buffer = StringIO()
            writer = csv.writer(buffer)

            writer.writerow([column.name for column in FireDB.__table__.columns])
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

            for row in query.yield_per(1000):
                writer.writerow(
                    [getattr(row, column.name) for column in FireDB.__table__.columns]
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


@router.get("/stats/region-year", response_model=List[dict])
async def get_region_year_stats(db: Session = Depends(get_db)):
    """Get statistics grouped by region and year: number of fires and total area burned."""
    result = (
        db.query(
            FireDB.region_name,
            FireDB.year,
            func.count(FireDB.fire_id).label("count"),
            func.sum(FireDB.area_total).label("total_area"),
        )
        .group_by(FireDB.region_name, FireDB.year)
        .order_by(FireDB.region_name, FireDB.year)
        .all()
    )

    return [
        {
            "region_name": r[0],
            "year": r[1],
            "count": r[2],
            "total_area": float(r[3] or 0),
        }
        for r in result
    ]


@router.get("/stats/month-year", response_model=List[dict])
async def get_month_year_stats(db: Session = Depends(get_db)):
    """Get statistics by month and year: number of fires and total area burned."""
    year_expr = func.extract("year", FireDB.date_beginning)
    month_expr = func.extract("month", FireDB.date_beginning)

    result = (
        db.query(
            year_expr.label("year"),
            month_expr.label("month"),
            func.count(FireDB.fire_id).label("count"),
            func.sum(FireDB.area_total).label("total_area"),
        )
        .filter(FireDB.date_beginning.isnot(None))
        .group_by(year_expr, month_expr)
        .order_by(year_expr, month_expr)
        .all()
    )

    return [
        {
            "year": int(r[0]),
            "month": int(r[1]),
            "count": r[2],
            "total_area": float(r[3] or 0),
        }
        for r in result
    ]


@router.get("/stats/average-area-per-fire", response_model=List[dict])
async def get_avg_area_per_fire(db: Session = Depends(get_db)):
    """Get the average fire area by region."""
    result = (
        db.query(FireDB.region_name, func.avg(FireDB.area_total).label("avg_area"))
        .group_by(FireDB.region_name)
        .order_by(func.avg(FireDB.area_total).desc())
        .all()
    )

    return [{"region_name": r[0], "avg_area": float(r[1] or 0)} for r in result]


@router.get("/stats/top-fires", response_model=List[dict])
async def get_top_fires(db: Session = Depends(get_db), limit: int = 10):
    """Get the top fires with the largest burned area."""
    result = (
        db.query(
            FireDB.fire_id,
            FireDB.region_name,
            FireDB.year,
            FireDB.area_total,
            FireDB.latitude,
            FireDB.longitude,
        )
        .order_by(FireDB.area_total.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "fire_id": r.fire_id,
            "region_name": r.region_name,
            "year": r.year,
            "area_total": float(r.area_total or 0),
            "latitude": float(r.latitude or 0),
            "longitude": float(r.longitude or 0),
        }
        for r in result
    ]


@router.get("/stats/fire-duration", response_model=List[dict])
async def get_avg_fire_duration(db: Session = Depends(get_db)):
    """Get average fire duration in days by region."""
    days_expr = FireDB.date_end - FireDB.date_beginning

    result = (
        db.query(
            FireDB.region_name,
            func.avg(days_expr).label("avg_duration"),
        )
        .filter(FireDB.date_beginning.isnot(None), FireDB.date_end.isnot(None))
        .group_by(FireDB.region_name)
        .order_by(func.avg(days_expr).desc())
        .all()
    )

    return [{"region_name": r[0], "avg_duration": round(r[1], 2)} for r in result]
