# Data Model: DTF Salary Tracker MVP

**Feature**: DTF Salary Tracker MVP
**Date**: 2025-11-05
**Based on**: [spec.md](./spec.md), [research.md](./research.md)

---

## Overview

**設計原則**:
- 適度非正規化,優先查詢性能(月度排班使用JSONB存儲)
- 支持離線緩存(JSONB結構可直接序列化到LocalStorage)
- MOM合規性內建(Part IV檢測,規則引擎)
- 計算結果快取(避免重複計算薪資)

**資料庫**: Supabase PostgreSQL
**預估規模** (MVP): 30用戶 × 12月 × 31天 ≈ 11,160筆核心記錄

---

## 1. Entity: Employee (用戶)

**Purpose**: 存儲員工基本資料、薪資配置和工作制度

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Supabase auth email |
| `name` | VARCHAR(100) | NOT NULL | 員工姓名 (用於OCR匹配) |
| `employee_id` | VARCHAR(50) | | 公司員工編號 (optional) |
| `position` | VARCHAR(50) | | 職位 (e.g., "CHEF 4") |
| `base_salary` | DECIMAL(10,2) | NOT NULL | 基本月薪 (e.g., 1770.00) |
| `attendance_bonus` | DECIMAL(10,2) | DEFAULT 0 | 勤工獎金額 (e.g., 200.00) |
| `work_schedule_type` | VARCHAR(20) | NOT NULL | 工作制度: FIVE_DAY, FIVE_HALF_DAY, SIX_DAY, FOUR_DAY, CUSTOM |
| `normal_work_hours` | DECIMAL(3,1) | DEFAULT 8.0 | 正常日工時 (用於OT起算點) |
| `default_rest_hours` | DECIMAL(3,1) | DEFAULT 1.0 | 默認休息時長 |
| `outlet_code` | VARCHAR(10) | | 店別代碼 (e.g., "DTF-SG-01") |
| `is_workman` | BOOLEAN | DEFAULT true | 是否為工人 (影響Part IV判定) |
| `pay_day` | INTEGER | DEFAULT 7 | 發薪日 (每月X號) |
| `start_date` | DATE | | 入職日期 |
| `is_part_iv_applicable` | BOOLEAN | GENERATED | 自動計算: (is_workman AND salary ≤ 4500) OR (NOT is_workman AND salary ≤ 2600) |
| `calculation_mode` | VARCHAR(20) | DEFAULT 'FULL_COMPLIANCE' | FULL_COMPLIANCE / BASIC_TRACKING |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 創建時間 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新時間 |

### Calculated Fields (前端計算)

```typescript
interface EmployeeCalculated extends Employee {
  hourlyRate: number;        // baseSalary / 190.67
  currentMonthWorkingDays: number; // 基於work_schedule_type動態計算
  dailyRate: number;         // baseSalary / currentMonthWorkingDays
}
```

### SQL DDL

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  employee_id VARCHAR(50),
  position VARCHAR(50),
  base_salary DECIMAL(10,2) NOT NULL CHECK (base_salary > 0),
  attendance_bonus DECIMAL(10,2) DEFAULT 0 CHECK (attendance_bonus >= 0),
  work_schedule_type VARCHAR(20) NOT NULL DEFAULT 'FIVE_DAY'
    CHECK (work_schedule_type IN ('FIVE_DAY', 'FIVE_HALF_DAY', 'SIX_DAY', 'FOUR_DAY', 'CUSTOM')),
  normal_work_hours DECIMAL(3,1) DEFAULT 8.0 CHECK (normal_work_hours BETWEEN 4 AND 12),
  default_rest_hours DECIMAL(3,1) DEFAULT 1.0 CHECK (default_rest_hours BETWEEN 0 AND 3),
  outlet_code VARCHAR(10),
  is_workman BOOLEAN DEFAULT true,
  pay_day INTEGER DEFAULT 7 CHECK (pay_day BETWEEN 1 AND 31),
  start_date DATE,
  is_part_iv_applicable BOOLEAN GENERATED ALWAYS AS (
    (is_workman AND base_salary <= 4500) OR (NOT is_workman AND base_salary <= 2600)
  ) STORED,
  calculation_mode VARCHAR(20) DEFAULT 'FULL_COMPLIANCE'
    CHECK (calculation_mode IN ('FULL_COMPLIANCE', 'BASIC_TRACKING')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy (Supabase Row Level Security)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON employees FOR ALL
  USING (auth.uid() = id);
```

---

## 2. Entity: Schedule (排班表)

**Purpose**: 存儲月度排班資料和OCR識別元數據

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `employee_id` | UUID | FK → employees.id, NOT NULL | 所屬員工 |
| `month` | VARCHAR(7) | NOT NULL | 月份 (format: "2025-10") |
| `original_image_url` | TEXT | | 排班表原始圖片URL (Supabase Storage) |
| `image_file_name` | VARCHAR(255) | | 圖片檔名 (e.g., "排班表_2025年10月.jpg") |
| `image_size` | INTEGER | | 圖片大小 (bytes) |
| `recognition_accuracy` | DECIMAL(3,2) | CHECK (0 ≤ accuracy ≤ 1) | OCR識別準確率 (e.g., 0.92) |
| `recognition_method` | VARCHAR(20) | | GPT4_VISION / TESSERACT / MANUAL |
| `schedule_data` | JSONB | NOT NULL | 每天的排班記錄 (詳見下方schema) |
| `imported_at` | TIMESTAMPTZ | DEFAULT NOW() | 導入時間 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 創建時間 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新時間 |

**Unique Constraint**: `(employee_id, month)`

### schedule_data JSONB Schema

```typescript
type ScheduleData = {
  [date: string]: DaySchedule; // key: "2025-10-01"
};

interface DaySchedule {
  type: ScheduleType;          // work | rest | off | leave | overtime_on_off_day | training | support_in | support_out | ph | co
  plannedStartTime: string | null; // "10:00"
  plannedEndTime: string | null;   // "19:00" (兼職時提供)
  isStatutoryRestDay: boolean;     // 是否為法定每週休息日 (MOM規定)
  notes: string;                   // 備註 (e.g., "OFF/OT", "支援TCP", "AL")
  isConfirmed: boolean;            // 用戶是否已確認此日期
  targetOutlet?: string;           // 如果是support_out,目標店別代碼
  outletFullName?: string;         // 目標店別全名 (e.g., "The Centrepoint")
}

// 範例
{
  "2025-10-01": {
    "type": "work",
    "plannedStartTime": "10:00",
    "plannedEndTime": null,
    "isStatutoryRestDay": false,
    "notes": "",
    "isConfirmed": true
  },
  "2025-10-02": {
    "type": "rest",
    "plannedStartTime": null,
    "plannedEndTime": null,
    "isStatutoryRestDay": true,  // 法定休息日
    "notes": "REST",
    "isConfirmed": true
  },
  "2025-10-05": {
    "type": "overtime_on_off_day",
    "plannedStartTime": "10:00",
    "plannedEndTime": null,
    "isStatutoryRestDay": false,
    "notes": "OFF/OT - 休息日加班",
    "isConfirmed": true
  }
}
```

### SQL DDL

```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  original_image_url TEXT,
  image_file_name VARCHAR(255),
  image_size INTEGER CHECK (image_size <= 5242880), -- 5MB limit
  recognition_accuracy DECIMAL(3,2) CHECK (recognition_accuracy BETWEEN 0 AND 1),
  recognition_method VARCHAR(20) CHECK (recognition_method IN ('GPT4_VISION', 'TESSERACT', 'MANUAL')),
  schedule_data JSONB NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(employee_id, month)
);

-- Indexes
CREATE INDEX idx_schedules_employee_month ON schedules(employee_id, month);
CREATE INDEX idx_schedules_schedule_data ON schedules USING GIN (schedule_data); -- JSONB查詢優化

-- RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own schedules"
  ON schedules FOR ALL
  USING (employee_id = auth.uid());
```

---

## 3. Entity: TimeRecord (打卡記錄)

**Purpose**: 存儲每日實際打卡時間和計算結果

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `employee_id` | UUID | FK → employees.id, NOT NULL | 所屬員工 |
| `date` | DATE | NOT NULL | 日期 |
| `day_type` | VARCHAR(30) | NOT NULL | NORMAL_WORK_DAY, REST_DAY, PUBLIC_HOLIDAY, etc. |
| `actual_start_time` | TIME | | 實際上班時間 |
| `actual_end_time` | TIME | | 實際下班時間 |
| `rest_hours` | DECIMAL(3,1) | DEFAULT 1.0 | 休息時長 (小時) |
| `is_employer_requested` | BOOLEAN | DEFAULT true | 休息日加班時: 雇主要求 vs 員工要求 |
| `spans_midnight` | BOOLEAN | DEFAULT false | 跨日班標記 |
| `hours_worked` | DECIMAL(4,2) | | 實際工作時長 (快取) |
| `base_pay` | DECIMAL(10,2) | | 基礎報酬 (快取) |
| `overtime_pay` | DECIMAL(10,2) | | 加班費 (快取) |
| `notes` | TEXT | | 備註 |
| `is_modified` | BOOLEAN | DEFAULT false | 是否手動修改過 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 創建時間 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新時間 |

**Unique Constraint**: `(employee_id, date)`

### SQL DDL

```sql
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_type VARCHAR(30) NOT NULL CHECK (day_type IN (
    'NORMAL_WORK_DAY', 'REST_DAY', 'PUBLIC_HOLIDAY', 'ANNUAL_LEAVE', 'MEDICAL_LEAVE', 'OFF_DAY'
  )),
  actual_start_time TIME,
  actual_end_time TIME,
  rest_hours DECIMAL(3,1) DEFAULT 1.0 CHECK (rest_hours BETWEEN 0 AND 5),
  is_employer_requested BOOLEAN DEFAULT true,
  spans_midnight BOOLEAN DEFAULT false,
  hours_worked DECIMAL(4,2) CHECK (hours_worked >= 0),
  base_pay DECIMAL(10,2) DEFAULT 0 CHECK (base_pay >= 0),
  overtime_pay DECIMAL(10,2) DEFAULT 0 CHECK (overtime_pay >= 0),
  notes TEXT,
  is_modified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(employee_id, date),
  CHECK ((actual_start_time IS NULL AND actual_end_time IS NULL) OR (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL))
);

-- Indexes
CREATE INDEX idx_time_records_employee_date ON time_records(employee_id, date DESC);

-- RLS
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own time records"
  ON time_records FOR ALL
  USING (employee_id = auth.uid());
```

---

## 4. Entity: MCRecord (MC記錄)

**Purpose**: 存儲病假記錄,用於計算勤工獎影響

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `employee_id` | UUID | FK → employees.id, NOT NULL | 所屬員工 |
| `date` | DATE | NOT NULL | MC日期 |
| `days` | INTEGER | NOT NULL, DEFAULT 1 | MC天數 |
| `certificate_number` | VARCHAR(50) | | MC證明編號 (e.g., "MC202510180001") |
| `reason` | TEXT | | 病因/原因 |
| `is_paid` | BOOLEAN | DEFAULT true | 是否帶薪MC |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 創建時間 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新時間 |

### SQL DDL

```sql
CREATE TABLE mc_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1 CHECK (days > 0),
  certificate_number VARCHAR(50),
  reason TEXT,
  is_paid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mc_records_employee_date ON mc_records(employee_id, date DESC);

-- RLS
ALTER TABLE mc_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own MC records"
  ON mc_records FOR ALL
  USING (employee_id = auth.uid());
```

---

## 5. Entity: MonthlySalary (月度薪資匯總)

**Purpose**: 快取月度薪資計算結果,避免重複計算

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `employee_id` | UUID | FK → employees.id, NOT NULL | 所屬員工 |
| `month` | VARCHAR(7) | NOT NULL | 月份 (e.g., "2025-10") |
| `base_salary` | DECIMAL(10,2) | NOT NULL | 基本月薪 |
| `attendance_bonus` | DECIMAL(10,2) | DEFAULT 0 | 勤工獎 (受MC影響) |
| `overtime_pay` | DECIMAL(10,2) | DEFAULT 0 | 工作日加班費 |
| `rest_day_pay` | DECIMAL(10,2) | DEFAULT 0 | 休息日報酬 |
| `ph_pay` | DECIMAL(10,2) | DEFAULT 0 | 公眾假期報酬 |
| `deductions` | DECIMAL(10,2) | DEFAULT 0 | 扣款 (無薪假等) |
| `total_gross` | DECIMAL(10,2) | NOT NULL | 總工資 (稅前) |
| `calculation_details` | JSONB | | 詳細計算明細 (breakdown) |
| `status` | VARCHAR(20) | DEFAULT 'PENDING' | PENDING / CONFIRMED / PAID |
| `estimated_pay_date` | DATE | | 預計發薪日 |
| `actual_pay_date` | DATE | | 實際發薪日 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 創建時間 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新時間 |

**Unique Constraint**: `(employee_id, month)`

### calculation_details JSONB Schema

```typescript
interface CalculationDetails {
  hourlyRate: number;                  // baseSalary / 190.67
  dailyRate: number;                   // baseSalary / monthlyWorkingDays
  monthlyWorkingDays: number;          // 當月實際工作日數
  workScheduleType: string;            // 工作制度類型
  totalOvertimeHours: number;          // 總加班時數
  totalRestDayHours: number;           // 休息日工作時數
  totalPHHours: number;                // 公眾假期工作時數
  mcDays: number;                      // MC天數
  attendanceBonusImpact: {             // 勤工獎影響
    fullAmount: number;
    actualAmount: number;
    rate: number;                      // 1.0 / 0.5 / 0
    reason: string;                    // "MC ≤1天,全額" / "MC 2-3天,減半"
  };
  overtimeBreakdown: {
    workDay: { hours: number; pay: number; };
    restDay: { hours: number; pay: number; };
    publicHoliday: { hours: number; pay: number; };
  };
  complianceWarnings: string[];        // 合規警告 (e.g., "超過72小時月加班上限")
}
```

### SQL DDL

```sql
CREATE TABLE monthly_salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL CHECK (base_salary >= 0),
  attendance_bonus DECIMAL(10,2) DEFAULT 0 CHECK (attendance_bonus >= 0),
  overtime_pay DECIMAL(10,2) DEFAULT 0 CHECK (overtime_pay >= 0),
  rest_day_pay DECIMAL(10,2) DEFAULT 0 CHECK (rest_day_pay >= 0),
  ph_pay DECIMAL(10,2) DEFAULT 0 CHECK (ph_pay >= 0),
  deductions DECIMAL(10,2) DEFAULT 0 CHECK (deductions >= 0),
  total_gross DECIMAL(10,2) NOT NULL CHECK (total_gross >= 0),
  calculation_details JSONB,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'PAID')),
  estimated_pay_date DATE,
  actual_pay_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(employee_id, month)
);

-- Indexes
CREATE INDEX idx_monthly_salaries_employee_month ON monthly_salaries(employee_id, month DESC);
CREATE INDEX idx_monthly_salaries_calculation_details ON monthly_salaries USING GIN (calculation_details);

-- RLS
ALTER TABLE monthly_salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own salary records"
  ON monthly_salaries FOR ALL
  USING (employee_id = auth.uid());
```

---

## 6. Entity: ComplianceRuleSet (合規規則集) - Optional for MVP

**Purpose**: 存儲公司/店別的薪資計算規則 (可在V1.1實現)

### Fields (簡化設計)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `name` | VARCHAR(100) | 規則集名稱 (e.g., "DTF Singapore - Staff") |
| `outlet_code` | VARCHAR(10) | 適用店別 |
| `position_level` | VARCHAR(50) | 適用職等 |
| `rules` | JSONB | 規則配置 (覆寫MOM基線) |
| `created_at` | TIMESTAMPTZ | 創建時間 |

**Note**: MVP階段可hardcode公司規則在前端,V1.1再實現動態規則系統

---

## Relationships

```
employees (1) ←→ (N) schedules
employees (1) ←→ (N) time_records
employees (1) ←→ (N) mc_records
employees (1) ←→ (N) monthly_salaries
```

**Cascade Deletion**: 刪除employee時,級聯刪除所有相關記錄

---

## Indexes Summary

```sql
-- employees
CREATE INDEX idx_employees_email ON employees(email); -- 已由UNIQUE自動創建
CREATE INDEX idx_employees_work_schedule ON employees(work_schedule_type);

-- schedules
CREATE INDEX idx_schedules_employee_month ON schedules(employee_id, month);
CREATE INDEX idx_schedules_schedule_data ON schedules USING GIN (schedule_data);

-- time_records
CREATE INDEX idx_time_records_employee_date ON time_records(employee_id, date DESC);
CREATE INDEX idx_time_records_day_type ON time_records(day_type) WHERE day_type IN ('REST_DAY', 'PUBLIC_HOLIDAY');

-- mc_records
CREATE INDEX idx_mc_records_employee_date ON mc_records(employee_id, date DESC);

-- monthly_salaries
CREATE INDEX idx_monthly_salaries_employee_month ON monthly_salaries(employee_id, month DESC);
CREATE INDEX idx_monthly_salaries_status ON monthly_salaries(status) WHERE status = 'PENDING';
```

---

## Storage Estimate

**30 Users MVP**:
- employees: 30 rows × ~500 bytes = 15 KB
- schedules: 30 users × 12 months × ~10 KB (JSONB) = 3.6 MB
- time_records: 30 users × 365 days × ~200 bytes = 2.2 MB
- mc_records: 30 users × 5 MC/year × ~150 bytes = 22.5 KB
- monthly_salaries: 30 users × 12 months × ~2 KB (JSONB) = 720 KB
- schedule images: 30 users × 12 images × 500 KB = 180 MB (Supabase Storage)

**Total Database**: ~7 MB
**Total Storage**: ~187 MB

**Well within** Supabase free tier (500K rows + 1GB storage)

---

## Migration Strategy

**Initial Schema** (deployment):
```sql
-- Run migrations in order:
1. 001_create_employees.sql
2. 002_create_schedules.sql
3. 003_create_time_records.sql
4. 004_create_mc_records.sql
5. 005_create_monthly_salaries.sql
6. 006_create_rls_policies.sql
7. 007_create_indexes.sql
```

**Seed Data** (development):
```sql
-- Test employee
INSERT INTO employees (id, email, name, base_salary, work_schedule_type)
VALUES (
  'test-uuid',
  'test@example.com',
  'Test User',
  1770.00,
  'FIVE_DAY'
);
```

---

## Validation Rules (Application Layer)

```typescript
// 前端驗證規則
const validationRules = {
  employee: {
    baseSalary: z.number().min(0).max(99999),
    attendanceBonus: z.number().min(0).max(9999),
    normalWorkHours: z.number().min(4).max(12),
  },
  timeRecord: {
    restHours: z.number().min(0).max(5),
    hoursWorked: z.number().min(0).max(24),
  },
  mcRecord: {
    days: z.number().int().min(1).max(14),
  }
};
```

---

## Next Steps

- ✅ Data Model 定義完成
- ➡️ 生成 API Contracts (OpenAPI schema)
- ➡️ 實現 Supabase migrations
- ➡️ 建立 TypeScript types (從schema生成)
