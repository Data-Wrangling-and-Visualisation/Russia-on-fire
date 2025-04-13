from datetime import date
from typing import Optional

from pydantic import BaseModel


class FireBase(BaseModel):
    region_name: str
    year: int
    fire_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    landmark_distance: Optional[float] = None
    date_beginning: Optional[date] = None
    area_beginning: Optional[int] = None
    date_end: Optional[date] = None
    current_state: Optional[str] = None
    area_total: Optional[int] = None
    area_forest: Optional[int] = None
    area_fund_total: Optional[int] = None
    area_fund_forest: Optional[int] = None


class Fire(FireBase):
    fire_id: int

    class Config:
        from_attributes = True
