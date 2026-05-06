# Vercel Deployment Checklist (supremefactory)

- [ ] Update `vercel.json` to mount:
  - frontend at `/`
  - backend at `/api`
- [x] Update `backend/package.json` so Vercel build runs `prisma generate` before `tsc`

- [ ] (If needed) Update frontend `VITE_API_BASE_URL` default or documentation so it points to `/api`
- [ ] Deploy to Vercel and set env vars:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - Redis env vars (if required by runtime code)
- [ ] Smoke test after deploy:
  - `GET /api/v1/health` (or confirm actual path)
  - login flow
  - one report endpoint

