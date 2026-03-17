# TA Ops Agent

Talent Acquisition pipeline alerts and automation. Integrates with Greenhouse ATS.

## Modules

- **Module 1: Stalled Pipeline Alerts** – Stage SLA, stale jobs, offers no response
- **Module 2: Scorecard Accountability** – Missing scorecards 24h+ after interview
- **Module 3: Referral Follow-up** – Referrals not reviewed or no next action

## Setup (no database required)

1. Copy `backend/.env.example` to `backend/.env` and set:
   - `GREENHOUSE_API_KEY` – Harvest API key from Greenhouse Dev Center

2. Install and run:

```bash
cd backend && npm install
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

**Without a database**: Alerts are stored in memory. Jobs are fetched live from Greenhouse. Everything works.

## Demo Mode (no backend required)

Run the frontend alone to explore the full UI with mock data:

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:3000. The app automatically uses mock data when the backend is unavailable. You can:

- View dashboard with alert counts (4 stalled, 2 scorecard, 2 referral)
- Browse Module 1 (Stalled Pipeline), Module 2 (Scorecards), Module 3 (Referrals)
- Configure LLM providers and models in Settings
- Click "Refresh Alerts" (returns mock data)

A **Demo** badge appears in the navbar when using mock data. To force mock mode: `NEXT_PUBLIC_USE_MOCK=true npm run dev`

## Optional: PostgreSQL (for sync)

To use `GET /api/greenhouse/sync` (cache jobs/applications in DB):

1. Create database: `createdb ta_agent`
2. Add to `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ta_agent
   ```
3. Run: `cd backend && npm run db:push`

Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

## API

- `GET /api/jobs` – List jobs from Greenhouse
- `GET /api/alerts` – List alerts (`?type=stalled|scorecard|referral`)
- `POST /api/alerts/refresh` – Run agent and refresh alerts
- `GET /api/greenhouse/sync` – Sync to DB (requires DATABASE_URL)
- `GET /api/greenhouse/test` – Test Greenhouse connection
