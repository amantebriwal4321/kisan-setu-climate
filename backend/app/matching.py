"""Matching engine — connect a surplus crop to nearby processing units.

Given a crop's surplus (in tonnes for the coming week), find units that can process
that crop, sort by distance, and greedily fill their weekly capacity. For each match
we compute the offer price to the farmer and the impact (rupees saved vs dumping,
kg rescued, units engaged).

Plain-Python haversine, no geo libraries — matches the dependency-light style.
"""
from math import radians, sin, cos, asin, sqrt

# Farmer offer floor: we lift the crashed price up to a fair floor.
OFFER_BONUS_PER_KG = 5.0   # ₹/kg above the crash price
MIN_OFFER = 9.0            # ₹/kg absolute floor


def haversine_km(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = map(radians, (lat1, lng1, lat2, lng2))
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return round(2 * 6371 * asin(sqrt(a)), 1)


def offer_price(crash_price):
    return round(max(MIN_OFFER, crash_price + OFFER_BONUS_PER_KG), 1)


def match(crop_slug, crop_lat, crop_lng, surplus_tonnes, crash_price, units, max_km=80):
    """units: list of dicts with keys name, kind, lat, lng, crops(list), weekly_capacity,
    products, slug, contact. Returns (matches, totals)."""
    offer = offer_price(crash_price)

    candidates = []
    for u in units:
        if crop_slug not in (u.get("crops") or []):
            continue
        dist = haversine_km(crop_lat, crop_lng, u["lat"], u["lng"])
        if dist > max_km:
            continue
        candidates.append((dist, u))
    candidates.sort(key=lambda t: t[0])

    matches = []
    remaining = surplus_tonnes
    for dist, u in candidates:
        if remaining <= 0:
            break
        take = min(u["weekly_capacity"], remaining)
        if take <= 0:
            continue
        remaining -= take
        kg = take * 1000
        rupees_saved = round((offer - crash_price) * kg)
        matches.append({
            "unit_slug": u["slug"],
            "unit_name": u["name"],
            "kind": u["kind"],
            "products": u.get("products") or [],
            "distance_km": dist,
            "allocated_tonnes": round(take, 1),
            "offer_price": offer,
            "rupees_saved": rupees_saved,
            "lat": u["lat"],
            "lng": u["lng"],
        })

    totals = {
        "surplus_tonnes": round(surplus_tonnes, 1),
        "tonnes_matched": round(surplus_tonnes - max(0, remaining), 1),
        "tonnes_unmatched": round(max(0, remaining), 1),
        "kg_rescued": round((surplus_tonnes - max(0, remaining)) * 1000),
        "rupees_saved": sum(m["rupees_saved"] for m in matches),
        "units_engaged": len(matches),
        "offer_price": offer,
        "crash_price": crash_price,
    }
    return matches, totals
