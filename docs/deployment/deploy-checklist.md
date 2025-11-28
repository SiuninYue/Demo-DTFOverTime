# Deployment Checklist (T152-T155)

## Pre-flight

- [ ] Run `npm run lint && npm run test && npm run build`
- [ ] Confirm Supabase migrations + storage bucket exist
- [ ] Ensure environment variables listed in `docs/deployment/vercel-env.md` are populated

## Deploy Steps

1. `vercel link` (once per machine)
2. `vercel pull` (sync env files locally if needed)
3. `vercel deploy --prebuilt` or `vercel deploy --prod` (after build)
4. Monitor build logs; ensure Edge functions compile without type errors

## Smoke Test (T154)

- [ ] Load `/schedule/import` and upload a sample image (should receive Phase-B placeholder response today)
- [ ] Create manual schedule + confirm MonthCalendar renders it
- [ ] Record a timecard entry and verify the salary summary updates
- [ ] Trigger `/api/salary/calculate` from the UI and check the serverless logs

Document results + screenshots in this file (or link to QA evidence) once the smoke test is run.

## Domain (T155)

If a custom domain such as `dtf-salary.vercel.app` is required:

1. Add the domain in Vercel → Project → Domains
2. Update DNS (CNAME to `cname.vercel-dns.com`)
3. Wait for propagation and rerun the smoke test using the custom hostname

## Outstanding Items

- Production deploy has **not** been executed yet (blocked on environment secrets + manual QA availability).
- Update this checklist with timestamps/operators when each box is completed to close T151–T155.
