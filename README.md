# YU RestOS

<!-- ![YU RestOS Logo](assets/logo.png) -->

**AI-powered sleep recovery engine.** Detects burnout from wearable biometrics + behavioral data, then executes real-world recovery actions. Built with local AI, zero data leaves your device.

[![Built for Resolution Hackathon at Harvard](https://img.shields.io/badge/Resolution%20Hackathon-Harvard%202026-crimson?style=for-the-badge)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![AI: IBM Granite 3.3](https://img.shields.io/badge/AI-IBM%20Granite%203.3-purple?style=for-the-badge)](https://github.com)

---

## Screenshots

| Dashboard | Drift Alert | Recovery Plan |
|-----------|-------------|---------------|
| ![Dashboard](assets/screenshots/dashboard.png) | ![Drift](assets/screenshots/drift.png) | ![Recovery](assets/screenshots/recovery.png) |

| Action Execution | Morning Debrief | X-Ray Mode |
|-----------------|-----------------|------------|
| ![Actions](assets/screenshots/actions.png) | ![Debrief](assets/screenshots/debrief.png) | ![XRay](assets/screenshots/xray.png) |

---

## What It Does

Most health apps show you data. RestOS acts on it.

### 1. Real Oura Ring Integration
Connects to Oura API via OAuth2 and pulls **166+ days** of real biometric data across all 11 API scopes: sleep, HRV, heart rate, stress, readiness, SpO2, cardiovascular age, workouts, activity, resilience, and ring configuration.

### 2. GenZ-Optimized Health Dashboard
Sticky today bar, 8 vital cards with sparklines, 12 interactive charts, time range toggles (7D / 14D / 30D / ALL), "23 Mar" date formatting, dark mode with glassmorphism.

### 3. Dual-Signal Drift Detection
Proprietary algorithm combining biometric data (sleep score, HRV) with behavioral self-reports (mood, energy, stress) to detect burnout patterns **before the user feels them**. When both signal sources degrade simultaneously over 3+ consecutive days, that is a drift event.

### 4. AI Recovery Action Engine
When drift is detected, generates a personalized recovery plan with 5 executable actions:

| Action | Method |
|--------|--------|
| Eight Sleep temperature adjustment | Direct API call |
| Thermal alarm scheduling | Direct API call |
| Calendar blocking for recovery | Calendar API |
| Concierge wellness booking (Duckbill-style) | Concierge dispatch |
| Wayfair product recommendations | Product link engine |

### 5. One-Tap Execution
Actions fire sequentially with animated progress. API responses shown in real-time.

### 6. Privacy-First Local AI
IBM Granite 3.3 (8B) runs **on-device** via llama.cpp container. X-Ray Mode shows the same prompt processed locally vs cloud side-by-side, so you can see exactly what stays on your machine.

### 7. Recovery Feedback Loop
Morning debrief compares before/after metrics. User rates effectiveness. System learns.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, shadcn/ui |
| **Backend** | FastAPI (Python), 7 API modules |
| **AI Model** | IBM Granite 3.3 (8B) via llama.cpp / Podman container |
| **Biometrics** | Real Oura Ring API (OAuth2) |
| **Demo Data** | Mock Eight Sleep burnout arc |
| **Container** | Podman |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Podman (for local AI model)
- Oura developer account (for real biometric data)

### Backend

```bash
cd restos
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:8000`.

### Oura OAuth Setup

1. Create an app at [cloud.ouraring.com/console](https://cloud.ouraring.com/console)
2. Set redirect URI to `http://localhost:8000/api/oura/callback`
3. Add your credentials:

```bash
export OURA_CLIENT_ID=your_client_id
export OURA_CLIENT_SECRET=your_client_secret
```

4. Run the OAuth export script:

```bash
cd scripts
python oura_export.py
```

### Local AI (Granite 3.3)

```bash
podman run -p 8080:8080 granite-3.3-8b
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│  Landing  Dashboard  CheckIn  Drift  Recovery  Debrief  │
│                    XRay  OuraProfile                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend                         │
│                                                          │
│  ┌─────────┐ ┌────────┐ ┌───────┐ ┌──────────┐         │
│  │  Sleep   │ │CheckIn │ │ Drift │ │ Coaching │         │
│  └─────────┘ └────────┘ └───────┘ └──────────┘         │
│  ┌─────────┐ ┌────────┐ ┌───────┐                       │
│  │ Actions │ │Feedback│ │ Oura  │                       │
│  └────┬────┘ └────────┘ └───┬───┘                       │
│       │                     │                            │
│  ┌────▼────┐          ┌─────▼─────┐                     │
│  │Concierge│          │ Oura API  │                     │
│  │Tools    │          │ (OAuth2)  │                     │
│  │Products │          │ 11 Scopes │                     │
│  └─────────┘          └───────────┘                     │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Granite 3.3    │
              │  (8B, local)    │
              │  llama.cpp      │
              │  Podman         │
              └─────────────────┘
```

---

## API Reference

**28 endpoints** across 7 modules + health check.

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service status |

### Sleep (`/api/sleep`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sleep/latest` | Latest sleep session |
| GET | `/api/sleep/trends` | Sleep trend data |
| GET | `/api/sleep/history` | Full sleep history |
| GET | `/api/sleep/summary` | Dashboard summary stats |
| GET | `/api/sleep/current` | Current night live data |

### Check-In (`/api/checkin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkin/submit` | Submit daily check-in |
| GET | `/api/checkin/history` | Check-in history |
| GET | `/api/checkin/latest` | Latest check-in |

### Drift (`/api/drift`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drift/analyze` | Run drift detection |
| GET | `/api/drift/timeline` | Drift signals for charts |

### Coaching (`/api/coaching`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coaching/generate` | Generate AI coaching (local) |
| GET | `/api/coaching/xray` | Local vs cloud comparison |

### Actions (`/api/actions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/actions/plan/generate` | Generate recovery plan |
| GET | `/api/actions/plan/{id}` | Get existing plan |
| POST | `/api/actions/plan/{id}/execute/{action_id}` | Execute single action |
| POST | `/api/actions/plan/{id}/execute-all` | Execute all actions |
| GET | `/api/actions/task/{id}` | Check concierge task status |
| POST | `/api/actions/task/{id}/advance` | Advance task (demo) |
| GET | `/api/actions/products/{goal}` | Product recommendations |

### Feedback (`/api/feedback`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feedback/submit` | Submit recovery feedback |
| GET | `/api/feedback/{plan_id}` | Get feedback |
| GET | `/api/feedback/{plan_id}/effectiveness` | Effectiveness report |

### Oura (`/api/oura`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oura/sleep` | Real sleep sessions |
| GET | `/api/oura/daily_sleep` | Daily sleep scores |
| GET | `/api/oura/readiness` | Readiness scores |
| GET | `/api/oura/heartrate` | Heart rate data |
| GET | `/api/oura/hrv` | HRV measurements |
| GET | `/api/oura/stress` | Stress data |
| GET | `/api/oura/spo2` | Blood oxygen data |
| GET | `/api/oura/workouts` | Workout sessions |
| GET | `/api/oura/activity` | Daily activity |
| GET | `/api/oura/resilience` | Resilience scores |
| GET | `/api/oura/profile` | User profile + ring config |

---

## Oura Integration

RestOS connects to all **11 Oura API scopes** via OAuth2:

| Scope | Data Points |
|-------|-------------|
| Email | User email |
| Personal | Profile info |
| Daily | Sleep, readiness, activity scores |
| Heartrate | 5-min interval HR data |
| Tag | User tags |
| Workout | Exercise sessions |
| Session | Guided sessions |
| SpO2 | Blood oxygen levels |
| Ring Configuration | Device settings |
| Stress | Stress measurements |
| Heart Health | Cardiovascular age |

**166+ days** of real biometric data from a real Oura Ring. Not synthetic. Not mocked. Real.

---

## Demo Flow

A 3.5-minute walkthrough of the full recovery loop:

1. **Dashboard** -- Show real Oura biometric data, sparklines, time range toggles
2. **Check-In** -- Submit today's mood, energy, stress ratings
3. **Drift Alert** -- System detects dual-signal drift (biometric + behavioral)
4. **Recovery Plan** -- AI generates 5 personalized, executable actions
5. **Execute** -- One-tap fires all actions with live progress
6. **Morning Debrief** -- Before/after comparison, user rates recovery
7. **X-Ray Mode** -- Same prompt, local vs cloud, side-by-side

---

## Privacy & Security

- **Zero cloud dependency.** Granite 3.3 runs entirely on-device via llama.cpp.
- **No data exfiltration.** Biometric data stays local. X-Ray Mode proves it.
- **OAuth2 only.** Oura tokens are scoped and revocable.
- **No tracking.** No analytics, no telemetry, no third-party scripts.

Your health data is yours. Period.

---

## Project Structure

```
restos/
├── backend/
│   ├── main.py              # FastAPI app, router registration
│   ├── eight_sleep/         # Sleep data module (mock burnout arc)
│   ├── checkin/             # Behavioral self-report check-ins
│   ├── drift/               # Dual-signal burnout detection engine
│   ├── coaching/            # Local AI (Granite 3.3) + cloud comparison
│   ├── actions/             # Recovery plan generator + action engine
│   ├── feedback/            # Recovery effectiveness tracking
│   └── oura/                # Real Oura Ring API integration
├── frontend/
│   └── src/
│       ├── App.tsx          # Router + providers
│       ├── pages/           # 9 pages (Landing through OuraProfile)
│       ├── components/      # UI components, NavBar, charts
│       └── contexts/        # PlanContext for recovery state
├── scripts/
│   ├── oura_export.py       # OAuth flow + data export
│   └── oura_data/           # 166+ days of real biometric JSON
└── README.md
```

---

## Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing | Product intro |
| `/dashboard` | Dashboard | 8 vital cards, 12 charts, sparklines |
| `/checkin` | Check-In | Daily mood/energy/stress self-report |
| `/drift` | Drift Alert | Dual-signal burnout detection |
| `/recovery` | Recovery Plan | AI-generated executable actions |
| `/action-status` | Action Status | Live execution progress |
| `/debrief` | Morning Debrief | Before/after recovery comparison |
| `/xray` | X-Ray Mode | Local vs cloud AI transparency |
| `/oura` | Oura Profile | Real biometric data explorer |

---

## Team

**Omar Dominguez** -- Founder of [YU](https://github.com), MIT background. Builder. Lost 80 lbs starting with 7 minutes a day. Boston Marathon finisher. Ironman 70.3.

---

## Resolution Hackathon at Harvard -- March 28, 2026

$1,500 Prize | Sever Hall 213

---

## License

MIT License. See [LICENSE](LICENSE) for details.
