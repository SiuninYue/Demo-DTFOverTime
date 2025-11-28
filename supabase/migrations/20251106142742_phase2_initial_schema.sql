-- Phase 2: Initial Supabase schema for DTF Salary Tracker

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  name varchar(100) not null,
  employee_id varchar(50),
  position varchar(50),
  base_salary decimal(10,2) not null check (base_salary > 0),
  attendance_bonus decimal(10,2) default 0 check (attendance_bonus >= 0),
  work_schedule_type varchar(20) not null default 'FIVE_DAY'
    check (work_schedule_type in ('FIVE_DAY', 'FIVE_HALF_DAY', 'SIX_DAY', 'FOUR_DAY', 'CUSTOM')),
  normal_work_hours decimal(3,1) default 8.0 check (normal_work_hours between 4 and 12),
  default_rest_hours decimal(3,1) default 1.0 check (default_rest_hours between 0 and 3),
  outlet_code varchar(10),
  is_workman boolean default true,
  pay_day integer default 7 check (pay_day between 1 and 31),
  start_date date,
  is_part_iv_applicable boolean generated always as (
    (is_workman and base_salary <= 4500) or
    ((not is_workman) and base_salary <= 2600)
  ) stored,
  calculation_mode varchar(20) default 'FULL_COMPLIANCE'
    check (calculation_mode in ('FULL_COMPLIANCE', 'BASIC_TRACKING')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  month varchar(7) not null,
  original_image_url text,
  image_file_name varchar(255),
  image_size integer check (image_size <= 5242880),
  recognition_accuracy decimal(3,2) check (recognition_accuracy between 0 and 1),
  recognition_method varchar(20) check (recognition_method in ('GPT4_VISION', 'TESSERACT', 'MANUAL')),
  schedule_data jsonb not null,
  imported_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, month)
);

create table if not exists time_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  day_type varchar(30) not null check (day_type in (
    'NORMAL_WORK_DAY', 'REST_DAY', 'PUBLIC_HOLIDAY', 'ANNUAL_LEAVE', 'MEDICAL_LEAVE', 'OFF_DAY'
  )),
  actual_start_time time,
  actual_end_time time,
  rest_hours decimal(3,1) default 1.0 check (rest_hours between 0 and 5),
  is_employer_requested boolean default true,
  spans_midnight boolean default false,
  hours_worked decimal(4,2) check (hours_worked >= 0),
  base_pay decimal(10,2) default 0 check (base_pay >= 0),
  overtime_pay decimal(10,2) default 0 check (overtime_pay >= 0),
  notes text,
  is_modified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, date),
  check ((actual_start_time is null and actual_end_time is null) or (actual_start_time is not null and actual_end_time is not null))
);

create table if not exists mc_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  days integer not null default 1 check (days > 0),
  certificate_number varchar(50),
  reason text,
  is_paid boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists monthly_salaries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  month varchar(7) not null,
  base_salary decimal(10,2) not null check (base_salary >= 0),
  attendance_bonus decimal(10,2) default 0 check (attendance_bonus >= 0),
  overtime_pay decimal(10,2) default 0 check (overtime_pay >= 0),
  rest_day_pay decimal(10,2) default 0 check (rest_day_pay >= 0),
  ph_pay decimal(10,2) default 0 check (ph_pay >= 0),
  deductions decimal(10,2) default 0 check (deductions >= 0),
  total_gross decimal(10,2) not null check (total_gross >= 0),
  calculation_details jsonb,
  status varchar(20) default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'PAID')),
  estimated_pay_date date,
  actual_pay_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, month)
);

-- Indexes
create index if not exists idx_employees_work_schedule on employees(work_schedule_type);
create index if not exists idx_schedules_employee_month on schedules(employee_id, month);
create index if not exists idx_schedules_schedule_data on schedules using gin (schedule_data);
create index if not exists idx_time_records_employee_date on time_records(employee_id, date desc);
create index if not exists idx_time_records_day_type on time_records(day_type) where day_type in ('REST_DAY', 'PUBLIC_HOLIDAY');
create index if not exists idx_mc_records_employee_date on mc_records(employee_id, date desc);
create index if not exists idx_monthly_salaries_employee_month on monthly_salaries(employee_id, month desc);
create index if not exists idx_monthly_salaries_status on monthly_salaries(status) where status = 'PENDING';
create index if not exists idx_monthly_salaries_calculation_details on monthly_salaries using gin (calculation_details);

-- RLS policies
alter table employees enable row level security;
alter table schedules enable row level security;
alter table time_records enable row level security;
alter table mc_records enable row level security;
alter table monthly_salaries enable row level security;

drop policy if exists "Users can only access their own employee record" on employees;
create policy "Users can only access their own employee record"
  on employees
  using (auth.uid() = id);

drop policy if exists "Users can only access their own schedules" on schedules;
create policy "Users can only access their own schedules"
  on schedules
  using (employee_id = auth.uid());

drop policy if exists "Users can only access their own time records" on time_records;
create policy "Users can only access their own time records"
  on time_records
  using (employee_id = auth.uid());

drop policy if exists "Users can only access their own MC records" on mc_records;
create policy "Users can only access their own MC records"
  on mc_records
  using (employee_id = auth.uid());

drop policy if exists "Users can only access their own salary records" on monthly_salaries;
create policy "Users can only access their own salary records"
  on monthly_salaries
  using (employee_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit)
values ('schedule-images', 'schedule-images', true, 5242880)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;
