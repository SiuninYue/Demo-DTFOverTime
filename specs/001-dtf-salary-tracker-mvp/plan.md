# Implementation Plan: DTF工资追踪器 MVP

**Branch**: `001-dtf-salary-tracker-mvp` | **Date**: 2025-11-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dtf-salary-tracker-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**主要需求**: 為新加坡鼎泰豐輪班制員工開發工資追蹤系統,核心功能包括拍照識別排班表(OCR)、每日打卡記錄、實時工資預估(基於新加坡MOM合規計算)、MC記錄與勤工獎計算。

**技術方案**:
- 使用 GPT-4 Vision API 進行排班表OCR識別(準確率≥90%)
- React + Tailwind CSS 前端,Supabase後端(PostgreSQL + Storage)
- 實現MOM合規的雙層薪資計算引擎(法規層+公司層)
- 動態日薪計算(根據工作制度和當月工作日數)
- 移動優先設計,支持離線查看排班

## Technical Context

**Language/Version**: JavaScript (React 19.1.1) + TypeScript (for type safety in calculation engine), Node.js 18+ for serverless functions
**Primary Dependencies**:
- React 19.1.1 + Vite (build tool)
- Tailwind CSS (styling)
- Supabase JS Client (database + auth + storage)
- OpenAI SDK (GPT-4 Vision API)
- Tesseract.js (fallback OCR if GPT-4 Vision fails)
- **Routing**: React Router DOM v6 (理由: 社区成熟、文档完善、与React 19兼容)
- **State Management**: Zustand (理由: 极简API、包体积小3KB、易于测试、支持persist)

**Storage**:
- Supabase PostgreSQL (用戶數據、排班記錄、打卡記錄、MC記錄、合規規則)
- Supabase Storage (排班表圖片,每張最大5MB)
- LocalStorage (離線緩存已導入排班)

**Testing**:
- Vitest (unit tests for salary calculation engine)
- React Testing Library (component tests)
- Integration Tests (Vitest + MSW for API mocking)
- E2E Tests (Playwright) - ⏸️ Deferred to Post-MVP (手动测试足够，自动化E2E成本高)

**Target Platform**:
- Web (mobile-first responsive design, iOS/Android browsers)
- PWA capability for offline mode
- Target: iOS Safari 15+, Android Chrome 90+

**Project Type**: Web application (frontend + serverless backend functions)

**Performance Goals**:
- OCR recognition: <10s for 排班表識別 (90% within 10s)
- Page load (FCP): <2s on mobile 4G
- Salary calculation: <100ms for monthly summary
- Offline mode: 查看已導入排班 <500ms

**Constraints**:
- Monthly cost <$5 for 30 users (Supabase + Vercel free tiers)
- OCR accuracy ≥90% before launch
- Salary calculation accuracy ≥99% (validated against real payslips)
- GDPR/PDPA compliance (data stored in Singapore region)
- Offline-capable for basic features (view schedule, no network required)

**Scale/Scope**:
- MVP: 30 daily active users
- 50 screens/components (estimated)
- ~5k-10k LOC (TypeScript + React)
- Storage: ~1GB for 100 users (images + data)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. AI-First Development ✅ PASS
- **使用GPT-4 Vision OCR**: 是,用於排班表識別
- **識別準確率≥90%**: 是,已在spec.md設定成功標準(SC-001)
- **提供人工修正fallback**: 是,FR-008要求允許用戶修正識別錯誤

### II. MVP-First Mindset ✅ PASS
- **V1.0不包含**: 主管模式、VI分紅、多工作、社區功能 - 已明確排除在spec.md的"V1.0不做的功能"
- **優先級標註**: 所有User Stories已標註P1/P2
- **複雜度追蹤**: 無違規需justify

### III. Cost Optimization ✅ PASS
- **月成本<$5 (30用戶)**: 使用Supabase + Vercel免費層,GPT-4 Vision成本預估$1-5/月(spec.md SC-013)
- **無付費依賴**: 所有依賴使用免費層或開源方案

### IV. User Data Accuracy ✅ PASS
- **時薪計算**: 使用MOM標準公式 `baseSalary / 190.67` (FR-027a)
- **日薪計算**: ⚠️ **關鍵修正** - 動態計算,不使用固定÷26 (FR-027b, spec.md附錄B)
- **加班倍數**: 正確實現(工作日1.5x, 休息日分雇主/員工要求, PH額外1日薪+超時1.5x)
- **勤工獎**: MC影響規則已定義(FR-028)
- **測試覆蓋**: TDD要求用於薪資計算引擎(constitution要求)

### V. Mobile-First Design ✅ PASS
- **移動優先UI/UX**: 是,Target Platform明確為mobile browsers
- **響應式設計**: 是,使用Tailwind CSS
- **相機整合**: 是,FR-001要求支持拍照上傳
- **離線能力**: 是,FR-046要求離線查看已緩存排班
- **加載速度<2s**: 是,Performance Goals已設定

**總結**: ✅ 所有Constitution原則通過,無違規需要justify

**Constitution Version**: v1.1.0 (2025-11-06更新，MOM规则细化)
**Audit Status**: ✅ Remediation完成 (C1&C2方案A已执行)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + serverless backend)

src/
├── components/               # React components
│   ├── common/              # Shared components (buttons, inputs, etc.)
│   ├── calendar/            # Calendar view components
│   ├── ocr/                 # OCR-related components (upload, preview)
│   ├── timecard/            # Daily timecard entry components
│   ├── salary/              # Salary summary & breakdown components
│   └── mc/                  # MC record components
│
├── pages/                   # Top-level pages/routes
│   ├── Home.tsx             # Main dashboard
│   ├── ScheduleImport.tsx   # OCR upload & confirmation
│   ├── Calendar.tsx         # Monthly calendar view
│   ├── Timecard.tsx         # Daily clock-in/out
│   ├── Salary.tsx           # Salary summary
│   ├── MC.tsx               # MC management
│   └── Settings.tsx         # User settings
│
├── services/                # Business logic & API calls
│   ├── ocr/
│   │   ├── visionOCR.ts    # GPT-4 Vision integration
│   │   └── tesseractOCR.ts # Fallback OCR
│   ├── salary/
│   │   ├── calculator.ts   # MOM-compliant salary engine (TypeScript)
│   │   ├── momCompliance.ts # MOM regulations layer
│   │   └── companyRules.ts # Company-specific rules layer
│   ├── supabase/
│   │   ├── auth.ts         # Authentication
│   │   ├── database.ts     # Database queries
│   │   └── storage.ts      # Image upload/download
│   └── offline/
│       └── cache.ts        # LocalStorage caching
│
├── hooks/                   # Custom React hooks
│   ├── useSchedule.ts      # Schedule data management
│   ├── useTimecard.ts      # Timecard CRUD
│   ├── useSalary.ts        # Salary calculations
│   └── useOCR.ts           # OCR processing
│
├── store/                   # State management (Zustand/Jotai - TBD)
│   ├── userStore.ts        # User profile & settings
│   ├── scheduleStore.ts    # Schedule data
│   └── timecardStore.ts    # Timecard records
│
├── types/                   # TypeScript types
│   ├── employee.ts         # User, EmployeeInfo
│   ├── schedule.ts         # Schedule, ShiftType
│   ├── timecard.ts         # TimeRecord, DayType
│   ├── salary.ts           # SalaryResult, PayComponents
│   └── compli ance.ts      # ComplianceRule, RuleSet
│
├── utils/                   # Utility functions
│   ├── dateUtils.ts        # Date/time helpers
│   ├── validation.ts       # Form validation
│   └── formatting.ts       # Number/currency formatting
│
└── config/                  # Configuration
    ├── supabase.ts         # Supabase client config
    ├── constants.ts        # App constants (MOM values, etc.)
    └── routes.ts           # Route definitions

api/                         # Vercel serverless functions
├── ocr/
│   └── recognize.ts        # POST /api/ocr/recognize (calls GPT-4 Vision)
└── salary/
    └── calculate.ts        # POST /api/salary/calculate (server-side calculation)

tests/
├── unit/
│   ├── salary/
│   │   ├── calculator.test.ts       # Core salary calculation tests
│   │   ├── momCompliance.test.ts    # MOM regulation tests
│   │   └── companyRules.test.ts     # Company rules tests
│   └── utils/
│       └── dateUtils.test.ts
│
├── integration/
│   ├── ocr.test.ts         # OCR flow: upload → recognize → save
│   └── salary.test.ts      # Salary flow: schedule → timecard → calc
│
└── e2e/                     # Playwright E2E tests (if included in MVP)
    ├── ocr-import.spec.ts
    └── salary-calculation.spec.ts

public/
├── sample-schedule.jpg      # Example schedule for testing/demo
└── icons/                   # App icons for PWA
```

**Structure Decision**: 選擇 Web application 結構,因為:
1. 前端使用React (Vite構建)
2. 後端使用Vercel serverless functions (輕量級,只處理OCR和敏感計算)
3. 大部分邏輯在前端執行(離線能力優先)
4. Supabase提供database和storage,無需完整後端服務器

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
