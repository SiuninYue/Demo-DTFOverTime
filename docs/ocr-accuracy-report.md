# OCR Accuracy Report (T129)

> Requirement: validate GPT-4 Vision OCR against ≥10 real DTF roster images (spec addendum G4 recommends ≥50) and confirm ≥90% aggregate accuracy before deployment.

## Current Status

- **Execution state**: 🔶 *Pending real-world dataset*
- **Latest run**: _not executed_
- **Blocking issue**: repository does not include the required roster images or ground-truth annotations. A data drop (images + CSV/JSON expectations) is needed to finish the measurement.

## Data Requirements

| Field | Description |
| --- | --- |
| `image` | File name or URI to the captured roster image (stored outside the repo for PDPA reasons). |
| `groundTruth` | JSON payload describing each day/type/time after manual verification. |
| `recognized` | Model output captured from `/api/ocr/recognize` including confidence + warnings. |
| `correctCells` / `totalCells` | Numeric accuracy measurement per roster (can be derived via tooling below). |
| `reviewer` | QA owner who verified the sample. |

Save the aggregated cases to `reports/validation/ocr-results.json`. A template lives in `reports/validation/ocr-results.sample.json`.

## Automation Helper

Use the helper script to compute averages once the dataset exists:

```bash
node scripts/validation/ocr-report.mjs reports/validation/ocr-results.json
```

The script prints case-by-case accuracy plus the global average and pass count (≥90%).

## Manual Review Checklist

1. Capture the raw OCR response and persist it next to the ground-truth JSON.
2. Compare each date/type/time triple; count matches vs. total populated cells.
3. Record qualitative warnings (blur, handwriting, cropped photo, etc.).
4. Update `docs/ocr-accuracy-report.md` with the measured accuracy summary and attach anonymised samples if PDPA permits.

## Next Actions

- [ ] Receive ≥10 (preferably 50) roster images + verified annotations.
- [ ] Run the helper script and log the numerical results here.
- [ ] File follow-up issues for any scenario <90% with remediation ideas (prompt tweaks, lighting tips, fallback heuristics).

Until the dataset is provided, T129 cannot be closed.
