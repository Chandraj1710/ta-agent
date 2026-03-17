# Product Requirements Document (PRD)  
## TA Ops Agent

**Version:** 1.0  
**Last updated:** 2026-03

---

## 1. Product Overview

### 1.1 Problem Statement

Talent Acquisition teams lose visibility when pipelines stall, scorecards are late, or referrals sit unreviewed. Manually checking an ATS (e.g. Greenhouse) is time-consuming and easy to miss. There is no single place to see “what needs attention” across pipeline health, interviewer accountability, and referral follow-up.

### 1.2 Solution

**TA Ops Agent** is a lightweight ops dashboard that:

- Connects to **Greenhouse** (Harvest API) as the source of truth.
- Runs an **agent pipeline** that evaluates jobs and applications and produces **alerts**.
- Surfaces alerts in a **web UI** by category (stalled pipeline, scorecards, referrals) so recruiters and TA leaders can act quickly.

The system works **without a database** (alerts in memory, live API for jobs/applications). An optional PostgreSQL sync is available for caching Greenhouse data.

### 1.3 Goals

- Give TA/recruiting a **single view** of pipeline and process issues.
- Reduce time spent **manually scanning** Greenhouse for stalls and missing actions.
- Keep scope **focused**: three alert modules, one ATS integration, minimal infra.

---

## 2. Users

| User | Need |
|------|------|
| **Recruiters** | See which candidates are over SLA, which offers have no response, and which jobs are stale so they can follow up. |
| **TA / Recruiting leads** | See scorecard delays (including escalation) and referral follow-up gaps. |
| **Admins** | Configure Greenhouse API key and (optionally) LLM/settings; run refresh. |

---

## 3. Scope

### 3.1 In Scope

- **Module 1 – Stalled pipeline:** Stage SLA, stale jobs, offers with no response (see Section 4.1).
- **Module 2 – Scorecard accountability:** Missing scorecards 24h+ after interview, with escalation (see Section 4.2).
- **Module 3 – Referral follow-up:** Referrals not reviewed or with no next action (see Section 4.3).
- **Greenhouse integration:** Read-only use of Harvest API v1 (jobs, applications, candidates, scorecards, etc.).
- **Web app:** Dashboard with alert counts, drill-down lists per module, refresh, and settings (API key, optional LLM).
- **Alert storage:** In-memory by default; optional future persistence (e.g. Postgres) not required for MVP.

### 3.2 Out of Scope (MVP)

- Writing data back to Greenhouse (e.g. moving stages, sending messages).
- Multi-tenant or multi-ATS (only Greenhouse; single org/API key).
- Mobile app or native clients (web only).
- Automated actions (e.g. sending reminders); alerts are for human follow-up only.
- Historical analytics or trend reports (current-state alerts only).

---

## 4. Functional Requirements

### 4.1 Module 1: Stalled Pipeline Alerts

| ID | Requirement | Priority |
|----|-------------|----------|
| M1.1 | **Stage SLA:** Flag applications where the candidate has been in the same stage longer than the configured SLA (e.g. Application Review 3 days, Recruiter Screen 5 days). | Must |
| M1.2 | **Stale job:** Flag open jobs with no candidate activity in ≥ 10 business days. | Must |
| M1.3 | **Offer no response:** Flag applications in an “Offer” stage with no candidate response for ≥ 3 business days. | Must |
| M1.4 | Only consider applications for **currently open jobs**. | Must |
| M1.5 | Apply a **lookback** (e.g. 90 days) so only recently relevant applications are flagged; ignore very old/abandoned records. | Must |
| M1.6 | Stale-job alerts only for jobs dormant between 10 and 365 days (configurable). | Should |
| M1.7 | Severity: **critical** when days in stage > 2× SLA; otherwise **warning**. | Should |

**UI:** List/table with Candidate, Job, Stage, Days, Recruiter (when applicable), Type (Stage SLA / Stale Job / Offer no response), Severity. For “Stale Job” type, Candidate and Stage show as N/A with short explanation.

### 4.2 Module 2: Scorecard Accountability

| ID | Requirement | Priority |
|----|-------------|----------|
| M2.1 | Flag **missing scorecards** when an interview has occurred and no scorecard is submitted within 24 hours. | Must |
| M2.2 | **Escalation:** 24–48h overdue → recruiter; 48h+ overdue → TA leader (severity/flag). | Must |
| M2.3 | Use interview data (e.g. scheduled interviews or application stage + date) and scorecard submission data from Greenhouse. | Must |

**UI:** List with interviewer, candidate, job, interview date, hours since interview, and whether to escalate to TA leader.

### 4.3 Module 3: Referral Follow-up

| ID | Requirement | Priority |
|----|-------------|----------|
| M3.1 | Identify referral applications (e.g. via `credited_to` / referrer). | Must |
| M3.2 | Flag referrals **not reviewed** (e.g. still in early stage after 2+ days). | Must |
| M3.3 | Flag referrals with **no next action** (e.g. advanced but no action in 5+ days). | Must |

**UI:** List with candidate, job, days since referral, current stage, referrer.

### 4.4 Cross-Cutting

| ID | Requirement | Priority |
|----|-------------|----------|
| CX.1 | **Refresh:** User can trigger a full re-run of the agent to refresh all alerts. | Must |
| CX.2 | **Dashboard:** Home page shows alert counts per module and links to each module’s list. | Must |
| CX.3 | **Settings:** Configure Greenhouse API key; test connection. Optional: LLM provider/model. | Must |
| CX.4 | **Greenhouse:** All ATS data read via Harvest API v1 (Basic Auth). No database required for core flow. | Must |
| CX.5 | **Optional sync:** If Postgres is configured, support syncing jobs/applications to DB for caching. | Could |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF.1 | **Performance:** Alert refresh completes in a reasonable time (e.g. &lt; 60s) with capped application fetch (e.g. first N pages) to avoid timeouts. |
| NF.2 | **Security:** API keys (Greenhouse, LLM) not committed; use env or settings. |
| NF.3 | **Availability:** App runs without a database; optional DB only for sync/cache. |
| NF.4 | **Usability:** Clear labels for alert types and severity; for Stale Job, explain why Candidate/Stage are N/A. |

---

## 6. Success Criteria

- Recruiters/TA can open the app, click Refresh, and see stalled pipeline, scorecard, and referral alerts within one minute.
- Stalled alerts are limited to open jobs and a configurable lookback to avoid noise from ancient data.
- Greenhouse connection and API key can be tested from Settings.
- Documentation exists for architecture (ARCHITECTURE.md) and setup (README.md).

---

## 7. Appendix

### 7.1 Glossary

- **Stage SLA:** Maximum allowed business days in a given pipeline stage before an alert.
- **Stale job:** Open job with no candidate activity for a defined number of business days.
- **Harvest API:** Greenhouse’s read-oriented API (v1); used for jobs, applications, candidates, scorecards.

### 7.2 References

- [Greenhouse Harvest API](https://developers.greenhouse.io/harvest.html)
- ARCHITECTURE.md – system design and agent pipeline
- PLAN.md – implementation plan and use cases
