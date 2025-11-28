# API Reference – DTF Salary Tracker Serverless Endpoints

The Supabase auto-generated REST endpoints cover CRUD operations. This document tracks the custom Vercel serverless functions shipped in `/api`.

## Common Requirements

| Item | Details |
|------|---------|
| Base URL | `https://<vercel-app>.vercel.app/api` |
| Auth | `Authorization: Bearer <Supabase access token>` (production enforced) |
| Rate limits | OCR: 8 req/min per IP; Salary: 20 req/min per IP (`429` on violation) |
| Content types | `multipart/form-data` for OCR uploads, `application/json` for salary calculations |

### Handling Rate Limit Errors

```ts
if (response.status === 429) {
  const retryAfter = Number(response.headers.get('retry-after') ?? '5')
  await wait(retryAfter * 1000)
  retry()
}
```

---

## `POST /api/ocr/recognize`

Uploads a roster image and returns a preview payload when GPT-4 Vision integration is disabled.

### Request

```
POST /api/ocr/recognize
Content-Type: multipart/form-data
Authorization: Bearer <token>

image: File (≤5MB)
userName: string
month: YYYY-MM (optional)
```

### Response – 200

```json
{
  "employeeName": "KELLY TEIN",
  "recognitionConfidence": 0.94,
  "schedule": {
    "2025-11-01": {
      "type": "work",
      "plannedStartTime": "10:00",
      "plannedEndTime": "19:00",
      "isStatutoryRestDay": false,
      "notes": "Shift A",
      "isConfirmed": true
    }
  }
}
```

### Response – 401

Missing `Authorization` header (production only).

```json
{ "error": "UNAUTHORIZED", "message": "Missing or invalid Authorization header." }
```

---

## `POST /api/salary/calculate`

Server-side validation endpoint to double-check client calculations.

### Request

```json
{
  "baseSalary": 1770,
  "attendanceBonus": 200,
  "records": [
    { "dayType": "NORMAL_WORK_DAY", "hoursWorked": 10 },
    { "dayType": "REST_DAY", "hoursWorked": 6 }
  ]
}
```

Rules:
1. `baseSalary` must be numeric.
2. `records` must be an array; each record requires `dayType` (string) and `hoursWorked` (number).

### Response – 202 (placeholder)

```json
{
  "message": "Salary calculation service placeholder",
  "received": { ...payload }
}
```

### Response – 400 (validation)

```json
{
  "error": "INVALID_RECORD",
  "message": "Each record requires dayType (string) and hoursWorked (number)."
}
```

---

## Supabase Helpers

- Database operations live in `src/services/supabase/*`. Every function calls `getSupabaseClient()` and must scope queries by `employee_id`.
- OCR uploads go through `uploadImageToSupabase` which now auto-compresses files >1.5MB before validating against the 5MB limit.
