# Tasks: DTF工资追踪器 MVP

**Input**: Design documents from `/specs/001-dtf-salary-tracker-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 本项目需要Unit Tests (TDD for薪资计算引擎) + Integration Tests,但不包含E2E Tests (延迟至Post-MVP)

**Organization**: 任务按用户故事组织,每个故事可独立实现和测试

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: 可并行执行 (不同文件,无依赖)
- **[Story]**: 所属用户故事 (US1, US2, US3...)
- 所有任务包含精确文件路径

---

## Phase 1: Setup (项目初始化)

**Purpose**: 搭建基础项目结构和工具链

- [X] T001 创建Vite + React + TypeScript项目结构 (根据plan.md Project Structure)
- [X] T002 安装核心依赖: react@19.1.1, vite, typescript, tailwindcss, zustand, react-router-dom@6
- [X] T003 [P] 安装Supabase依赖: @supabase/supabase-js, @supabase/auth-helpers-react
- [X] T004 [P] 安装OCR依赖: openai (用于serverless), tesseract.js (fallback)
- [X] T005 [P] 安装测试依赖: vitest, @testing-library/react, @testing-library/jest-dom, msw
- [X] T006 配置Tailwind CSS (tailwind.config.js + postcss.config.js)
- [X] T007 [P] 配置Vitest (vitest.config.ts + tests setup)
- [X] T008 [P] 配置TypeScript (tsconfig.json, strictNullChecks, paths aliases)
- [X] T009 创建src/目录结构: components/, pages/, services/, hooks/, store/, types/, utils/, config/
- [X] T010 [P] 创建api/目录结构: ocr/recognize.ts, salary/calculate.ts (Vercel serverless)
- [X] T011 [P] 创建tests/目录结构: unit/, integration/
- [X] T012 配置环境变量文件 (.env.example + .env.local 模板)
- [X] T013 创建src/config/supabase.ts (Supabase client初始化)
- [X] T014 [P] 创建src/config/constants.ts (MOM常量: 190.67, 72小时上限等)
- [X] T015 [P] 创建src/config/routes.ts (路由定义配置)

---

## Phase 2: Foundational (阻塞性前置任务)

**Purpose**: 所有用户故事依赖的核心基础设施

**⚠️ CRITICAL**: 此阶段必须完成后才能开始任何用户故事

### Database & Auth

- [X] T016 执行Supabase数据库迁移 (基于data-model.md DDL: employees, schedules, time_records, mc_records, monthly_salaries)
- [X] T017 创建Supabase Storage bucket: schedule-images (public, 5MB limit)
- [X] T018 配置Supabase RLS policies (data-model.md中的策略)
- [X] T019 [P] 生成TypeScript types from Supabase schema (npx supabase gen types) → src/types/supabase.ts

### Core Types & Utilities

- [X] T020 [P] 创建src/types/employee.ts (Employee, WorkScheduleType enums)
- [X] T021 [P] 创建src/types/schedule.ts (Schedule, ScheduleType, DaySchedule interfaces)
- [X] T022 [P] 创建src/types/timecard.ts (TimeRecord, DayType interfaces)
- [X] T023 [P] 创建src/types/salary.ts (SalaryResult, PayComponents, CalculationDetails interfaces)
- [X] T024 [P] 创建src/types/compliance.ts (ComplianceRule, RuleSet interfaces - Optional for MVP)
- [X] T025 实现src/utils/dateUtils.ts (calculateWorkingDays, isWorkingDay, 基于工作制度动态计算月工作日数)
- [X] T026 [P] 实现src/utils/validation.ts (Zod schemas for form validation)
- [X] T027 [P] 实现src/utils/formatting.ts (formatCurrency, formatTime, formatDate helpers)

### Salary Calculation Engine (TDD - CRITICAL)

**⚠️ 必须先写测试,确保FAIL,再实现代码**

- [X] T028 编写tests/unit/salary/momCompliance.test.ts (MOM法规基础计算测试)
  * 时薪计算: baseSalary $1770 / 190.67 = $9.28
  * 日薪计算: baseSalary $1770 / 当月工作日数（5天制11月20天 = $88.50）
  * 正常OT: 工作10h, 正常8h → 2h × $9.28 × 1.5 = $27.84

- [X] T029 编写tests/unit/salary/restDayPay.test.ts (REST DAY计算测试，符合Constitution v1.1.0)
  * 法定休息日-雇主要求-3h工作 → 1日薪 ($88.50)
  * 法定休息日-雇主要求-6h工作 → 2日薪 ($177.00)
  * 法定休息日-雇主要求-10h工作（正常8h） → 2日薪 + 2h×1.5 OT ($177.00 + $27.84 = $204.84)
  * 法定休息日-员工要求-3h工作 → 0.5日薪 ($44.25)
  * 法定休息日-员工要求-6h工作 → 1日薪 ($88.50)
  * 法定休息日-员工要求-10h工作 → 1日薪 + 2h×1.5 OT ($88.50 + $27.84 = $116.34)
  * 非法定休息日-10h工作 → 2h×1.5 OT ($27.84)

- [X] T030 编写tests/unit/salary/phPay.test.ts (PH公共假期计算测试，符合Constitution v1.1.0)
  * PH工作6h（正常8h） → 额外1日薪 ($88.50)
  * PH工作8h → 额外1日薪 ($88.50)
  * PH工作10h → 额外1日薪 + 2h×1.5 OT ($88.50 + $27.84 = $116.34)

- [X] T031 编写tests/unit/salary/calculator.test.ts (完整薪资计算引擎测试: 各种场景组合)

- [X] T032 编写tests/unit/utils/dateUtils.test.ts (工作日计算测试)
  * 5天制2025-11月 → 20天
  * 5.5天制（大小周）2025-11月 → 22天
  * 6天制2025-11月 → 25天

- [X] T033 实现src/services/salary/momCompliance.ts (MOM法规层: calculateHourlyRate, calculateDailyRate, calculateOvertimePay, calculateRestDayPay, calculatePHPay)
- [X] T034 实现src/services/salary/companyRules.ts (公司规则层: calculateAttendanceBonus based on MC days)
- [X] T035 实现src/services/salary/calculator.ts (薪资计算引擎主入口: 整合MOM + Company规则, 导出calculateDailyPay, calculateMonthlySummary)
- [X] T036 运行所有薪资测试确保100% pass (npm run test -- src/services/salary)

### State Management

- [X] T035 创建src/store/userStore.ts (Zustand: 用户profile, settings, Part IV适用性)
- [X] T036 [P] 创建src/store/scheduleStore.ts (Zustand + persist: 排班数据, 支持离线缓存)
- [X] T037 [P] 创建src/store/timecardStore.ts (Zustand: 打卡记录, 月度汇总)

### Routing & Layout

- [X] T038 配置React Router v6 (src/App.tsx: createBrowserRouter配置)
- [X] T039 创建src/pages/Root.tsx (根布局: 导航栏, 底部菜单)
- [X] T040 [P] 创建src/components/common/BottomNav.tsx (移动底部导航: Home/Calendar/Salary/Settings)

**Checkpoint**: 基础设施就绪,用户故事可并行开始

---

## Phase 3: User Story 1 - 照片上传基础 (MVP) + OCR识别 (Phase B Post-MVP)

⚠️ **OCR分阶段策略** (ME决策2025-11-06):
- **MVP (Phase A)**: 仅实现照片上传+手动输入排班
- **Post-MVP (Phase B)**: 启用GPT-4 Vision OCR自动识别
- **理由**: 降低初期成本，渐进式验证，保留OCR框架便于后续集成

**MVP Goal**: 用户上传排班表图片到Supabase Storage，手动输入排班数据

**Phase B Goal**: GPT-4 Vision OCR识别，准确率≥90%，10秒内完成

**Independent Test (MVP)**: 上传真实排班表照片，照片保存成功，可全屏查看，手动输入排班后日历显示

### Implementation for User Story 1

**Backend: Upload Infrastructure (MVP)**

- [X] T041 [P] [US1-MVP] 创建api/ocr/recognize.ts框架 (仅接口定义，body抛出NotImplementedError，Phase B实现)

**Frontend: Upload Service (MVP)**

- [X] T044 [P] [US1-MVP] 创建src/services/supabase/uploadImage.ts (上传图片到Supabase Storage，返回public URL)

**⏸️ Phase B: OCR Implementation (Post-MVP，延后)**

- [ ] T041B [Phase B] 实现api/ocr/recognize.ts body (GPT-4 Vision API调用, prompt engineering)
- [ ] T042B [Phase B] 实现OCR prompt构建逻辑 (结构化prompt + JSON schema)
- [ ] T043B [Phase B] 实现OCR结果验证 (validateOCRResult: 员工姓名、日期完整性、type枚举)
- [ ] T044B [Phase B] 创建src/services/ocr/visionOCR.ts (调用api/ocr/recognize)
- [ ] T045B [Phase B] 创建src/services/ocr/tesseractOCR.ts (Tesseract.js fallback)
- [X] T046 [US1-MVP] 创建src/services/supabase/storage.ts (封装Supabase Storage操作: uploadScheduleImage, downloadImage, getPublicUrl)
- [X] T047 [US1-MVP] 创建src/services/supabase/database.ts (封装schedule相关数据库操作: upsertSchedule, getSchedule, updateScheduleDay)

**Frontend: UI Components (MVP)**

- [X] T048 [P] [US1-MVP] 创建src/pages/ScheduleImport.tsx (照片上传页面: 上传→预览→跳转手动输入)
- [X] T049 [P] [US1-MVP] 创建src/components/upload/ImageUpload.tsx (支持拍照/相册/拖拽上传, 5MB限制, 上传进度显示)
- [X] T050 [P] [US1-MVP] 创建src/components/schedule/ManualScheduleForm.tsx (手动输入排班表单: 逐日输入状态/时间, 批量复制功能)
- [X] T051 [P] [US1-MVP] 创建src/components/calendar/ScheduleImageViewer.tsx (全屏查看上传的排班表: 缩放/拖动/下载)
- [X] T052 [US1-MVP] 创建src/hooks/useUpload.ts (照片上传hook: 上传图片→保存URL→跳转手动输入)

**⏸️ Phase B: OCR UI Components (Post-MVP，延后)**

- [ ] T050B [Phase B] 创建src/components/ocr/RecognitionResult.tsx (OCR识别结果展示)
- [ ] T051B [Phase B] 创建src/components/ocr/ScheduleConfirmation.tsx (OCR结果修正界面)
- [ ] T052B [Phase B] 更新useUpload.ts添加OCR调用逻辑
- [ ] T053B [Phase B] 添加法定Rest Day智能标记提示 (FR-010a)

**Integration (MVP)**

- [X] T054 [US1-MVP] 整合ScheduleImport页面与React Router (添加/schedule/import路由)
- [X] T055 [US1-MVP] 添加上传loading状态和错误处理 (5MB超限提示, 网络失败重试)
- [X] T056 [US1-MVP] 实现上传成功后跳转手动输入流程 (显示提示"未来版本将支持自动识别")

**⏸️ Phase B: OCR Integration (Post-MVP，延后)**

- [ ] T054B [Phase B] 实现OCR识别失败fallback流程 (准确率<90% → 提示重拍或手动输入)
- [ ] T055B [Phase B] 添加OCR loading状态 (10秒超时提示, GPT-4 API失败切换Tesseract)
- [ ] T129B [Phase B] 使用30-50张真实排班表测试OCR准确率 (准确率≥90%)

**Checkpoint (MVP)**: 用户能上传排班表照片,照片保存到Supabase,可全屏查看,手动输入排班后保存成功

---

## Phase 4: User Story 4 - 灵活日历视图 (Priority: P1) 🎯 MVP核心

**Goal**: 用户查看整月排班日历,不同状态用颜色/图标标记,点击查看详情,可全屏查看原始排班表图片

**Independent Test**: 导入10月排班后,日历显示30天排班,工作日🕙蓝色、REST🔴红色、OFF🟠橙色,点击任意日期显示详情弹窗

**Note**: US4在US1后立即实现,因为日历是验证OCR结果的主要界面

### Implementation for User Story 4

**UI Components**

- [X] T057 [P] [US4] 创建src/components/calendar/MonthCalendar.tsx (月度日历网格: Sun-Sat格式,当月天数动态计算)
- [X] T058 [P] [US4] 创建src/components/calendar/DayCell.tsx (单日单元格: 图标+时间+颜色标记, 基于ScheduleType渲染)
- [X] T059 [P] [US4] 创建src/components/calendar/DayDetailModal.tsx (日期详情弹窗: 日期、状态、时间、备注、法定Rest Day标记、操作按钮)
- [X] T060 [P] [US4] 创建src/components/calendar/ScheduleImageViewer.tsx (全屏查看原始排班表: 双指缩放、拖动、下载按钮)
- [X] T061 创建src/pages/Calendar.tsx (日历主页面: 月份切换、查看排班表按钮、长按快捷菜单)
- [X] T062 创建src/hooks/useSchedule.ts (排班数据hook: 从store/Supabase获取、缓存、离线支持)

**State & Logic**

- [X] T063 [US4] 在src/components/calendar/MonthCalendar.tsx中实现月份切换逻辑 (左右滑动或◀ ▶按钮)
- [X] T064 [US4] 在src/components/calendar/DayCell.tsx中实现长按快捷菜单 (修改排班、记录打卡、查看历史)
- [X] T065 [US4] 实现离线模式提示 (scheduleStore缓存数据可用时显示"离线模式"标记)

**Integration**

- [X] T066 [US4] 整合Calendar页面与React Router (添加/calendar/:month路由,默认当月)
- [X] T067 [US4] 整合日历与ScheduleImport (导入成功后自动跳转到当月日历)
- [X] T068 [US4] 添加"未导入排班"状态 (显示"点击导入"按钮,跳转到ScheduleImport)

**Checkpoint**: 日历完整显示排班,用户可查看详情、切换月份、查看原始图片

---

## Phase 5: User Story 2 - 每日快速打卡记录 (Priority: P1) 🎯 MVP核心

**Goal**: 用户每天下班后快速记录实际上下班时间,系统自动计算加班时长和加班费,实时更新工资预估

**Independent Test**: 打开"今日打卡",上班时间已预填(来自排班),输入下班时间19:30,系统显示总工时8.5h、加班0.5h、加班费$6.96

### Implementation for User Story 2

**Backend: Salary Calculation Serverless (Optional)**

- [ ] T069 [P] [US2] 创建api/salary/calculate.ts (Vercel serverless: 服务端薪资计算,调用calculator.ts, 用于敏感计算或离线同步)

**Frontend: Timecard Service**

- [X] T070 [P] [US2] 创建src/services/supabase/timeRecords.ts (封装time_records CRUD: createTimeRecord, updateTimeRecord, getMonthlyRecords)
- [X] T071 [US2] 创建src/hooks/useTimecard.ts (打卡记录hook: 实时计算、保存到DB、更新store)

**UI Components**

- [X] T072 [P] [US2] 创建src/pages/Timecard.tsx (今日打卡主页面: 预填排班时间、输入实际时间、休息时长选择、实时计算显示)
- [X] T073 [P] [US2] 创建src/components/timecard/TimeInput.tsx (时间输入组件: 支持12/24小时格式、快捷选择、跨日班处理)
- [X] T074 [P] [US2] 创建src/components/timecard/RestDayTimecardForm.tsx (休息日加班特殊表单: 雇主/员工要求选择、半日/全日判断提示)
- [X] T075 [P] [US2] 创建src/components/timecard/PHTimecardForm.tsx (公共假期特殊表单: 正常工时配置提示、额外1日薪说明)
- [X] T076 [P] [US2] 创建src/components/timecard/SalaryPreview.tsx (实时薪资预览: 总工时、正常工时、加班时长、加班费、MOM规则说明)

**Business Logic**

- [X] T077 [US2] 在src/pages/Timecard.tsx中实现排班时间预填逻辑 (从scheduleStore读取当日plannedStartTime)
- [X] T078 [US2] 在src/pages/Timecard.tsx中实现实时计算 (onChange时调用calculator.calculateDailyPay, 基于day_type应用不同规则)
- [X] T079 [US2] 在src/components/timecard/RestDayTimecardForm.tsx中实现MOM法定休息日判断 (检查isStatutoryRestDay, 显示强制规定提示)
- [X] T080 [US2] 实现打卡记录修改历史标记 (is_modified=true, 显示"已修改"badge)

**Integration**

- [X] T081 [US2] 整合Timecard页面与React Router (添加/timecard/:date路由,默认今天)
- [X] T082 [US2] 整合打卡与日历 (日历中点击"记录打卡"跳转到Timecard页面)
- [X] T083 [US2] 实现打卡记录保存成功后跳转到Home (更新月度工资预估卡片)

**Checkpoint**: 用户能快速记录打卡,系统准确计算加班费(工作日/休息日/公共假期不同规则),数据保存到Supabase

---

## Phase 6: User Story 3 - 实时工资预估 (Priority: P1) 🎯 MVP核心

**Goal**: 用户随时查看本月预估工资,了解基本工资+勤工奖+加班费明细,距发薪日倒计时,接近72小时上限时警告

**Independent Test**: 主界面显示工资预估卡片,总工资$2,450、构成(基本$1,770+勤工奖$100+加班费$580)、进度18/22天、发薪日还有9天

### Implementation for User Story 3

**Frontend: Salary Service**

- [X] T084 [P] [US3] 创建src/services/supabase/monthlySalaries.ts (封装monthly_salaries CRUD: upsertMonthlySummary, getMonthlySummary)
- [X] T085 [US3] 创建src/hooks/useSalary.ts (月度薪资hook: 聚合time_records+mc_records, 调用calculator.calculateMonthlySummary, 缓存到monthly_salaries)

**UI Components**

- [X] T086 [P] [US3] 创建src/pages/Home.tsx (主界面: 工资预估卡片、日历预览、快捷操作)
- [X] T087 [P] [US3] 创建src/components/salary/SalarySummaryCard.tsx (工资预估卡片: 总额、构成、进度条、发薪日倒计时)
- [X] T088 [P] [US3] 创建src/components/salary/SalaryBreakdown.tsx (工资明细展开: 基本月薪、勤工奖、加班费分类、扣款)
- [X] T089 [P] [US3] 创建src/components/salary/OvertimeWarning.tsx (加班警告: 接近72小时上限时显示)
- [X] T090 [P] [US3] 创建src/pages/Salary.tsx (薪资详情页: 完整明细、导出功能、历史对比)
- [X] T091 [P] [US3] 创建src/components/salary/SalaryDetailTable.tsx (每日明细表格: 日期、工时、加班时长、加班费、特殊状态标记)
- [X] T092 [P] [US3] 创建src/components/salary/CalculationTransparency.tsx (计算明细透明展示: 工作日数、日薪率、时薪、公式、对比错误÷26方式的差异)

**Business Logic**

- [X] T093 [US3] 在useSalary hook中实现月度汇总计算 (聚合所有time_records, 分类统计工作日/休息日/PH加班, 合并MC影响勤工奖)
- [X] T094 [US3] 在src/components/salary/SalarySummaryCard.tsx中实现实时更新逻辑 (监听timecardStore变化, 重新计算总工资)
- [X] T095 [US3] 在src/components/salary/SalarySummaryCard.tsx中实现发薪日计算 (userStore.pay_day, 每月X号, 倒计时天数)
- [X] T096 [US3] 在src/components/salary/OvertimeWarning.tsx中实现72小时上限检测 (totalOvertimeHours >= 60 显示警告)

**Export Functionality**

- [X] T097 [US3] 实现工资单导出为CSV (src/utils/exportSalary.ts: 生成CSV文件, 包含每日明细)
- [X] T098 [US3] 实现工资单导出为PDF (可选,使用jsPDF或类似库, 格式化薪资明细)

**Integration**

- [X] T099 [US3] 整合Salary页面与React Router (添加/salary路由)
- [X] T100 [US3] 整合工资预估卡片到Home页面 (主界面顶部显示)
- [X] T101 [US3] 实现打卡记录变更后自动刷新工资预估 (timecardStore listener触发useSalary重新计算)

**Checkpoint**: 用户能实时查看工资预估,准确分解构成,导出明细,系统透明展示计算过程

---

## Phase 7: User Story 5 - MC记录与勤工奖计算 (Priority: P2)

**Goal**: 用户记录MC天数,系统根据规则自动计算勤工奖影响(≤1天全额、2-3天减半、≥4天取消),工资预估实时更新

**Independent Test**: 添加MC记录(10月18日 1天),系统显示本月MC累计2天,勤工奖减半至$100,工资预估卡片自动减少$100

### Implementation for User Story 5

**Frontend: MC Service**

- [X] T102 [P] [US5] 创建src/services/supabase/mcRecords.ts (封装mc_records CRUD: createMCRecord, getMonthlyMCRecords, deleteMCRecord, getYearlyMCCount)
- [X] T103 [US5] 创建src/hooks/useMC.ts (MC记录hook: CRUD操作、月度统计、年度配额计算)

**UI Components**

- [X] T104 [P] [US5] 创建src/pages/MC.tsx (MC管理主页面: 月度统计、记录列表、年度配额进度条)
- [X] T105 [P] [US5] 创建src/components/mc/MCRecordList.tsx (MC记录列表: 日期、天数、证明编号、备注、删除按钮)
- [X] T106 [P] [US5] 创建src/components/mc/AddMCModal.tsx (添加MC弹窗: 日期选择、天数输入、证明编号、原因备注)
- [X] T107 [P] [US5] 创建src/components/mc/AttendanceBonusImpact.tsx (勤工奖影响提示: MC天数→勤工奖百分比→金额变化)
- [X] T108 [P] [US5] 创建src/components/mc/YearlyMCQuota.tsx (年度配额展示: 已用X/14天、进度条、MOM规定说明)

**Business Logic**

- [X] T109 [US5] 在src/services/salary/companyRules.ts中实现勤工奖计算规则 (calculateAttendanceBonus: MC ≤1天→100%, 2-3天→50%, ≥4天→0%)
- [X] T110 [US5] 在useMC hook中实现MC变更后触发薪资重算 (监听MC新增/删除, 调用useSalary刷新)
- [X] T111 [US5] 在src/components/mc/AddMCModal.tsx中实现删除确认对话框 (提示"删除后勤工奖将重新计算")

**Integration**

- [X] T112 [US5] 整合MC页面与React Router (添加/mc路由)
- [X] T113 [US5] 整合MC统计到工资预估卡片 (SalarySummaryCard显示勤工奖受MC影响的提示)
- [X] T114 [US5] 实现MC记录保存/删除后自动刷新工资预估

**Checkpoint**: 用户能管理MC记录,系统准确计算勤工奖影响,工资预估实时反映变化

---

## Phase 8: User Profile & Settings (跨故事通用)

**Purpose**: 用户个人信息设置,影响所有薪资计算

- [X] T115 [P] 创建src/pages/Settings.tsx (设置主页面: 基本信息、薪资信息、工作偏好)
- [X] T116 [P] 创建src/components/settings/BasicInfoForm.tsx (基本信息表单: 姓名、员工ID、职位、店别代码、雇佣类型)
- [X] T117 [P] 创建src/components/settings/SalaryInfoForm.tsx (薪资信息表单: 基本月薪、勤工奖、发薪日)
- [X] T118 [P] 创建src/components/settings/WorkPreferencesForm.tsx (工作偏好: 正常日工时、默认休息时长、工作制度类型)
- [X] T119 [P] 创建src/components/settings/PartIVBadge.tsx (Part IV适用状态徽章: ✓适用 / ⚠️不适用-基本模式)
- [X] T120 在src/services/supabase/database.ts中实现employees CRUD (createEmployee, updateEmployee, getEmployee)
- [X] T121 在src/components/settings/SalaryInfoForm.tsx中实现Part IV检测逻辑 (月薪变更时自动计算is_part_iv_applicable, 显示适用状态)
- [X] T122 在src/components/settings/SalaryInfoForm.tsx中实现不适用Part IV时的功能限制提示 (禁用OT/Rest Day特殊计算, 引导至基本模式)
- [X] T123 整合Settings页面与React Router (添加/settings路由)
- [X] T124 实现设置变更后刷新所有薪资计算 (监听userStore变化, 重新计算所有time_records和monthly_salaries)

---

## Phase 9: Integration Tests (跨故事验证)

**Purpose**: 验证完整用户流程和跨模块集成

- [X] T125 [P] 编写tests/integration/ocr.test.ts (OCR流程测试: 上传图片→GPT-4识别→保存到DB→日历显示)
- [X] T126 [P] 编写tests/integration/salary.test.ts (薪资流程测试: 导入排班→记录打卡→计算月度工资→验证准确性)
- [X] T127 [P] 编写tests/integration/mc-impact.test.ts (MC影响测试: 添加MC→勤工奖变化→工资预估更新)
- [X] T128 运行所有集成测试 (npm run test:integration)
- [ ] T129 使用真实排班表测试OCR准确率 (至少10张图片, 准确率≥90%; 运行手册见 docs/ocr-accuracy-report.md)
- [ ] T130 使用真实工资单对比验证计算准确性 (至少5个用户样本, 误差<$10; 运行手册见 docs/salary-verification-report.md)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 优化体验、性能和安全性

### UI/UX Polish

- [X] T131 [P] 创建src/components/common/Loading.tsx (全局loading组件: OCR识别10秒、API调用等)
- [X] T132 [P] 创建src/components/common/ErrorBoundary.tsx (错误边界: 捕获React错误, 显示友好提示)
- [X] T133 [P] 创建src/components/common/Toast.tsx (Toast通知: 保存成功、错误提示、警告)
- [X] T134 添加移动端触摸优化 (长按菜单、滑动切换月份、双指缩放图片)
- [X] T135 [G1-简化MVP] 禁用离线编辑功能 (网络断开时disable保存按钮, 显示"需要网络连接"提示；离线查看已缓存排班保留)

### Performance Optimization

- [ ] T136 [U1-DEFERRED Post-MVP] 实现日历组件虚拟滚动 (MVP仅1个月30天，无需虚拟滚动；未来多月查看时添加)
- [X] T137 [P] [U1-KEEP] 实现薪资计算结果缓存 (monthly_salaries表存储, 避免重复计算；关联FR-026实时计算优化)
- [X] T138 [P] 优化Supabase查询 (添加索引、选择性查询、批量操作)
- [X] T139 添加图片压缩 (上传前压缩排班表图片, 确保<5MB, 优化加载速度)
- [ ] T140 [U1-DEFERRED Post-MVP] 实现代码分割 (仅当FCP>2s时添加；先测后优化)
- [X] T140a [G5-简化MVP] 添加Console性能日志 (useSalary hook添加console.time()监控计算时长, 对应SC-008)

### Security & Compliance

- [X] T141 [P] 审查所有RLS policies (确保用户只能访问自己的数据)
- [X] T142 [P] 审查API endpoints安全性 (验证JWT token, 输入验证, rate limiting)
- [X] T143 [P] 添加敏感数据加密 (确保Supabase at-rest encryption启用, HTTPS传输)
- [X] T144 [G2-手动验证MVP] 添加PDPA合规验证清单到quickstart.md (Supabase项目region验证步骤+截图说明；自动化脚本延后Post-MVP)

### Documentation & Testing

- [X] T145 [P] 更新quickstart.md (验证所有安装步骤, 添加troubleshooting)
- [X] T146 [P] 创建docs/salary-calculation-examples.md (详细计算示例: 工作日/休息日/PH各种场景)
- [X] T147 [P] 创建docs/api-reference.md (OCR/Salary serverless functions API文档)
- [X] T148 运行完整测试套件 (npm run test + npm run test:integration)
- [ ] T149 手动测试关键流程 (iOS Safari + Android Chrome, 移动端体验; 记录表见 docs/manual-qa-report.md)
- [ ] T150 运行性能测试 (FCP<2s, 日历切换<500ms, 薪资计算<100ms; 记录表见 docs/performance-report.md)

### Deployment Preparation

- [ ] T151 配置Vercel生产环境变量 (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY; 详见 docs/deployment/vercel-env.md)
- [X] T152 创建Vercel部署配置 (vercel.json: 路由、serverless functions配置 ✅ 已提交)
- [ ] T153 执行首次部署到Vercel (npx vercel --prod; 步骤见 docs/deployment/deploy-checklist.md)
- [ ] T154 验证生产环境功能 (OCR、薪资计算、Supabase连接; 记录结果于 docs/deployment/deploy-checklist.md)
- [ ] T155 配置自定义域名 (可选, 如dtf-salary.vercel.app; 说明见 docs/deployment/deploy-checklist.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 立即开始
- **Foundational (Phase 2)**: 依赖Setup完成 - 阻塞所有用户故事
- **User Stories (Phase 3-7)**: 全部依赖Foundational完成后才能开始
  - US1 (拍照导入) → US4 (日历) → US2 (打卡) → US3 (工资) → US5 (MC) 建议顺序
  - 或 US1+US4 并行 (同一开发者可连续做), 然后US2+US3 并行
- **Settings (Phase 8)**: 可与US1-US5并行开始,但需在测试前完成
- **Integration Tests (Phase 9)**: 依赖所有用户故事完成
- **Polish (Phase 10)**: 依赖核心功能完成

### User Story Dependencies

- **US1 (拍照导入)**: Foundational完成后可立即开始 - 无其他故事依赖
- **US4 (日历)**: 强依赖US1 (需要排班数据显示) - 建议US1完成后立即做
- **US2 (打卡)**: 依赖US1+US4 (需要排班数据预填) - 薪资计算引擎(Foundational)必须完成
- **US3 (工资)**: 依赖US2 (需要打卡数据) - 可与US2并行开发UI,集成时需US2完成
- **US5 (MC)**: 依赖薪资计算引擎(Foundational) - 可与US2/US3并行开发

### Critical Path (最短MVP路径)

```
Setup (T001-T015)
  ↓
Foundational (T016-T040, 必须包含T028-T034薪资测试+实现)
  ↓
US1 拍照导入 (T041-T056)
  ↓
US4 日历 (T057-T068)
  ↓
US2 打卡 (T069-T083)
  ↓
US3 工资 (T084-T101)
  ↓
Settings (T115-T124)
  ↓
Integration Tests (T125-T130)
  ↓
Deployment (T151-T155)
```

**预估时间**: 3-4週 (单开发者, 每天8小时)

### Parallel Opportunities

**Setup阶段可并行**:
- T003 (Supabase) + T004 (OCR) + T005 (测试) + T007 (Vitest) + T008 (TypeScript) + T010 (api/) + T011 (tests/) + T014 (constants) + T015 (routes)

**Foundational阶段可并行**:
- T019 (types生成) 独立
- T020-T024 (所有types) 并行
- T025-T027 (所有utils) 并行
- T028-T030 (所有测试编写) 并行, 然后T031-T034 (实现+验证) 顺序
- T035-T037 (所有stores) 并行
- T040 (BottomNav) 与T038-T039并行

**US1内可并行**:
- T041-T043 (backend) 独立
- T044 + T045 (OCR services) 并行
- T048-T051 (所有UI组件) 并行

**US4内可并行**:
- T057-T060 (所有calendar组件) 并行

**US2内可并行**:
- T069 (backend) 独立
- T070 + T071 并行
- T072-T076 (所有UI组件) 并行

**US3内可并行**:
- T084 + T085 并行
- T086-T092 (所有UI组件) 并行

**US5内可并行**:
- T102 + T103 并行
- T104-T108 (所有UI组件) 并行

**Settings可并行**:
- T115-T119 (所有UI组件) 并行

**Polish阶段可并行**:
- T131-T133 (通用组件) 并行
- T136-T140 (性能优化) 并行
- T141-T144 (安全审查) 并行
- T145-T147 (文档) 并行

---

## Parallel Example: Foundational Phase Types

```bash
# 可同时启动5个并行任务:
Task: "创建src/types/employee.ts"
Task: "创建src/types/schedule.ts"
Task: "创建src/types/timecard.ts"
Task: "创建src/types/salary.ts"
Task: "创建src/types/compliance.ts"
```

---

## Implementation Strategy

### MVP First (仅US1+US4+US2+US3, 约2.5週)

1. Complete Phase 1: Setup (1天)
2. Complete Phase 2: Foundational (3-4天, 重点TDD薪资引擎)
3. Complete Phase 3: US1 拍照导入 (3天)
4. Complete Phase 4: US4 日历 (2天)
5. Complete Phase 5: US2 打卡 (2-3天)
6. Complete Phase 6: US3 工资 (2天)
7. Complete Phase 8: Settings (1天, 仅核心设置)
8. Complete Phase 9: Integration Tests (1天)
9. **STOP and VALIDATE**: 手动测试完整流程, 验证准确率
10. Deploy to Vercel (0.5天)

**Total**: ~18天 (约2.5週)

### Incremental Delivery (建议策略)

1. **Week 1**: Setup + Foundational + US1 (拍照导入) → 可演示OCR识别
2. **Week 2**: US4 (日历) + US2 (打卡) → 可演示完整打卡流程
3. **Week 3**: US3 (工资) + Settings + Tests → 完整MVP可用
4. **Week 4**: US5 (MC) + Polish → 增强版MVP

每周结束时都有可演示的增量功能。

---

## Notes

- **Tests are CRITICAL for salary calculation**: T028-T034 (TDD for薪资引擎) 必须100% pass
- **OCR准确率验证**: T129 使用至少10张真实排班表测试, 准确率必须≥90%
- **薪资计算准确性验证**: T130 与真实工资单对比, 误差必须<$10
- **Part IV合规**: T121-T122 确保超过薪资门槛的用户被正确限制功能
- **日薪计算CRITICAL**: 必须动态计算工作日数 (FR-027b), 严禁使用固定÷26
- **休息日计薪**: 必须区分法定/非法定 (isStatutoryRestDay), 应用不同规则
- **Commit策略**: 每完成一个任务或逻辑组提交一次
- **Checkpoint验证**: 每个Phase结束时运行相关测试, 确保功能正常
- **避免**: 模糊任务描述、同文件并行冲突、跨故事依赖破坏独立性

---

## Task Summary

- **Total Tasks**: 155
- **Setup**: 15 tasks
- **Foundational**: 25 tasks (包含CRITICAL薪资引擎TDD)
- **US1 拍照导入**: 16 tasks
- **US4 日历**: 12 tasks
- **US2 打卡**: 15 tasks
- **US3 工资**: 18 tasks
- **US5 MC**: 13 tasks
- **Settings**: 10 tasks
- **Integration Tests**: 6 tasks
- **Polish**: 25 tasks

**Parallel Opportunities**: ~60 tasks 可并行执行 (标记[P])

**Suggested MVP Scope**: Setup + Foundational + US1 + US4 + US2 + US3 + Settings (基础) + Integration Tests = ~100 tasks

**Independent Test Criteria**:
- US1: OCR识别准确率≥90%, 10秒内完成
- US4: 日历完整显示30天排班, 点击查看详情正常
- US2: 打卡记录保存成功, 加班费计算准确
- US3: 工资预估实时更新, 与实际工资单误差<$10
- US5: MC记录影响勤工奖, 工资预估自动调整
