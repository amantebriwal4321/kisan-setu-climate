"""Deterministic seed data — a real-shaped tomato price crash in Kolar, Karnataka.

Everything here is hand-built and deterministic so the demo runs offline and looks
identical every time. Numbers are modelled on real Kolar tomato-belt behaviour:
arrivals climb through the harvest peak while price collapses from ~₹18 to ~₹4 per kg.
"""
from datetime import date, timedelta
from math import sin

from app.db import SessionLocal
from app.models import District, Crop, PriceDaily, RiskScore, Unit, Buyer
from app.predictor import compute_risk_series

DAYS = 60


def _clamp(x, lo, hi):
    return max(lo, min(hi, x))


def gen_series(p_start, p_end, p_slide_start, p_slide_len,
               a_base, a_peak_extra, a_ramp_start, a_ramp_len):
    """Return list of (day_index, price, arrivals) for DAYS days."""
    rows = []
    for i in range(DAYS):
        slide = _clamp((i - p_slide_start) / p_slide_len, 0.0, 1.0)
        price = p_start - slide * (p_start - p_end) + 0.4 * sin(i * 0.7)
        price = max(price, p_end - 0.5)

        ramp = _clamp((i - a_ramp_start) / a_ramp_len, 0.0, 1.0)
        arrivals = a_base + ramp * a_peak_extra + 0.05 * a_base * sin(i * 0.9)
        arrivals = max(arrivals, 10.0)

        rows.append((i, round(price, 2), round(arrivals, 1)))
    return rows


# crop_slug -> (name, series params, "shape" so we can pick harvest months)
CROP_DEFS = {
    "tomato": {
        "name": "Tomato",
        "params": dict(p_start=18, p_end=4, p_slide_start=30, p_slide_len=28,
                       a_base=200, a_peak_extra=720, a_ramp_start=28, a_ramp_len=24),
    },
    "onion": {
        "name": "Onion",
        "params": dict(p_start=22, p_end=13, p_slide_start=30, p_slide_len=24,
                       a_base=150, a_peak_extra=240, a_ramp_start=32, a_ramp_len=20),
    },
    "beans": {
        "name": "Beans",
        "params": dict(p_start=40, p_end=36, p_slide_start=35, p_slide_len=20,
                       a_base=60, a_peak_extra=45, a_ramp_start=40, a_ramp_len=18),
    },
}

UNITS = [
    dict(slug="kolar-mahila-foods", name="Kolar Mahila SHG Foods", kind="SHG",
         lat=13.1367, lng=78.1292, crops=["tomato"], weekly_capacity=30,
         products=["paste", "puree"], contact="Kolar town"),
    dict(slug="srinivaspura-fpo", name="Srinivaspura Farmer Producer Co.", kind="FPO",
         lat=13.3410, lng=78.2140, crops=["tomato", "onion"], weekly_capacity=55,
         products=["paste", "flakes"], contact="Srinivaspura"),
    dict(slug="malur-womens-unit", name="Malur Women's Agro Unit", kind="SHG",
         lat=13.0040, lng=77.9370, crops=["tomato", "beans"], weekly_capacity=25,
         products=["puree", "dried"], contact="Malur"),
    dict(slug="chintamani-fpo", name="Chintamani Farmer Producer Co.", kind="FPO",
         lat=13.4020, lng=78.0530, crops=["tomato", "onion"], weekly_capacity=60,
         products=["paste", "ketchup"], contact="Chintamani"),
    dict(slug="bangarpet-shg", name="Bangarpet SHG Kitchen", kind="SHG",
         lat=12.9910, lng=78.1780, crops=["tomato"], weekly_capacity=20,
         products=["paste"], contact="Bangarpet"),
    dict(slug="mulbagal-cluster", name="Mulbagal Food Cluster", kind="FPO",
         lat=13.1650, lng=78.3930, crops=["tomato", "onion"], weekly_capacity=40,
         products=["flakes", "powder"], contact="Mulbagal"),
]

BUYERS = [
    dict(name="Bangalore Fresh Foods", city="Bengaluru", wants=["paste", "puree"], price_per_kg=42),
    dict(name="Chennai Retail Chain", city="Chennai", wants=["paste", "ketchup"], price_per_kg=48),
    dict(name="South Foods Processors", city="Hosur", wants=["flakes", "powder"], price_per_kg=55),
]


def run_seed():
    db = SessionLocal()
    try:
        if db.query(District).count() > 0:
            return  # already seeded

        today = date.today()

        kolar = District(slug="kolar", name="Kolar", state="Karnataka",
                         lat=13.1367, lng=78.1292)
        db.add(kolar)
        db.flush()

        for slug, cdef in CROP_DEFS.items():
            series = gen_series(**cdef["params"])
            # harvest months = the months present in the last 20 days (near the crash)
            last_dates = [today - timedelta(days=59 - i) for (i, _, _) in series[-20:]]
            harvest_months = sorted({d.month for d in last_dates})

            crop = Crop(slug=slug, name=cdef["name"], district_id=kolar.id,
                        unit="kg", harvest_months=harvest_months)
            db.add(crop)
            db.flush()

            rows_for_risk = []
            for (i, price, arrivals) in series:
                d = today - timedelta(days=59 - i)
                db.add(PriceDaily(crop_id=crop.id, date=d, price=price, arrivals=arrivals))
                rows_for_risk.append({"date": d, "price": price, "arrivals": arrivals})

            for r in compute_risk_series(rows_for_risk, harvest_months):
                db.add(RiskScore(
                    crop_id=crop.id, date=r["date"], score=r["score"],
                    arrivals_signal=r["arrivals_signal"],
                    price_signal=r["price_signal"], season_signal=r["season_signal"],
                ))

        for u in UNITS:
            db.add(Unit(district_id=kolar.id, **u))

        for b in BUYERS:
            db.add(Buyer(**b))

        db.commit()
    finally:
        db.close()
