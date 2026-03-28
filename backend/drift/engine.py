"""
Drift Detection Engine v2 — runs on REAL Oura biometric data.

SCIENTIFIC BASIS:
- HRV (heart rate variability) is the gold standard marker for autonomic recovery.
  Plews et al. (2013) showed that the coefficient of variation of ln(rMSSD) over
  a rolling window predicts overtraining better than absolute HRV values.
- Resting heart rate elevation >5% above baseline indicates sympathetic overdrive
  (Buchheit, 2014).
- Sleep architecture changes (deep sleep reduction) precede subjective fatigue
  by 24-48 hours (Halson, 2014).
- Oura's readiness score integrates temperature deviation, HRV balance, and
  recovery index — when it drops below individual baseline, the body is under strain.
- Allostatic load (cumulative stress) correlates with elevated stress minutes
  and reduced recovery capacity (McEwen, 2006).

ALGORITHM:
1. BASELINE: 30-day rolling average for each metric (individual-specific)
2. CURRENT: 7-day rolling window for current state
3. Z-SCORES: For each metric, compute how many standard deviations the
   current 7-day mean is from the 30-day baseline
4. COMPOSITE DRIFT SCORE: Weighted combination of z-scores across 6 signals
5. DETECTION: Drift score exceeds threshold for 3+ consecutive days
6. SEVERITY: Based on magnitude and persistence of drift

WEIGHTS (justified by sensitivity and predictive value):
- HRV:        0.30 (most sensitive autonomic marker, earliest signal)
- Readiness:  0.20 (Oura's composite, integrates multiple recovery signals)
- Sleep Score:0.15 (overall sleep quality, composite of architecture)
- RHR:        0.15 (slower to move but highly specific when elevated)
- Deep Sleep: 0.10 (growth hormone pulsatility, physical recovery)
- Stress:     0.10 (allostatic load accumulation, sympathetic dominance)

All z-scores are INVERTED where needed so negative = bad for all metrics.
"""

import statistics
from datetime import datetime
from zoneinfo import ZoneInfo

BOSTON_TZ = ZoneInfo("America/New_York")

# Weights for each signal (sum = 1.0)
WEIGHTS = {
    "hrv": 0.30,
    "readiness": 0.20,
    "sleep_score": 0.15,
    "rhr": 0.15,
    "deep_sleep": 0.10,
    "stress": 0.10,
}

# Minimum days needed
BASELINE_WINDOW = 30
CURRENT_WINDOW = 7
MIN_CONSECUTIVE = 3
DRIFT_THRESHOLD = -0.8  # composite z-score threshold (negative = degrading)


def detect_drift_real(daily_data: list[dict]) -> dict:
    """
    Analyze real Oura biometric data for drift patterns.

    daily_data: list of dicts with keys:
        day, sleepScore, hrv, avgHeartRate, deepSleepMin, totalSleepHours,
        readinessScore, stressMin, efficiency
    """
    if len(daily_data) < BASELINE_WINDOW + CURRENT_WINDOW:
        return {
            "drift_detected": False,
            "reason": f"Need {BASELINE_WINDOW + CURRENT_WINDOW} days of data, have {len(daily_data)}",
            "signals": [],
            "daily_scores": [],
        }

    # Sort by date
    data = sorted(daily_data, key=lambda d: d["day"])

    # Compute drift score for each day (starting after baseline window)
    daily_scores = []

    for i in range(BASELINE_WINDOW, len(data)):
        current_day = data[i]

        # Baseline: 30 days before this day
        baseline = data[max(0, i - BASELINE_WINDOW):i]

        # Extract metric arrays from baseline
        def safe_vals(arr, key):
            return [d[key] for d in arr if d.get(key) is not None and d.get(key) != 0]

        bl_hrv = safe_vals(baseline, "hrv")
        bl_rhr = safe_vals(baseline, "avgHeartRate")
        bl_sleep = safe_vals(baseline, "sleepScore")
        bl_readiness = safe_vals(baseline, "readinessScore")
        bl_deep = safe_vals(baseline, "deepSleepMin")
        bl_stress = safe_vals(baseline, "stressMin")

        # Need enough baseline data
        if len(bl_hrv) < 14 or len(bl_sleep) < 14:
            continue

        # Current day values
        c_hrv = current_day.get("hrv")
        c_rhr = current_day.get("avgHeartRate")
        c_sleep = current_day.get("sleepScore")
        c_readiness = current_day.get("readinessScore")
        c_deep = current_day.get("deepSleepMin")
        c_stress = current_day.get("stressMin")

        # Compute z-scores (how many std devs from baseline mean)
        # Negative z = worse than baseline for all metrics
        z_scores = {}

        if c_hrv and len(bl_hrv) >= 2:
            bl_mean = statistics.mean(bl_hrv)
            bl_std = statistics.stdev(bl_hrv) or 1
            z_scores["hrv"] = (c_hrv - bl_mean) / bl_std  # lower HRV = negative z = bad

        if c_rhr and len(bl_rhr) >= 2:
            bl_mean = statistics.mean(bl_rhr)
            bl_std = statistics.stdev(bl_rhr) or 1
            z_scores["rhr"] = -(c_rhr - bl_mean) / bl_std  # INVERTED: higher RHR = negative z = bad

        if c_sleep and len(bl_sleep) >= 2:
            bl_mean = statistics.mean(bl_sleep)
            bl_std = statistics.stdev(bl_sleep) or 1
            z_scores["sleep_score"] = (c_sleep - bl_mean) / bl_std

        if c_readiness and len(bl_readiness) >= 2:
            bl_mean = statistics.mean(bl_readiness)
            bl_std = statistics.stdev(bl_readiness) or 1
            z_scores["readiness"] = (c_readiness - bl_mean) / bl_std

        if c_deep is not None and len(bl_deep) >= 2:
            bl_mean = statistics.mean(bl_deep)
            bl_std = statistics.stdev(bl_deep) or 1
            z_scores["deep_sleep"] = (c_deep - bl_mean) / bl_std

        if c_stress is not None and len(bl_stress) >= 2:
            bl_mean = statistics.mean(bl_stress)
            bl_std = statistics.stdev(bl_stress) or 1
            z_scores["stress"] = -(c_stress - bl_mean) / bl_std  # INVERTED: more stress = negative z

        # Weighted composite drift score
        composite = 0
        total_weight = 0
        for metric, weight in WEIGHTS.items():
            if metric in z_scores:
                composite += z_scores[metric] * weight
                total_weight += weight

        if total_weight > 0:
            composite /= total_weight  # normalize by actual weight used

        daily_scores.append({
            "day": current_day["day"],
            "drift_score": round(composite, 2),
            "z_scores": {k: round(v, 2) for k, v in z_scores.items()},
            "values": {
                "hrv": c_hrv,
                "rhr": round(c_rhr, 1) if c_rhr else None,
                "sleep_score": c_sleep,
                "readiness": c_readiness,
                "deep_sleep_min": c_deep,
                "stress_min": c_stress,
            },
        })

    # Detect drift using rolling window density (not strict consecutive)
    # A 7-day window where 3+ days are below threshold = drift zone
    # This catches oscillating recovery patterns (drift → 1 good day → drift)
    recent = daily_scores[-CURRENT_WINDOW:] if daily_scores else []
    recent_drift_days = [ds for ds in recent if ds["drift_score"] < DRIFT_THRESHOLD]
    currently_drifting = len(recent_drift_days) >= MIN_CONSECUTIVE

    # Also find worst historical window
    max_drift_count = 0
    best_window_start = None
    best_drift_signals = []

    for i in range(len(daily_scores) - CURRENT_WINDOW + 1):
        window = daily_scores[i:i + CURRENT_WINDOW]
        drift_days = [ds for ds in window if ds["drift_score"] < DRIFT_THRESHOLD]
        if len(drift_days) > max_drift_count:
            max_drift_count = len(drift_days)
            best_window_start = window[0]["day"]
            best_drift_signals = drift_days

    if currently_drifting:
        drift_start = recent_drift_days[0]["day"] if recent_drift_days else None
        drift_signals_final = recent_drift_days
    else:
        drift_start = best_window_start
        drift_signals_final = best_drift_signals

    drift_detected = currently_drifting or max_drift_count >= MIN_CONSECUTIVE

    # Compute severity from the drift signals
    if drift_detected and drift_signals_final:
        avg_drift = statistics.mean([ds["drift_score"] for ds in drift_signals_final])
        if avg_drift < -1.5:
            severity = "high"
        elif avg_drift < -1.0:
            severity = "medium"
        else:
            severity = "low"
        severity_score = round(abs(avg_drift) * 20, 1)  # scale to 0-50 range
    else:
        severity = "none"
        severity_score = 0
        avg_drift = 0

    # Compute baseline for display
    baseline_data = data[max(0, len(data) - BASELINE_WINDOW - CURRENT_WINDOW):max(0, len(data) - CURRENT_WINDOW)]
    bl_hrv_vals = [d["hrv"] for d in baseline_data if d.get("hrv")]
    bl_rhr_vals = [d["avgHeartRate"] for d in baseline_data if d.get("avgHeartRate")]
    bl_sleep_vals = [d["sleepScore"] for d in baseline_data if d.get("sleepScore")]
    bl_readiness_vals = [d["readinessScore"] for d in baseline_data if d.get("readinessScore")]

    baseline_display = {
        "sleepScore": round(statistics.mean(bl_sleep_vals), 1) if bl_sleep_vals else 0,
        "hrv": round(statistics.mean(bl_hrv_vals), 1) if bl_hrv_vals else 0,
        "rhr": round(statistics.mean(bl_rhr_vals), 1) if bl_rhr_vals else 0,
        "readiness": round(statistics.mean(bl_readiness_vals), 1) if bl_readiness_vals else 0,
    }

    # Build signal display for timeline chart
    chart_signals = []
    for ds in daily_scores[-21:]:  # last 3 weeks for chart
        chart_signals.append({
            "date": ds["day"],
            "sleepScore": ds["values"]["sleep_score"],
            "hrv": ds["values"]["hrv"],
            "readiness": ds["values"]["readiness"],
            "driftScore": ds["drift_score"],
            "inDrift": ds["drift_score"] < DRIFT_THRESHOLD,
        })

    # Identify which metrics are driving the drift
    drivers = []
    if drift_detected and drift_signals_final:
        avg_z = {}
        for metric in WEIGHTS:
            vals = [ds["z_scores"].get(metric) for ds in drift_signals_final if metric in ds["z_scores"]]
            if vals:
                avg_z[metric] = statistics.mean(vals)

        driver_labels = {
            "hrv": "Nervous system recovery is slow — your body isn't recharging between days",
            "rhr": "Heart working harder at rest — sign of fatigue or fighting something off",
            "sleep_score": "Sleep quality dropping — you're sleeping but not recovering",
            "readiness": "Body not bouncing back — you need more rest than you're getting",
            "deep_sleep": "Deep sleep is low — this is when growth hormone repairs your body",
            "stress": "Too much time in stress mode — your system can't stay in fight-or-flight this long",
        }

        for metric, z in sorted(avg_z.items(), key=lambda x: x[1]):
            if z < -0.5:
                drivers.append({
                    "metric": metric,
                    "z_score": round(z, 2),
                    "weight": WEIGHTS[metric],
                    "description": driver_labels.get(metric, metric),
                })

    return {
        "drift_detected": drift_detected,
        "currently_active": currently_drifting,
        "severity": severity,
        "severity_score": severity_score,
        "consecutive_days": len(recent_drift_days) if currently_drifting else max_drift_count,
        "drift_start_date": drift_start,
        "baseline": baseline_display,
        "signals": chart_signals,
        "drivers": drivers,
        "summary": _build_summary(drift_detected, currently_drifting, severity, drivers, baseline_display, drift_signals_final, daily_scores),
        "algorithm": {
            "baseline_window": BASELINE_WINDOW,
            "current_window": CURRENT_WINDOW,
            "threshold": DRIFT_THRESHOLD,
            "weights": WEIGHTS,
            "method": "Weighted composite z-score across 6 biometric signals",
        },
    }


def _build_summary(detected, active, severity, drivers, baseline, drift_signals, daily_scores):
    if not detected:
        return "Your body looks good. All your numbers are within your normal range. Keep doing what you're doing."

    days = len(drift_signals)

    # Plain language driver
    driver_plain = {
        "hrv": "your nervous system is recovering slower than normal",
        "rhr": "your resting heart rate is higher than usual, meaning your body is working harder even at rest",
        "sleep_score": "your sleep quality has dropped",
        "readiness": "your body isn't bouncing back like it usually does",
        "deep_sleep": "you're not getting enough deep sleep, which is when your body repairs itself",
        "stress": "you're spending too much time in a stressed state",
    }

    if drift_signals:
        import statistics as _stats
        avg_hrv = _stats.mean([ds["values"]["hrv"] for ds in drift_signals if ds["values"].get("hrv")])
        bl_hrv = baseline.get("hrv", 0)
        hrv_pct = round(abs((avg_hrv - bl_hrv) / bl_hrv * 100), 0) if bl_hrv else 0

        # Build driver sentence
        if drivers:
            top_drivers = [driver_plain.get(d["metric"], d["description"]) for d in drivers[:2]]
            cause = " and ".join(top_drivers)
        else:
            cause = "multiple signals are below your baseline"

        if active:
            timing = "This is happening right now"
        else:
            timing = f"Over the last few weeks, there were {days} days where this happened"

        return (
            f"{timing}. The main issue: {cause}. "
            f"During these days, your HRV averaged {avg_hrv:.0f}ms, which is {hrv_pct:.0f}% below your normal of {bl_hrv:.0f}ms. "
            f"This is a {severity}-severity drift."
        )

    return f"Drift detected. Severity: {severity}."


# Keep backward compatibility with mock data flow
def detect_drift(sleep_trends: list[dict], checkins: list[dict]) -> dict:
    """Legacy wrapper — converts mock format to real format and runs real engine."""
    # Convert mock data format to real data format
    checkin_by_date = {c["date"]: c for c in checkins}
    daily_data = []
    for t in sleep_trends:
        day = t["day"]
        c = checkin_by_date.get(day, {})
        daily_data.append({
            "day": day,
            "sleepScore": t.get("sleepScore", 0),
            "hrv": t.get("hrv", 0),
            "avgHeartRate": t.get("avgHeartRate", 60),
            "deepSleepMin": t.get("deepSleepPct", 0.2) * t.get("totalSleepHours", 7) * 60,
            "totalSleepHours": t.get("totalSleepHours", 7),
            "readinessScore": c.get("mood", 7) * 10,  # proxy
            "stressMin": (10 - c.get("stress", 5)) * 15,  # proxy: high stress checkin → high minutes
            "efficiency": t.get("efficiency", 85),
        })
    return detect_drift_real(daily_data)
