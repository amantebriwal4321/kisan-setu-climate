"""SQLAlchemy models. Entity + daily time-series pattern (like Tool + ToolSnapshot).

We store ABSOLUTE daily values (price, arrivals) so any velocity/crash signal can be
derived between any two rows.
"""
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey, JSON, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db import Base


class District(Base):
    __tablename__ = "districts"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)


class Crop(Base):
    __tablename__ = "crops"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    unit = Column(String, default="kg")          # price unit label, e.g. "kg"
    # harvest months (1-12) when a glut is expected
    harvest_months = Column(JSON, default=list)

    district = relationship("District")
    prices = relationship("PriceDaily", back_populates="crop", cascade="all, delete-orphan")
    risks = relationship("RiskScore", back_populates="crop", cascade="all, delete-orphan")


class PriceDaily(Base):
    __tablename__ = "price_daily"
    id = Column(Integer, primary_key=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    price = Column(Float, nullable=False)         # absolute price per unit (₹/kg)
    arrivals = Column(Float, nullable=False)      # tonnes arriving at market that day

    crop = relationship("Crop", back_populates="prices")
    __table_args__ = (UniqueConstraint("crop_id", "date", name="uq_price_crop_date"),)


class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    score = Column(Float, nullable=False)         # 0-100 crash risk
    arrivals_signal = Column(Float, default=0.0)  # 0-100 sub-signal
    price_signal = Column(Float, default=0.0)     # 0-100 sub-signal
    season_signal = Column(Float, default=0.0)    # 0-100 sub-signal

    crop = relationship("Crop", back_populates="risks")
    __table_args__ = (UniqueConstraint("crop_id", "date", name="uq_risk_crop_date"),)


class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    kind = Column(String, default="SHG")          # SHG | FPO
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    crops = Column(JSON, default=list)            # list of crop slugs it can process
    weekly_capacity = Column(Float, default=0.0)  # tonnes/week
    products = Column(JSON, default=list)         # e.g. ["paste", "flakes"]
    contact = Column(String, default="")

    district = relationship("District")


class Buyer(Base):
    __tablename__ = "buyers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    wants = Column(JSON, default=list)            # product types
    price_per_kg = Column(Float, default=0.0)     # what they pay for the processed product


class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    role = Column(String, default="farmer")       # farmer | unit | officer
    rating = Column(Integer, nullable=False)      # 1-5
    note = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
