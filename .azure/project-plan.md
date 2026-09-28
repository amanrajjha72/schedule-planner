# Project Plan

**Status**: Integrated
**Created**: 2026-09-28
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build Schedule Planner, a browser-based weekly timetable editor that combines recurring commitments and priority-ranked goals, creates feasible sessions with breaks while protecting sleep, and exports the current plan as a PDF. The feature text says “no accounts or cloud sync,” which conflicts with the confirmed PostgreSQL and API Login selections; this plan follows the confirmed selections and includes cloud-persisted schedules.

**App Type**: SPA + API

**API Login**: Yes

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Backend — Azure Functions

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node.js |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |
| **Orchestration** | docker-compose |

The API owns schedule, goal, and recurring-commitment persistence in PostgreSQL. Its rules-based scheduler places goal sessions into free 30-minute blocks, respecting fixed commitments, sleep, breaks, deadlines, and priority; it reports goals that do not fit rather than creating conflicts. PDF generation and manual edits remain in the frontend, with edits saved through the API.

---

## 3. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React + Vite |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

The frontend presents the authenticated weekly planner, goal and commitment editors, timetable regeneration, manual session editing, and client-side PDF download.

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure Static Web Apps | Host the React planner | — | `http://localhost:5173` | Essential |
| Azure Functions | Run the schedule and persistence API | `FUNCTIONS_WORKER_RUNTIME` | `node` | Essential |
| PostgreSQL | Persist goals, recurring commitments, and editable schedules | `DATABASE_URL` | `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/schedule_planner` | Essential |
| Blob Storage | Azure Functions host storage | `AzureWebJobsStorage` | `UseDevelopmentStorage=true` | Essential |

---

## 5. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | * | ✅ | v24.21.0 |
| npm | * | ✅ | 12.0.2 |
| Azure Functions Core Tools | Schedule API | ❓ | — |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Docker | Schedule API | ❓ | — |
| Docker Compose | Schedule API | ❓ | — |
| Chrome | Schedule Planner web | ✅ | Detected |
| `ms-azuretools.vscode-azurefunctions` | Schedule API | ✅ | Installed |

Double-check every ❓ prerequisite before proceeding. Docker is the planned emulator runtime; Docker and Docker Compose could not be confirmed in this environment.

---

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: A focused weekly-planning workspace with a crisp, editorial calendar grid, compact controls, and clear priority signals. Use restrained forest green for the primary action, warm coral for attention states, and quiet neutral surfaces; keep the schedule dense but easy to scan.
**Typography**: Aptos Display, Aptos, Segoe UI

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1534ac` | Generate and save actions, selected navigation, and focus states |
| `accent` | `#555185` | Deadline warnings, priority highlights, and schedule exceptions |
| `surface` | `#0cc0e4` | Planner canvas and page background |
| `text` | `#000000` | Schedule titles, time labels, and body copy |
| `muted` | `#000000` | Secondary timing details, captions, and helper text |
| `border` | `#000000` | Calendar divisions, field outlines, and table rules |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Weekly Plan | `/` | Review and edit this week's sessions, regenerate around fixed commitments, and export the current timetable to PDF. | `header, nav, hero, kpi-row, tabs, table, action-bar` |
| Goals | `/goals` | Track goal descriptions, deadlines, priorities, target hours, and scheduled progress; identify goals that need attention. | `header, nav, main, section-title, list, empty, actions` |
| Commitments | `/commitments` | Maintain recurring college, sleep, and personal commitments that the scheduler must protect. | `header, nav, main, section-title, table, form, actions` |

### Sample Content

Weekly Plan — scheduled session:
| Day | Time | Session | Duration | State |
|-----|------|---------|----------|-------|
| Monday | 09:00–10:30 | Research Methods reading | 1.5 h | Scheduled |
| Tuesday | 14:00–15:00 | Statistics problem set | 1 h | Scheduled |
| Thursday | 10:00–11:30 | Human-Computer Interaction project | 1.5 h | Needs review |

Goals — goal:
| Goal | Deadline | Priority | Target | State |
|------|----------|----------|--------|-------|
| Complete Research Methods literature review | 2026-10-16 | High | 6 h/week | On track |
| Finish Statistics problem sets, chapters 4–6 | 2026-10-09 | High | 4 h/week | At risk |
| Build Human-Computer Interaction prototype | 2026-10-23 | Medium | 5 h/week | On track |

Commitments — recurring commitment:
| Commitment | Days | Time | Type |
|------------|-------|------|------|
| College classes | Mon–Thu | 09:00–13:00 | Fixed |
| Sleep | Every day | 23:00–07:00 | Protected |
| Weekly review | Sunday | 17:00–17:30 | Personal |

Commitment form defaults: Title: College classes · Days: Monday–Thursday · Start: 09:00 · End: 13:00 · Repeat: Weekly · Protect from scheduling: Yes

---

## 7. Project Structure

```text
project-root/
├── .azure/
│   └── project-plan.md
├── .env.example
├── package.json
├── services/
│   ├── schedule-api/
│   │   ├── host.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── functions/
│   │   │   ├── scheduler/
│   │   │   ├── persistence/
│   │   │   └── validation/
│   │   └── tests/
│   └── schedule-web/
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   └── pages/
│       └── tests/
└── docker-compose.yml
```

---

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | Health check | — | `{ status, services }` | 200, 503 |
| 2 | GET | `/api/schedule/current` | Load the current user's weekly schedule | — | `{ weekOf, sessions }` | 200, 401, 503 |
| 3 | PUT | `/api/schedule/current` | Save manual session edits | `{ weekOf, sessions }` | `{ schedule }` | 200, 422, 401, 503 |
| 4 | POST | `/api/schedule/generate` | Generate a conflict-free week from goals and commitments | `{ weekOf }` | `{ sessions, unscheduledGoals }` | 200, 422, 401, 503 |
| 5 | GET | `/api/goals` | List goals and scheduled progress | — | `{ goals }` | 200, 401, 503 |
| 6 | POST | `/api/goals` | Create a goal | `{ title, deadline, priority, targetHours }` | `{ goal }` | 201, 422, 401, 503 |
| 7 | PATCH | `/api/goals/{goalId}` | Update a goal | `{ title?, deadline?, priority?, targetHours? }` | `{ goal }` | 200, 404, 422, 401, 503 |
| 8 | DELETE | `/api/goals/{goalId}` | Delete a goal | — | `{ deleted: true }` | 200, 404, 401, 503 |
| 9 | GET | `/api/commitments` | List recurring commitments | — | `{ commitments }` | 200, 401, 503 |
| 10 | POST | `/api/commitments` | Create a recurring commitment | `{ title, days, startTime, endTime, protected }` | `{ commitment }` | 201, 422, 401, 503 |
| 11 | PUT | `/api/commitments/{commitmentId}` | Update a recurring commitment | `{ title, days, startTime, endTime, protected }` | `{ commitment }` | 200, 404, 422, 401, 503 |
| 12 | DELETE | `/api/commitments/{commitmentId}` | Delete a recurring commitment | — | `{ deleted: true }` | 200, 404, 401, 503 |

---

## 9. Next Steps

1. Review the plan and confirm the account-backed persistence assumption. The feature description says there are no accounts or cloud sync, while the confirmed answers select API Login: Yes and PostgreSQL.
2. After approval, run **azure-project-scaffold** to build the planned frontend and API.
3. Run **azure-project-integrate** to wire live data, create migrations, and smoke-test the backend.
4. Run **azure-debug-plan** → **azure-debug-generate** for Docker emulators and VS Code debugging.
5. Run the **azure-deploy** agent when ready for Azure architecture, cost estimation, infrastructure, provisioning, and health verification.
