# Auth API — Postman testing

Auth lives in `@newton/auth` and is exposed under `/api/auth/*`.

## Browser UI (student-web)

1. `npm run seed` (optional — or create an account in the UI)
2. `npm run dev --workspace=student-web`
3. Open http://localhost:3000/signup or http://localhost:3000/login
4. After success you land on `/dashboard` with your session (cookie + `/api/auth/me`)

## Setup (API / Postman)

1. Ensure root `.env` has `NEWTON_MONGODB_URI`, `NEWTON_JWT_SECRET` (≥32 chars), and `NEWTON_JWT_REFRESH_SECRET` (≥32 chars).
2. From repo root:

```bash
npm install
npm run seed
npm run dev --workspace=student-web
```

3. Import `infrastructure/postman/Newton-AI-Auth.postman_collection.json` into Postman.
4. Collection variable `baseUrl` defaults to `http://localhost:3000`.

## Endpoints

| Method | Path | Auth | Body |
|---|---|---|---|
| `POST` | `/api/auth/signup` | none | `{ "name", "email", "password", "role"? }` |
| `POST` | `/api/auth/login` | none | `{ "email", "password" }` |
| `POST` | `/api/auth/refresh` | none | `{ "refreshToken" }` |
| `GET` | `/api/auth/me` | Bearer / cookie | — |
| `POST` | `/api/auth/logout` | optional | — |
| `POST` | `/api/auth/recovery` | none | `{ "email", "code", "newPassword" }` |

## Seeded users

Password for all: `Password123!`

| Role | Email |
|---|---|
| student | `student@newton.ai` |
| teacher | `teacher@newton.ai` |
| parent | `parent@newton.ai` |
| school_admin | `admin@newton.ai` |
| super_admin | `superadmin@newton.ai` |
