# Salary Calculation Examples

The following worked scenarios mirror Vitest coverage (`tests/unit/salary/*`) so engineers, QA, and HR can validate results without diving into code.

## Scenario 1 – Weekday overtime

| Input | Value |
|-------|-------|
| Base salary | 1,770 SGD |
| Attendance bonus | 200 SGD |
| Work schedule | 5-day |
| Day type | NORMAL_WORK_DAY |
| Hours worked | 10h (1h rest) |

Calculation:

```
Hourly rate = 1770 / 190.67 = 9.28
Overtime hours = 10h - 8h = 2h
OT pay        = 2h × 9.28 × 1.5 = 27.84
```

**Result**: Base pay remains part of monthly salary; daily total contributes **27.84 SGD** to `overtimePay`.

## Scenario 2 – Employer-requested statutory rest day (6h)

| Input | Value |
|-------|-------|
| Day type | REST_DAY |
| Hours worked | 6h |
| Employer requested | Yes |

```
Daily rate (Nov, 5-day) = 88.50
Rest day base pay       = 2 × 88.50 = 177.00  (since > half day)
Overtime hours          = max(0, 6h - 8h) = 0
```

**Result**: `restDayPay` += 177.00; overtime unchanged.

## Scenario 3 – Public holiday (10h)

| Input | Value |
|-------|-------|
| Day type | PUBLIC_HOLIDAY |
| Hours worked | 10h |

```
Base pay  = 1 × daily rate = 88.50
OT hours  = 2h
OT pay    = 2h × 9.28 × 1.5 = 27.84
PH total  = 116.34
```

**Result**: `publicHolidayPay` += 88.50 and `overtimePay` += 27.84.

## Scenario 4 – MC impact on attendance bonus

| Input | Value |
|-------|-------|
| Attendance bonus | 200 SGD |
| MC days | 2 |

```
Attendance bonus payout = 200 × 0.5 = 100
Reason                  = "MC 2天 → 50%"
```

**Result**: `attendanceBonus` = 100; `calculationDetails.attendanceBonusImpact` logs the rate and reason, which feed Settings + Salary UI.

## Scenario 5 – Combined monthly summary

Using the two day records above (Scenario 1 & 2) with 0 MC days:

```
Base salary      = 1770
Attendance bonus = 200
Rest day pay     = 177
Overtime pay     = 27.84
Total gross      = 1770 + 200 + 177 + 27.84 = 2174.84
Net pay          = total gross - deductions (default 0)
```

Use this sheet when validating Supabase `monthly_salaries` cache or comparing against payslips.
