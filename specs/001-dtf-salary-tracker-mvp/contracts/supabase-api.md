# Supabase API Reference

**Database**: PostgreSQL (auto-generated REST API)
**Client**: `@supabase/supabase-js`
**Authentication**: JWT-based Row Level Security (RLS)

---

## Overview

Supabase provides auto-generated REST API for all database tables.
This document covers common CRUD operations for the DTF Salary Tracker.

**Base URL**: `https://[project-ref].supabase.co/rest/v1`
**Headers**:
- `apikey`: Supabase anon key
- `Authorization`: `Bearer [user-jwt-token]`

---

## Authentication

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
await supabase.auth.signOut();
```

---

## Employees API

### Get Current User Profile

```typescript
const { data, error } = await supabase
  .from('employees')
  .select('*')
  .eq('id', supabase.auth.user().id)
  .single();
```

### Update Profile

```typescript
const { data, error } = await supabase
  .from('employees')
  .update({
    name: 'Updated Name',
    base_salary: 1800.00,
    work_schedule_type: 'SIX_DAY',
  })
  .eq('id', userId);
```

---

## Schedules API

### Get Monthly Schedule

```typescript
const { data, error } = await supabase
  .from('schedules')
  .select('*')
  .eq('employee_id', userId)
  .eq('month', '2025-10')
  .single();

// Access schedule data
if (data) {
  const oct1Schedule = data.schedule_data['2025-10-01'];
  console.log(oct1Schedule.type); // "work"
  console.log(oct1Schedule.plannedStartTime); // "10:00"
}
```

### Create/Update Schedule

```typescript
const scheduleData = {
  employee_id: userId,
  month: '2025-10',
  original_image_url: 'https://storage.supabase.co/...',
  recognition_accuracy: 0.95,
  recognition_method: 'GPT4_VISION',
  schedule_data: {
    '2025-10-01': {
      type: 'work',
      plannedStartTime: '10:00',
      plannedEndTime: null,
      isStatutoryRestDay: false,
      notes: '',
      isConfirmed: true,
    },
    '2025-10-02': {
      type: 'rest',
      plannedStartTime: null,
      plannedEndTime: null,
      isStatutoryRestDay: true,
      notes: 'REST',
      isConfirmed: true,
    },
    // ... 其他日期
  },
};

const { data, error } = await supabase
  .from('schedules')
  .upsert(scheduleData, { onConflict: 'employee_id,month' });
```

### List All Schedules (for multi-month view)

```typescript
const { data, error } = await supabase
  .from('schedules')
  .select('month, recognition_accuracy, imported_at')
  .eq('employee_id', userId)
  .order('month', { ascending: false });
```

---

## Time Records API

### Get Daily Timecard

```typescript
const { data, error } = await supabase
  .from('time_records')
  .select('*')
  .eq('employee_id', userId)
  .eq('date', '2025-10-15')
  .maybeSingle(); // May not exist yet
```

### Create Timecard Entry

```typescript
const { data, error } = await supabase
  .from('time_records')
  .insert({
    employee_id: userId,
    date: '2025-10-15',
    day_type: 'NORMAL_WORK_DAY',
    actual_start_time: '09:55',
    actual_end_time: '19:30',
    rest_hours: 1.0,
    hours_worked: 8.58,
    base_pay: 0,
    overtime_pay: 8.07,
  });
```

### Update Timecard (modify historical record)

```typescript
const { data, error } = await supabase
  .from('time_records')
  .update({
    actual_end_time: '20:00',
    hours_worked: 9.08,
    overtime_pay: 15.05,
    is_modified: true,
  })
  .eq('employee_id', userId)
  .eq('date', '2025-10-14');
```

### Get Monthly Time Records

```typescript
const { data, error } = await supabase
  .from('time_records')
  .select('*')
  .eq('employee_id', userId)
  .gte('date', '2025-10-01')
  .lte('date', '2025-10-31')
  .order('date', { ascending: true });
```

---

## MC Records API

### Add MC Record

```typescript
const { data, error } = await supabase
  .from('mc_records')
  .insert({
    employee_id: userId,
    date: '2025-10-18',
    days: 1,
    certificate_number: 'MC202510180001',
    reason: '感冒發燒',
    is_paid: true,
  });
```

### Get Monthly MC Count

```typescript
const { data, error } = await supabase
  .from('mc_records')
  .select('days')
  .eq('employee_id', userId)
  .gte('date', '2025-10-01')
  .lte('date', '2025-10-31');

const totalMcDays = data?.reduce((sum, record) => sum + record.days, 0) || 0;
```

### Delete MC Record

```typescript
const { error } = await supabase
  .from('mc_records')
  .delete()
  .eq('id', mcRecordId);
```

---

## Monthly Salaries API

### Get/Create Monthly Salary Summary

```typescript
const { data, error } = await supabase
  .from('monthly_salaries')
  .upsert({
    employee_id: userId,
    month: '2025-10',
    base_salary: 1770.00,
    attendance_bonus: 100.00,
    overtime_pay: 580.00,
    rest_day_pay: 222.72,
    ph_pay: 148.48,
    deductions: 0,
    total_gross: 2821.20,
    calculation_details: {
      hourlyRate: 9.28,
      dailyRate: 88.50,
      monthlyWorkingDays: 20,
      // ... other details
    },
    status: 'PENDING',
    estimated_pay_date: '2025-11-07',
  }, { onConflict: 'employee_id,month' });
```

### Get Salary History

```typescript
const { data, error } = await supabase
  .from('monthly_salaries')
  .select('month, total_gross, status, actual_pay_date')
  .eq('employee_id', userId)
  .order('month', { ascending: false })
  .limit(12);
```

---

## Storage API (Schedule Images)

### Upload Schedule Image

```typescript
const file = event.target.files[0]; // From file input

const fileName = `${userId}/${month}_schedule.jpg`;

const { data, error } = await supabase.storage
  .from('schedule-images')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('schedule-images')
  .getPublicUrl(fileName);
```

### Download Image

```typescript
const { data, error } = await supabase.storage
  .from('schedule-images')
  .download(`${userId}/${month}_schedule.jpg`);

// Create blob URL for display
const url = URL.createObjectURL(data);
```

---

## Realtime Subscriptions (Optional for MVP)

### Listen to Timecard Updates

```typescript
const subscription = supabase
  .channel('timecard-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'time_records',
      filter: `employee_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Timecard changed:', payload);
      // Update UI
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

## Error Handling

```typescript
const { data, error } = await supabase
  .from('employees')
  .select('*');

if (error) {
  // RLS violation
  if (error.code === 'PGRST301') {
    console.error('Unauthorized access');
  }
  // Unique constraint violation
  if (error.code === '23505') {
    console.error('Record already exists');
  }
  // Generic error
  console.error('Supabase error:', error.message);
}
```

---

## Best Practices

1. **Use RLS**: All tables have RLS enabled, always use authenticated requests
2. **Batch Operations**: Use `upsert()` for create-or-update operations
3. **Selective Queries**: Use `.select()` to fetch only needed columns
4. **Pagination**: Use `.range()` for large result sets
5. **Error Handling**: Always check `error` object before using `data`
6. **Offline**: Cache frequently accessed data in LocalStorage

---

## TypeScript Types

Generate types from Supabase schema:

```bash
npx supabase gen types typescript --project-id [project-ref] > src/types/supabase.ts
```

Usage:

```typescript
import { Database } from './types/supabase';

type Employee = Database['public']['Tables']['employees']['Row'];
type Schedule = Database['public']['Tables']['schedules']['Row'];
```
