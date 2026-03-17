# TA Ops Agent

Talent Acquisition pipeline alerts and automation. Integrates with Greenhouse ATS.

## Modules

- **Module 1: Stalled Pipeline Alerts** – Stage SLA, stale jobs, offers no response
- **Module 2: Scorecard Accountability** – Missing scorecards 24h+ after interview
- **Module 3: Referral Follow-up** – Referrals not reviewed or no next action

## Setup

1. Copy `backend/.env.example` to `backend/.env` and set:
   - `DATABASE_URL` – PostgreSQL connection string
   - `GREENHOUSE_API_KEY` – Harvest API key from Greenhouse Dev Center

2. Install and run:

```bash
cd backend && npm install && npm run db:push
cd ../frontend && npm install
```

3. Start dev servers:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

4. Open http://localhost:3000

## API

- `GET /api/jobs` – List jobs (add `?source=greenhouse` for live fetch)
- `GET /api/alerts` – List alerts (`?type=stalled|scorecard|referral`)
- `POST /api/alerts/refresh` – Run agent and refresh alerts
- `GET /api/greenhouse/sync` – Sync jobs and applications from Greenhouse
- `GET /api/greenhouse/test` – Test Greenhouse connection
