# TA Ops Agent – Architecture

## Overview

TA Ops Agent is a full-stack app that pulls data from **Greenhouse** (Harvest API), runs an **agent pipeline** to generate alerts (stalled pipeline, scorecards, referrals), and serves them via a **REST API** and **Next.js** dashboard.

---

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                              │
│  Dashboard · Stalled Alerts · Scorecards · Referrals · Settings  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (e.g. localhost:3001)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend (Express)                                               │
│  REST API  →  TA Agent Graph  →  Greenhouse Service             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS, Basic Auth
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Greenhouse Harvest API v1                                       │
│  /jobs, /applications, /candidates, /scorecards, ...             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layers

| Layer      | Tech              | Purpose |
|-----------|-------------------|---------|
| **Frontend** | Next.js 14, Tailwind, shadcn/ui | Dashboard, alert lists, settings, refresh |
| **Backend**  | Express, TypeScript           | REST API, agent orchestration, env/config |
| **External** | Greenhouse Harvest API v1     | Jobs, applications, candidates, scorecards |

---

## Agent Pipeline

The **TA Agent** is a **LangGraph** workflow: one orchestrator and three sub-agents.

### Flow

```
fetch_greenhouse_data  →  generate_alerts  →  format_response
```

1. **fetch_greenhouse_data**  
   Calls Greenhouse: open jobs, active applications (capped pages), scorecards. Builds normalized state (jobs, applications with stage/enteredAt, scorecards).

2. **generate_alerts**  
   Runs three sub-agents on that state; merges all alerts.

3. **format_response**  
   Returns state (including alerts) to the caller.

### Sub-Agents

| Sub-Agent            | Input              | Output Alerts |
|----------------------|--------------------|----------------|
| **StalledPipelineAgent** | jobs, applications | Stage SLA, Stale Job, Offer no response |
| **ScorecardAgent**       | interviews, scorecards map | Missing scorecards 24h+ with escalation |
| **ReferralAgent**        | applications (with referrer) | Not reviewed, No next action |

### State Shape

- `jobs`: `{ id, title, lastActivityAt }[]`
- `applications`: `{ id, jobId, stageName, enteredAt, referrerId, recruiterId, ... }[]`
- `scorecards`: `{ applicationId, interviewedAt, submittedBy }[]`
- `alerts`: `{ type, severity, payload }[]`

---

## Data Flow

1. User clicks **Refresh Alerts** (or calls `POST /api/alerts/refresh`).
2. Backend runs the TA Agent graph: fetch from Greenhouse → run sub-agents → collect alerts.
3. Alerts are stored in memory (or DB if configured).
4. Frontend fetches alerts via `GET /api/alerts?type=stalled|scorecard|referral` and renders lists.

---

## API Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/jobs` | List open jobs from Greenhouse |
| GET | `/api/alerts` | List alerts (optional `?type=stalled\|scorecard\|referral`) |
| POST | `/api/alerts/refresh` | Run agent and refresh stored alerts |
| GET | `/api/alerts/debug` | Run agent and return counts + sample (no store) |
| GET | `/api/alerts/verify-greenhouse` | Raw Greenhouse sample (no agent) |
| GET | `/api/greenhouse/test` | Test Greenhouse connection |
| GET | `/api/health` | Health check |

---

## Key Files

| Area | File | Role |
|------|------|------|
| Backend entry | `backend/src/index.ts` | Express app, routes, CORS |
| Agent graph | `backend/src/agents/ta-agent.graph.ts` | LangGraph: fetch → generate_alerts → format |
| Stalled agent | `backend/src/agents/stalled-pipeline.agent.ts` | Stage SLA, stale job, offer no response |
| Scorecard agent | `backend/src/agents/scorecard.agent.ts` | Missing scorecards, escalation |
| Referral agent | `backend/src/agents/referral.agent.ts` | Referral follow-up |
| Greenhouse client | `backend/src/services/greenhouse.service.ts` | Harvest API v1, Basic Auth, pagination |
| SLA config | `backend/src/config/sla.config.ts` | Stage SLAs, lookback, stale-job limits |
| Alerts API | `backend/src/routes/alerts.routes.ts` | GET/POST alerts, debug, verify-greenhouse |
| Frontend dashboard | `frontend/src/app/page.tsx` | Home, refresh, module cards |
| Stalled page | `frontend/src/app/alerts/stalled/page.tsx` | Stalled alerts table |

---

## Configuration

- **Backend**: `backend/.env` — `PORT`, `GREENHOUSE_API_KEY`, `DATABASE_URL` (optional), `LLM_*` (optional).
- **Frontend**: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).
- **Stalled logic**: `STALLED_LOOKBACK_DAYS`, `STALE_JOB_DAYS`, `STALE_JOB_MAX_AGE_DAYS`, stage SLAs in `sla.config.ts`.

---

## Optional Database

With `DATABASE_URL` set, `GET /api/greenhouse/sync` can persist jobs and applications. Alerts can still be in-memory; the agent always reads from the Greenhouse API (or synced data) when running.
