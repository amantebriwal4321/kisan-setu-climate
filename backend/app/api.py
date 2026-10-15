"""API endpoints. Plain-dict responses (StackRadar style), DB via Depends(get_db)."""
from statistics import mean

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import District, Crop, PriceDaily, RiskScore, Unit, Buyer, Feedback
from app.predictor import risk_label
from app import matching
from app import notify

router = APIRouter()

ARRIVALS_BASELINE_DAYS = 14


# ---------- helpers ----------

def _crop_series(db, crop):
    prices = (db.query(PriceDaily)
              .filter(PriceDaily.crop_id == crop.id)
              .order_by(PriceDaily.date).all())
    risks = {r.date: r for r in db.query(RiskScore).filter(RiskScore.crop_id == crop.id).all()}
    series = []
    for p in prices:
        r = risks.get(p.date)
        series.append({
            "date": p.date.isoformat(),
            "price": p.price,
            "arrivals": p.arrivals,
            "risk": r.score if r else 0.0,
        })
    return prices, series


def _surplus_tonnes(prices):
    """A day's routable excess = latest arrivals minus the early-window baseline."""
    if not prices:
        return 0.0
    base_window = [p.arrivals for p in prices[:ARRIVALS_BASELINE_DAYS]]
    base = mean(base_window) if base_window else prices[-1].arrivals
    latest = prices[-1].arrivals
    return round(max(0.0, latest - base), 1)


def _units_as_dicts(db, district_id=None):
    q = db.query(Unit)
    if district_id:
        q = q.filter(Unit.district_id == district_id)
    out = []
    for u in q.all():
        out.append({
            "slug": u.slug, "name": u.name, "kind": u.kind,
            "lat": u.lat, "lng": u.lng, "crops": u.crops or [],
            "weekly_capacity": u.weekly_capacity, "products": u.products or [],
            "contact": u.contact,
        })
    return out


def _crop_summary(db, crop):
    prices, _ = _crop_series(db, crop)
    latest = prices[-1] if prices else None
    latest_risk = (db.query(RiskScore).filter(RiskScore.crop_id == crop.id)
                   .order_by(RiskScore.date.desc()).first())
    score = latest_risk.score if latest_risk else 0.0
    return {
        "slug": crop.slug,
        "name": crop.name,
        "district": crop.district.name,
        "state": crop.district.state,
        "unit": crop.unit,
        "latest_price": latest.price if latest else None,
        "latest_arrivals": latest.arrivals if latest else None,
        "risk": score,
        "label": risk_label(score),
        "surplus_tonnes": _surplus_tonnes(prices),
    }


def _matches_for(db, crop):
    prices, _ = _crop_series(db, crop)
    if not prices:
        return [], {}
    surplus = _surplus_tonnes(prices)
    crash_price = prices[-1].price
    units = _units_as_dicts(db, crop.district_id)
    return matching.match(crop.slug, crop.district.lat, crop.district.lng,
                          surplus, crash_price, units)


# ---------- endpoints ----------

@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    crops = db.query(Crop).all()
    summaries = [_crop_summary(db, c) for c in crops]
    at_risk = [s for s in summaries if s["risk"] >= 40]

    kg_at_risk = 0
    rupees_saved = 0
    for c in crops:
        s = next(x for x in summaries if x["slug"] == c.slug)
        if s["risk"] < 40:
            continue
        _, totals = _matches_for(db, c)
        kg_at_risk += int(s["surplus_tonnes"] * 1000)
        rupees_saved += totals.get("rupees_saved", 0)

    return {
        "district": "Kolar, Karnataka",
        "crops_tracked": len(crops),
        "crops_at_risk": len(at_risk),
        "kg_at_risk": kg_at_risk,
        "potential_rupees_saved": rupees_saved,
        "units_available": db.query(Unit).count(),
        "buyers": db.query(Buyer).count(),
    }


@router.get("/crops")
def list_crops(db: Session = Depends(get_db)):
    crops = db.query(Crop).all()
    summaries = [_crop_summary(db, c) for c in crops]
    summaries.sort(key=lambda s: s["risk"], reverse=True)
    return {"crops": summaries}


@router.get("/units")
def list_units(db: Session = Depends(get_db)):
    return {"units": _units_as_dicts(db)}


@router.get("/crops/{slug}")
def crop_detail(slug: str, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.slug == slug).first()
    if not crop:
        raise HTTPException(status_code=404, detail="crop not found")
    prices, series = _crop_series(db, crop)
    latest_risk = (db.query(RiskScore).filter(RiskScore.crop_id == crop.id)
                   .order_by(RiskScore.date.desc()).first())
    signals = {
        "arrivals": latest_risk.arrivals_signal if latest_risk else 0.0,
        "price": latest_risk.price_signal if latest_risk else 0.0,
        "season": latest_risk.season_signal if latest_risk else 0.0,
    }
    summary = _crop_summary(db, crop)
    summary.update({
        "series": series,
        "signals": signals,
        "district_lat": crop.district.lat,
        "district_lng": crop.district.lng,
    })
    return summary


@router.get("/crops/{slug}/matches")
def crop_matches(slug: str, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.slug == slug).first()
    if not crop:
        raise HTTPException(status_code=404, detail="crop not found")
    matches, totals = _matches_for(db, crop)
    return {"matches": matches, "totals": totals}


def _alert_text(db, crop):
    matches, totals = _matches_for(db, crop)
    best = matches[0] if matches else None
    offer = totals.get("offer_price", 0)
    if best:
        d = best["distance_km"]
        near_en = "in your area" if d < 1 else f"{round(d)} km away"
        near_hi = "आपके पास" if d < 1 else f"{round(d)} किमी दूर"
        en = (f"{crop.name} prices are crashing (now Rs{totals['crash_price']}/kg). "
              f"Do not dump your crop. {best['unit_name']}, {near_en}, "
              f"will buy it at Rs{offer}/kg. Press 1 to book.")
        hi = (f"{crop.name} ke daam gir rahe hain. Fasal mat phenkiye. {best['unit_name']}, "
              f"{near_hi}, Rs{offer} kilo mein kharidega. Book karne ke liye 1 dabaiye.")
        hi_text = (f"{crop.name} के दाम गिर रहे हैं (अभी Rs{totals['crash_price']}/किलो)। "
                   f"फसल मत फेंकिए। {best['unit_name']}, {near_hi}, "
                   f"Rs{offer}/किलो में खरीदेगा। बुक करने के लिए 1 दबाएँ।")
    else:
        en = f"Alert: {crop.name} prices are crashing. No processing unit is free nearby yet."
        hi = f"{crop.name} ke daam gir rahe hain. Abhi paas mein koi unit khaali nahi hai."
        hi_text = f"सूचना: {crop.name} के दाम गिर रहे हैं। अभी पास में कोई यूनिट खाली नहीं है।"
    # `hi` is romanised for the voice engine (clearer TTS); `hi_text` is Devanagari for display.
    return en, hi, hi_text


@router.get("/crops/{slug}/alert")
def crop_alert(slug: str, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.slug == slug).first()
    if not crop:
        raise HTTPException(status_code=404, detail="crop not found")
    en, _hi_voice, hi_text = _alert_text(db, crop)
    return {"crop": crop.name, "channel": "SMS + voice (simulated)",
            "english": en, "hindi": hi_text}


@router.get("/notify/status")
def notify_status():
    return {"live": notify.is_live()}


@router.post("/notify")
async def notify_send(payload: dict, db: Session = Depends(get_db)):
    slug = payload.get("crop_slug", "")
    numbers = payload.get("numbers", [])
    channel = payload.get("channel", "call")
    if channel not in ("call", "sms", "whatsapp"):
        raise HTTPException(status_code=400, detail="channel must be call|sms|whatsapp")
    if not isinstance(numbers, list) or not numbers:
        raise HTTPException(status_code=400, detail="numbers must be a non-empty list")
    crop = db.query(Crop).filter(Crop.slug == slug).first()
    if not crop:
        raise HTTPException(status_code=404, detail="crop not found")

    en, hi_voice, _hi_text = _alert_text(db, crop)
    results = []
    for raw in numbers[:20]:  # cap per request
        if not str(raw).strip():
            continue
        results.append(await notify.send(str(raw), channel, en, hi_voice))
    return {"live": notify.is_live(), "channel": channel, "results": results}


@router.post("/feedback")
def add_feedback(payload: dict, db: Session = Depends(get_db)):
    rating = int(payload.get("rating", 0))
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="rating must be 1-5")
    crop = None
    if payload.get("crop_slug"):
        crop = db.query(Crop).filter(Crop.slug == payload["crop_slug"]).first()
    fb = Feedback(
        crop_id=crop.id if crop else None,
        role=payload.get("role", "farmer"),
        rating=rating,
        note=payload.get("note", ""),
    )
    db.add(fb)
    db.commit()
    return _trust(db)


@router.get("/trust")
def trust(db: Session = Depends(get_db)):
    return _trust(db)


def _trust(db):
    ratings = [f.rating for f in db.query(Feedback).all()]
    if not ratings:
        return {"trust_score": None, "count": 0, "avg_rating": None}
    return {
        "trust_score": round(mean(ratings) / 5 * 100),
        "count": len(ratings),
        "avg_rating": round(mean(ratings), 1),
    }
