# Integration Hand-off

## Backend
- Folder: `services/schedule-api/`
- Start: `npm run start --workspace schedule-api` (runs `func start` after clean/build)
- Port: `7071`
- Build: `npm run build --workspace schedule-api`
- Health: `GET /api/health`
- OpenAPI: `GET /api/openapi.json`, `GET /api/openapi.yaml`
- Auth implementation: `src/services/auth.ts`; bearer middleware: `src/middleware/withHttpHandler.ts`. Registration/login return `{ user, token }`; current-user returns `{ user }`. Keep the JWT in memory in the live frontend client, send `Authorization: Bearer <token>`, and clear it on logout. `JWT_SECRET` must be at least 32 bytes in non-Development environments; also configure `JWT_ISSUER` and `JWT_AUDIENCE`.

## Frontend
- Folder: `services/schedule-web/`
- Build: `npm run build --workspace schedule-web`
- Dev: `npm run dev --workspace schedule-web` (Vite, host-enabled)
- API seam: `src/api/index.ts`; implement the existing `ApiClient` interface in `src/api/types.ts` and swap only `index.ts` to the live client.
- Remove scaffold mock artifacts: `src/api/mockClient.ts`, `src/mocks/data.ts`, `src/types/index.ts`, `src/api/previewState.ts`, and `src/components/StateSwitcher.tsx`. Remove mock-only imports/state; keep `src/components/DataState.tsx` if still used for loading/error/empty UI.
- Auth UI/session files: `src/auth/AuthContext.tsx`, `src/pages/AuthPages.tsx`; connect registration, login, current-user and logout through the API seam.

## API Routes
- `GET /api/health`
- `GET /api/schedule/current`
- `PUT /api/schedule/current`
- `POST /api/schedule/generate`
- `GET /api/goals`
- `POST /api/goals`
- `PATCH /api/goals/{goalId}`
- `DELETE /api/goals/{goalId}`
- `GET /api/commitments`
- `POST /api/commitments`
- `PUT /api/commitments/{commitmentId}`
- `DELETE /api/commitments/{commitmentId}`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/openapi.json`
- `GET /api/openapi.yaml`

## Database
- Type: PostgreSQL; collections map to tables `users`, `goals`, `commitments`, and `schedules` (schedule sessions stored as JSONB).
- Migration tool: `node-pg-migrate` 9.x; directory: `services/schedule-api/migrations/`; command: `npm run db:migrate --workspace schedule-api`.
- Local connection: `DATABASE_URL`; production managed-identity connection: `AZURE_POSTGRES_HOST`, `AZURE_POSTGRES_DATABASE`, `AZURE_POSTGRES_USER`.
- Azure Functions/Azurite settings: `AzureWebJobsStorage` locally; production Blob endpoint uses `AZURE_STORAGE_ACCOUNT`.
- **Create schema migrations only. Do NOT create seed data.**

## Shared Types
- Package: `services/shared/`, npm name/import alias `@schedule/shared`.
- Build: `npm run build --workspace @schedule/shared`.
- Replace frontend-local duplicate entity/API types with shared package imports.

## Azure Services
- Azure Static Web Apps: Essential
- Azure Functions: Essential
- PostgreSQL: Essential
- Blob Storage: Essential

## Local Prerequisite Note
- Docker and Azure Functions Core Tools were not detected during scaffolding; PostgreSQL/Azurite emulator startup and `func start` smoke checks may require installing them.

## Integration Results (2026-09-28)

- Applied `20260928000000_create_schedule_schema.js` and `20260928010000_add_uuid_defaults.js` to PostgreSQL. The schema contains `users`, `goals`, `commitments`, and `schedules`; no seed data was created or retained.
- `npm run build --workspace @schedule/shared`, `npm run build --workspace schedule-api`, and `npm run build --workspace schedule-web` passed. Vite reported a large-chunk advisory.
- Azure Functions Core Tools 4.15.1 registered all 17 routes. Health and both OpenAPI routes returned 200; protected routes returned 401 without credentials; invalid auth payloads returned 422; no route returned 500 during the inventory probe.
- The frontend API seam points to the typed live client, the Vite `/api` proxy targets `http://localhost:7071`, and a source scan found no mock, preview-state, or switcher references in `services/schedule-web/src/`.
- Browser end-to-end checks used the live proxy and PostgreSQL: account registration/login, `GET /api/schedule/current`, goal create/list/delete, and empty-state rendering all succeeded. Deadline `2026-10-15` round-tripped and displayed as Oct 15, 2026. The temporary account and goal were removed afterward.
- Added database UUID defaults because the adapter omits IDs on inserts, and normalized PostgreSQL date-only values to avoid timezone shifts in API responses.
- Local PostgreSQL was reached on host port 5433 using the existing Compose data volume because the host's port-5432 path returned PostgreSQL authentication error `28P01`. The Functions host was started with a `DATABASE_URL` override for port 5433; the standard local settings still specify port 5432 and may need adjustment for this machine.
