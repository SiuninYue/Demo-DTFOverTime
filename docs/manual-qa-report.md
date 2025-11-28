# Manual QA Report (T149)

> Requirement: run the key flows on iOS Safari and Android Chrome before release.

## Test Matrix

| Flow | Device | Browser | Status | Notes |
| --- | --- | --- | --- | --- |
| Roster upload → manual entry | iPhone 15 | Safari 18 | ⏳ Pending | Need physical device / BrowserStack session |
| Calendar review + day details | iPhone 15 | Safari 18 | ⏳ Pending |  |
| Timecard entry + salary refresh | Pixel 8 | Chrome 131 | ⏳ Pending |  |
| MC record add/delete | Pixel 8 | Chrome 131 | ⏳ Pending |  |
| Salary export (CSV/PDF) | Pixel 8 | Chrome 131 | ⏳ Pending |  |

## Execution Steps

1. Deploy the latest build to a password-protected Vercel preview (or use `npm run preview` on a LAN reachable by devices).
2. Sign in with a Supabase test user to keep PDPA compliance.
3. Walk through each user story end-to-end, capturing screenshots and noting regressions.
4. Update the matrix above with ✅/❌ and link to filed issues as needed.

## Blocking Issues

- No physical or virtual mobile devices are accessible from this environment.
- Vercel deployment (T153) is still pending, so there is no shareable URL for QA.

Once deployment is ready and devices are available, rerun the checklist and update this document to close T149.
