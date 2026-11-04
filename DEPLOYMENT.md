# Deployment configuration

Environment files are intentionally excluded from Git. Configure their values in your hosting provider's environment settings.

Frontend build settings:

- `VITE_API_URL=https://YOUR-BACKEND-HOST/api` when frontend and backend are hosted separately. Set this before building, then rebuild/redeploy the frontend. Vite embeds the value at build time.
- Without this variable the frontend uses `/api` on its own host, which requires that host to proxy `/api` to Express. Never use `localhost` for a remote deployment.

Backend runtime settings:

- `DATABASE_URL`: hosted PostgreSQL connection string.
- `JWT_SECRET`: a strong random secret set in the hosting dashboard, not committed to Git.
- `CLIENT_URL=https://YOUR-FRONTEND-HOST`: allowed frontend origin. Multiple explicit origins can be comma-separated.
- `NODE_ENV=production`.
- `TRUST_PROXY_HOPS`: actual trusted reverse-proxy hop count, if applicable.

Before starting the updated backend, run `npm run migrate` from `server` against the deployed database. The username migrations add usernames and remove the old required email field. Without these migrations, username-only registration can fail. Run the command as a release/pre-deploy step, then start with `npm start` from `server`.

Registration requires a full name, a unique 3–50-character username and a password of exactly 8 characters. HTTP 400 indicates invalid input or a duplicate username, 429 indicates throttling, 403 can indicate a CORS origin mismatch, and 500 requires checking backend/database logs. Do not publish environment secrets or passwords in logs.
