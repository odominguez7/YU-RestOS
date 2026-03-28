from fastapi import APIRouter
from .engine import detect_drift_real

router = APIRouter()


def _build_daily_data():
    """Build daily data array from real Oura data for drift detection."""
    from backend.oura.routes import (
        _sleep_by_day, _score_by_day, _readiness_by_day,
        _stress_by_day, _activity_by_day,
    )

    days = sorted(_sleep_by_day.keys())
    daily_data = []

    for day in days:
        s = _sleep_by_day[day]
        score = _score_by_day.get(day, 0)
        readiness = _readiness_by_day.get(day, {})
        stress = _stress_by_day.get(day, {})

        hrv = s.get("average_hrv")
        rhr = s.get("average_heart_rate")
        deep = s.get("deep_sleep_duration", 0)
        total = s.get("total_sleep_duration", 0)
        stress_high = stress.get("stress_high", 0) or 0

        if not score or not hrv:
            continue

        daily_data.append({
            "day": day,
            "sleepScore": score,
            "hrv": hrv,
            "avgHeartRate": round(rhr, 1) if rhr else None,
            "deepSleepMin": round(deep / 60),
            "totalSleepHours": round(total / 3600, 1),
            "readinessScore": readiness.get("score", 0),
            "stressMin": round(stress_high / 60),
            "efficiency": s.get("efficiency", 0),
        })

    return daily_data


@router.get("/analyze")
def analyze_drift():
    daily_data = _build_daily_data()
    return detect_drift_real(daily_data)


@router.get("/timeline")
def drift_timeline():
    daily_data = _build_daily_data()
    analysis = detect_drift_real(daily_data)
    return {
        "drift_detected": analysis["drift_detected"],
        "signals": analysis["signals"],
        "baseline": analysis["baseline"],
    }
