# @newton/auth

JWT issuance, refresh tokens, RBAC, and recovery-code auth flows.

## Public API surface

| Export | Purpose |
|---|---|
| `loginHandler` / `refreshHandler` / `logoutHandler` / `meHandler` / `recoveryHandler` | Thin Next.js route handlers |
| `requireAuth` / `requireRole` | Protect API routes |
| `signAccessToken` / `verifyAccessToken` | Access JWT |
| `signRefreshToken` / `verifyRefreshToken` | Refresh JWT (separate secret) |
| `issueRecoveryCode` / `redeemRecoveryCode` | School-issued recovery codes |
| `ROLES` | Frozen role enum |

## Postman-oriented contract

Login and refresh return tokens **in the JSON body** (for Bearer usage) and also set HttpOnly cookies (for browsers):

```json
{
  "ok": true,
  "user": { "id": "...", "email": "...", "role": "student" },
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": "15m"
}
```

Use `Authorization: Bearer <accessToken>` on subsequent requests.
