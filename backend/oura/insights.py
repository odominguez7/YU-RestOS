"""
Oura Insights — goal-driven biometric analysis engine.
Computes features from passive (Oura) + active (check-in) data,
then prompts Gemini with science-backed reasoning.
"""

import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo

BOSTON_TZ = ZoneInfo("America/New_York")

# ── Gemini config ──
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        ".env"
    )
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("GEMINI_API_KEY="):
                    GEMINI_API_KEY = line.split("=", 1)[1].strip()


# ── Available objectives ──

OBJECTIVES = {
    "peak_performance": {
        "label": "Peak Performance",
        "description": "Maximize daily output, cognitive sharpness, and physical readiness",
        "key_metrics": ["readiness", "hrv", "deep_sleep", "stress", "rhr"],
        "science": "Driven by autonomic balance (HRV), sleep architecture (deep/REM ratio), and allostatic load (cumulative stress). High performers maintain HRV coefficient of variation <15% and readiness >75.",
    },
    "endurance": {
        "label": "Endurance Training",
        "description": "Optimize aerobic base, recovery between sessions, avoid overtraining",
        "key_metrics": ["hrv", "rhr", "total_sleep", "readiness", "steps"],
        "science": "Parasympathetic dominance (high HRV, low RHR) indicates aerobic fitness. Overtraining shows as HRV suppression >20% below baseline with elevated RHR. Sleep >7.5hrs critical for glycogen replenishment.",
    },
    "body_composition": {
        "label": "Body Composition",
        "description": "Optimize fat loss while preserving muscle through recovery and sleep",
        "key_metrics": ["deep_sleep", "total_sleep", "stress", "steps", "rhr"],
        "science": "Growth hormone peaks during deep sleep (N3). Cortisol from chronic stress promotes visceral fat storage. Sleep <6hrs increases ghrelin +28% and decreases leptin -18%. Steps correlate with NEAT (non-exercise activity thermogenesis), the largest variable in daily expenditure.",
    },
    "stress_resilience": {
        "label": "Stress Resilience",
        "description": "Build capacity to handle high cognitive/emotional load without breakdown",
        "key_metrics": ["hrv", "stress", "readiness", "efficiency", "rem_sleep"],
        "science": "HRV variability (not just level) predicts stress tolerance. REM sleep processes emotional memory consolidation. Chronic high-stress minutes (>120/day) indicate sympathetic overdrive. Recovery-to-stress ratio below 0.5 signals allostatic overload.",
    },
    "longevity": {
        "label": "Longevity & Healthspan",
        "description": "Optimize biomarkers associated with long-term health and biological age",
        "key_metrics": ["rhr", "hrv", "spo2", "deep_sleep", "cardiovascular_age"],
        "science": "RHR <60 bpm associated with lower all-cause mortality. HRV decline rate is a biological aging marker. SpO2 consistency indicates respiratory health. Deep sleep drives glymphatic clearance (brain waste removal). Vascular age gap to chronological age reflects cardiovascular fitness.",
    },
}


# ── Feature computation ──

def compute_features(sleep_history: list, stress_data: list, today_data: dict) -> dict:
    """Compute rolling averages, variability, and rule-based flags from raw Oura data."""
    if not sleep_history:
        return {"error": "No sleep data"}

    last_7 = sleep_history[-7:]
    last_14 = sleep_history[-14:]
    last_30 = sleep_history[-30:]

    def avg(data, key):
        vals = [d.get(key) for d in data if d.get(key) is not None and d.get(key) != 0]
        return round(sum(vals) / len(vals), 1) if vals else None

    def std(data, key):
        vals = [d.get(key) for d in data if d.get(key) is not None and d.get(key) != 0]
        if len(vals) < 2:
            return None
        mean = sum(vals) / len(vals)
        variance = sum((v - mean) ** 2 for v in vals) / (len(vals) - 1)
        return round(variance ** 0.5, 1)

    def trend(data, key):
        if len(data) < 7:
            return None
        recent = avg(data[-3:], key)
        prior = avg(data[-7:-3], key)
        if recent is None or prior is None or prior == 0:
            return None
        return round(((recent - prior) / prior) * 100, 1)

    def min_val(data, key):
        vals = [d.get(key) for d in data if d.get(key) is not None and d.get(key) != 0]
        return min(vals) if vals else None

    def max_val(data, key):
        vals = [d.get(key) for d in data if d.get(key) is not None and d.get(key) != 0]
        return max(vals) if vals else None

    features = {
        "window": {
            "7d": {
                "sleep_score": avg(last_7, "sleepScore"),
                "hrv": avg(last_7, "hrv"),
                "rhr": avg(last_7, "avgHeartRate"),
                "deep_sleep_min": avg(last_7, "deepSleepMin"),
                "rem_sleep_min": avg(last_7, "remSleepMin"),
                "total_sleep_hrs": avg(last_7, "totalSleepHours"),
                "efficiency": avg(last_7, "efficiency"),
                "readiness": avg(last_7, "readinessScore"),
                "steps": avg(last_7, "steps"),
                "stress_min": avg(last_7, "stressMin"),
            },
            "14d": {
                "sleep_score": avg(last_14, "sleepScore"),
                "hrv": avg(last_14, "hrv"),
                "rhr": avg(last_14, "avgHeartRate"),
                "deep_sleep_min": avg(last_14, "deepSleepMin"),
                "total_sleep_hrs": avg(last_14, "totalSleepHours"),
                "readiness": avg(last_14, "readinessScore"),
                "stress_min": avg(last_14, "stressMin"),
            },
            "30d": {
                "sleep_score": avg(last_30, "sleepScore"),
                "hrv": avg(last_30, "hrv"),
                "rhr": avg(last_30, "avgHeartRate"),
                "readiness": avg(last_30, "readinessScore"),
                "total_sleep_hrs": avg(last_30, "totalSleepHours"),
            },
        },
        "variability": {
            "hrv_std_7d": std(last_7, "hrv"),
            "hrv_cv_7d": round(std(last_7, "hrv") / avg(last_7, "hrv") * 100, 1) if std(last_7, "hrv") and avg(last_7, "hrv") else None,
            "sleep_score_std_7d": std(last_7, "sleepScore"),
            "rhr_std_7d": std(last_7, "avgHeartRate"),
        },
        "ranges_7d": {
            "hrv_min": min_val(last_7, "hrv"),
            "hrv_max": max_val(last_7, "hrv"),
            "rhr_min": min_val(last_7, "avgHeartRate"),
            "rhr_max": max_val(last_7, "avgHeartRate"),
            "sleep_min_hrs": min_val(last_7, "totalSleepHours"),
            "sleep_max_hrs": max_val(last_7, "totalSleepHours"),
        },
        "trends": {
            "sleep_score": trend(last_7, "sleepScore"),
            "hrv": trend(last_7, "hrv"),
            "rhr": trend(last_7, "avgHeartRate"),
            "readiness": trend(last_7, "readinessScore"),
            "deep_sleep": trend(last_7, "deepSleepMin"),
            "stress": trend(last_7, "stressMin"),
        },
        "ratios": {},
        "flags": [],
        "today": {},
    }

    # Recovery-to-stress ratio
    avg_stress = avg(last_7, "stressMin")
    avg_readiness = avg(last_7, "readinessScore")
    if avg_stress and avg_readiness:
        features["ratios"]["recovery_stress"] = round(avg_readiness / max(avg_stress, 1), 2)

    # Deep-to-total sleep ratio
    avg_deep = avg(last_7, "deepSleepMin")
    avg_total = avg(last_7, "totalSleepHours")
    if avg_deep and avg_total:
        features["ratios"]["deep_to_total_pct"] = round(avg_deep / (avg_total * 60) * 100, 1)

    # Rule-based flags
    short_sleep_nights = sum(1 for d in last_7 if d.get("totalSleepHours", 8) < 6)
    if short_sleep_nights >= 3:
        features["flags"].append(f"{short_sleep_nights}/7 nights under 6 hours sleep — sleep debt accumulating")

    low_hrv_nights = sum(1 for d in last_7 if d.get("hrv") and d["hrv"] < 20)
    if low_hrv_nights >= 3:
        features["flags"].append(f"HRV below 20ms on {low_hrv_nights}/7 nights — parasympathetic suppression")

    high_stress_days = sum(1 for d in last_7 if d.get("stressMin", 0) > 120)
    if high_stress_days >= 3:
        features["flags"].append(f"High stress (>2hrs) on {high_stress_days}/7 days — allostatic load elevated")

    if features["trends"]["hrv"] is not None and features["trends"]["hrv"] < -15:
        features["flags"].append(f"HRV declining {features['trends']['hrv']}% — autonomic recovery compromised")

    if features["trends"]["rhr"] is not None and features["trends"]["rhr"] > 10:
        features["flags"].append(f"RHR rising {features['trends']['rhr']}% — possible overreaching or illness onset")

    low_readiness = sum(1 for d in last_7 if d.get("readinessScore", 80) < 65)
    if low_readiness >= 3:
        features["flags"].append(f"Readiness below 65 on {low_readiness}/7 days — system under strain")

    low_efficiency = sum(1 for d in last_7 if d.get("efficiency", 90) < 80)
    if low_efficiency >= 3:
        features["flags"].append(f"Sleep efficiency below 80% on {low_efficiency}/7 nights — time in bed not converting to sleep")

    # HRV CV flag
    cv = features["variability"].get("hrv_cv_7d")
    if cv and cv > 25:
        features["flags"].append(f"HRV coefficient of variation {cv}% — high day-to-day inconsistency suggests unstable recovery")

    # Today snapshot
    if today_data:
        features["today"] = {
            "sleep_score": today_data.get("sleepScore"),
            "readiness": today_data.get("readinessScore"),
            "hrv": today_data.get("hrv"),
            "hr": today_data.get("latestHeartRate"),
            "stress_min": today_data.get("stressMin"),
            "steps": today_data.get("steps"),
            "spo2": today_data.get("spo2Avg"),
        }

    # Last 7 days raw
    features["daily_detail"] = [
        {
            "day": d["day"],
            "sleep_score": d.get("sleepScore"),
            "hrv": d.get("hrv"),
            "rhr": d.get("avgHeartRate"),
            "deep_min": d.get("deepSleepMin"),
            "rem_min": d.get("remSleepMin"),
            "total_hrs": d.get("totalSleepHours"),
            "readiness": d.get("readinessScore"),
            "stress_min": d.get("stressMin"),
            "steps": d.get("steps"),
        }
        for d in last_7
    ]

    return features


# ── System prompt — no hardcoded profile ──

SYSTEM_PROMPT = """You are an applied human performance scientist. You analyze wearable biometric data to help people become measurably better versions of themselves.

YOUR APPROACH:
- You reason from first principles of sleep science, autonomic physiology, and exercise science
- You cite the physiological mechanism behind every recommendation (e.g., "deep sleep drives growth hormone pulsatility" not "deep sleep is important")
- You identify patterns the user cannot see: correlations between metrics, lagging indicators, and threshold effects
- You distinguish between signal (real trends requiring action) and noise (normal day-to-day variation)
- You quantify everything — "your HRV dropped 14%" not "your HRV dropped"

OUTPUT STRUCTURE (use exactly these headers):
**Signal:** One sentence. What is the data actually telling us right now.
**Bright spots:** What is working. Reference specific numbers and the physiology behind why they matter.
**Limiters:** What is holding performance back. Identify root causes, not symptoms. If stress is high, ask why sleep is suffering, not just that sleep is low.
**Unlock protocol:** 2-3 specific, time-bound actions for the next 48 hours. Each action should target a specific metric with a measurable outcome. Format: "Do X → because Y → expect Z."

STRICT RULES:
- Do NOT mention diseases, medications, diagnoses, or medical conditions
- Do NOT say "consult a doctor" or give medical advice
- Do NOT assume anything about the user that is not in the data (no guessing their sport, job, or lifestyle)
- Do NOT pad with filler. Every sentence should contain data or a mechanism.
- Keep it under 450 words
- Use short paragraphs, not bullet lists for bright spots and limiters
- Use numbered items only for the unlock protocol"""


async def analyze_with_gemini(features: dict, model: str = "gemini-2.5-flash", objective: str = "peak_performance") -> dict:
    """Send computed features to Gemini for goal-driven analysis."""
    if not GEMINI_API_KEY:
        return {
            "analysis": None,
            "error": "No GEMINI_API_KEY configured. Add it to .env file.",
            "features": features,
        }

    obj = OBJECTIVES.get(objective, OBJECTIVES["peak_performance"])

    from google import genai
    client = genai.Client(api_key=GEMINI_API_KEY)

    now = datetime.now(BOSTON_TZ)
    user_prompt = f"""Date: {now.strftime('%A, %B %d %Y, %I:%M %p ET')}

OBJECTIVE: {obj['label']} — {obj['description']}
RELEVANT SCIENCE: {obj['science']}
KEY METRICS TO PRIORITIZE: {', '.join(obj['key_metrics'])}

TODAY'S SNAPSHOT:
{json.dumps(features.get('today', {}), indent=2)}

7-DAY ROLLING AVERAGES:
{json.dumps(features['window']['7d'], indent=2)}

14-DAY BASELINE (for delta comparison):
{json.dumps(features['window']['14d'], indent=2)}

30-DAY BASELINE:
{json.dumps(features['window']['30d'], indent=2)}

VARIABILITY (7-day standard deviation + coefficient of variation):
{json.dumps(features['variability'], indent=2)}

MIN/MAX RANGES (last 7 days):
{json.dumps(features['ranges_7d'], indent=2)}

COMPUTED RATIOS:
{json.dumps(features['ratios'], indent=2)}

TRENDS (last 3 days vs prior 4 days, % change):
{json.dumps(features['trends'], indent=2)}

RULE-BASED FLAGS:
{json.dumps(features['flags'], indent=2) if features['flags'] else 'None — all metrics within normal range.'}

DAILY BREAKDOWN (last 7 nights):
{json.dumps(features['daily_detail'], indent=2)}

Analyze this data through the lens of the stated objective. Prioritize the key metrics listed. Use the science context to ground your reasoning. Identify what the user should do differently in the next 48 hours to move the needle on their objective."""

    try:
        response = client.models.generate_content(
            model=model,
            contents=[
                {"role": "user", "parts": [{"text": SYSTEM_PROMPT + "\n\n" + user_prompt}]},
            ],
        )
        analysis = response.text
    except Exception as e:
        return {
            "analysis": None,
            "error": f"Gemini API error: {str(e)}",
            "features": features,
        }

    return {
        "analysis": analysis,
        "model": model,
        "objective": obj["label"],
        "features": features,
        "generated_at": now.isoformat(),
    }
