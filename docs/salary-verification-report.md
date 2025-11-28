# Salary Verification Report (T130)

> Requirement: compare calculated salary outputs against ≥5 real payslips and confirm each deviation is <$10.

## Current Status

- **Execution state**: 🔶 *Pending real payslip samples*
- **Latest run**: _not executed_
- **Blocking issue**: repository does not contain anonymised payslip CSV/PDF data. Need figures for base salary, OT, allowances, deductions per employee/month.

## Data Capture Template

Store verification cases in `reports/validation/salary-verification.json` (see sample file in the same directory).

```json
{
  "cases": [
    {
      "id": "PAY-001",
      "employeeId": "uuid",
      "month": "2025-10",
      "expected": {
        "netPay": 2450.55,
        "overtimePay": 580.11,
        "attendanceBonus": 100
      },
      "calculated": {
        "netPay": 2448.10,
        "overtimePay": 579.90,
        "attendanceBonus": 100
      },
      "tolerance": 10,
      "notes": "Screenshot of payslip archived in secure drive"
    }
  ]
}
```

Only the `expected.netPay` and `calculated.netPay` fields are mandatory for the automation script. Provide additional breakdowns to help triage failures.

## Automation Helper

```bash
node scripts/validation/salary-verification.mjs reports/validation/salary-verification.json
```

The script prints each case, highlights deviations, and exits with code 1 if any sample breaches the tolerance (default $10).

## Manual Verification Checklist

1. Export the monthly summary from `/api/salary/calculate` (or from `useSalary`) for a selected employee.
2. Compare every line item with the payslip (basic, overtime, attendance bonus, rest day pay, deductions).
3. Record the delta and reason (rounding, MC adjustments, manual allowances, etc.).
4. Attach evidence in the internal QA drive; only anonymised numbers should live in this repo.

## Next Actions

- [ ] Receive ≥5 anonymised payslip breakdowns covering different schedules and MC combinations.
- [ ] Run the verification script and document the output in this file.
- [ ] File bugs for any discrepancy >$10 with reproduction data.

T130 remains blocked until sample payslips are available.
