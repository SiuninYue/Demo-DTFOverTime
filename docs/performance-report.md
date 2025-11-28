# Performance Test Report (T150)

> Requirement: validate SC-008/015/016 (FCP <2s, calendar switch <500ms, salary refresh <100ms) before deployment.

## Current Status

- **SPA build**: ✅ `npm run build` (see terminal logs in CI)
- **Lighthouse / Web Vitals**: ⏳ Pending (needs deployed URL or headful Chrome)
- **Calendar render profiling**: ⏳ Pending (requires React DevTools Profiler or React 19 trace markers)
- **Salary calculation timing**: ⚠️ Partially covered by `console.time` hooks (T140a) but no recorded metrics yet

## How to Run

1. **Bundle**
   ```bash
   npm run build
   npm run preview -- --host 0.0.0.0 --port 4173
   ```
2. **Lighthouse (FCP/LCP/TBT)**
   ```bash
   npx lighthouse http://localhost:4173 --view --only-categories=performance --preset=desktop
   ```
   Record the metrics table in this file under “Results”.
3. **Calendar profiling**
   - Open React DevTools Profiler.
   - Interact with MonthCalendar (change month) and capture the render duration; target <500ms.
4. **Salary refresh timing**
   - Trigger `useSalary.refresh()` (e.g., from Home “Refresh” button) with DevTools console open.
   - Inspect `console.time('useSalary.calculateMonthlySummary')` output and note the duration (<100ms target).

## Results Template

| Metric | Target | Actual | Status | Notes |
| --- | --- | --- | --- | --- |
| FCP (mobile) | < 2s | _pending_ | ⏳ | Needs Lighthouse run |
| Calendar switch | < 500ms | _pending_ | ⏳ | Profile MonthCalendar |
| Salary recalculation | < 100ms | _pending_ | ⏳ | Capture console timing |

## Blocking Issues

- No Chrome/Edge with Lighthouse support is available in the sandbox.
- Preview build is not exposed outside localhost, preventing remote Lighthouse.

Performance validation must be rerun once a preview deployment or tunnel is available. Update this document with the measured metrics to close T150.
