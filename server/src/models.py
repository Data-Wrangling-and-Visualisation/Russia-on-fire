from sqlalchemy import CheckConstraint, Column, Date, Index, Integer, Numeric, String

from .database import Base


class FireDB(Base):
    __tablename__ = "fires"

    fire_id = Column(Integer, primary_key=True, index=True)
    region_name = Column(String, nullable=False)
    year = Column(Integer)
    fire_type = Column(String, CheckConstraint("fire_type IN ('Лесные', 'Нелесные')"))
    latitude = Column(Numeric(9, 6))
    longitude = Column(Numeric(9, 6))
    landmark_distance = Column(Numeric(7, 2))
    date_beginning = Column(Date)
    area_beginning = Column(Integer)
    date_end = Column(Date)
    current_state = Column(String)
    area_total = Column(Integer)
    area_forest = Column(Integer)
    area_fund_total = Column(Integer)
    area_fund_forest = Column(Integer)

    __table_args__ = (
        Index("idx_fires_region", "region_name"),
        Index("idx_fires_year", "year"),
        Index("idx_fires_coords", "latitude", "longitude"),
        {"schema": "public"},
    )
