# Research Document: DTF工资追踪器 MVP

**Feature**: DTF Salary Tracker MVP
**Date**: 2025-11-05
**Purpose**: 解決Technical Context中的NEEDS CLARIFICATION項目,為實施做技術決策

---

## 1. Routing Library: React Router vs TanStack Router

### Decision: **React Router v6**

### Rationale:
1. **生態系統成熟度**: React Router是React生態中最廣泛使用的路由解決方案,社群支持強大
2. **AI程式碼生成友好**: Claude/Cursor對React Router的代碼生成更準確,文檔豐富
3. **學習曲線低**: 對於快速迭代的MVP,使用熟悉的工具可減少開發時間
4. **功能充足**: v6版本已支持loader/action pattern,滿足數據預載需求

### Alternatives Considered:

**TanStack Router**:
- **優點**: 類型安全更強,現代化API設計,與TanStack Query深度整合
- **缺點**:
  - 較新的專案,生態系統相對較小
  - AI code generation的訓練數據較少,可能生成錯誤代碼
  - MVP階段不需要極致的類型安全(薪資計算已用TypeScript保證)
- **為何拒絕**: 在MVP階段優先開發速度和穩定性,高級類型安全可在V2.0考慮

**Wouter** (輕量級替代):
- **優點**: 只有1.3KB,極輕量
- **缺點**: 功能簡陋,缺少嵌套路由、loader等現代特性
- **為何拒絕**: 我們需要嵌套路由(Settings下有多個子頁面)和數據預載功能

### Implementation Notes:
```typescript
// Router 配置示例
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: 'schedule/import', element: <ScheduleImport /> },
      { path: 'calendar/:month', element: <Calendar /> },
      { path: 'timecard/:date', element: <Timecard /> },
      { path: 'salary', element: <Salary /> },
      { path: 'mc', element: <MC /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
```

---

## 2. State Management: Zustand vs Jotai

### Decision: **Zustand**

### Rationale:
1. **簡單易用**: Zustand API極簡,使用hooks風格,學習曲線低
2. **無Provider地獄**: 不需要Context Provider包裹,直接import store即可使用
3. **DevTools支持**: 良好的Redux DevTools整合,便於調試
4. **離線優先友好**: 易於與LocalStorage整合實現離線緩存
5. **性能優秀**: 只re-render訂閱的組件,避免不必要的渲染

### Alternatives Considered:

**Jotai** (Atomic state):
- **優點**:
  - 原子化狀態設計,避免大型store
  - TypeScript支持更好
  - 更細粒度的訂閱控制
- **缺點**:
  - 較新的專案,AI生成代碼可能不準確
  - Atomic模式對簡單CRUD場景過度設計
  - MVP階段不需要極度細粒度的狀態管理
- **為何拒絕**: MVP的狀態管理需求簡單(用戶、排班、打卡、薪資),Zustand的簡單slice模式已足夠

**Redux Toolkit**:
- **優點**: 行業標準,工具鏈完善
- **缺點**:
  - Boilerplate代碼多(action/reducer/selector)
  - 對MVP過於重量級
  - 學習曲線陡峭
- **為何拒絕**: MVP不需要Redux的複雜度,Zustand可滿足所有需求且代碼量更少

**React Context + useReducer**:
- **優點**: 內建解決方案,無需額外依賴
- **缺點**:
  - Provider地獄
  - 性能問題(整個Context重新渲染)
  - 無DevTools支持
- **為何拒絕**: 性能不足以支持頻繁更新的薪資計算UI

### Implementation Notes:
```typescript
// Zustand store 示例
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface ScheduleStore {
  schedules: Map<string, Schedule>;
  setSchedule: (month: string, schedule: Schedule) => void;
  getSchedule: (month: string) => Schedule | undefined;
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      schedules: new Map(),
      setSchedule: (month, schedule) => set((state) => {
        const newSchedules = new Map(state.schedules);
        newSchedules.set(month, schedule);
        return { schedules: newSchedules };
      }),
      getSchedule: (month) => get().schedules.get(month),
    }),
    {
      name: 'schedule-storage', // LocalStorage key
    }
  )
);
```

---

## 3. E2E Testing in MVP Phase

### Decision: **延遲至Post-MVP,僅保留Unit + Integration Tests**

### Rationale:
1. **MVP優先驗證核心假設**: 30個用戶的MVP階段,手動測試關鍵流程更高效
2. **開發速度優先**: E2E測試編寫和維護成本高,會延遲MVP上線時間
3. **測試金字塔原則**: Unit tests(薪資計算) + Integration tests(OCR流程)已覆蓋核心邏輯
4. **Constitution compliance**: TDD要求僅適用於critical features(薪資計算),E2E非必須

### Testing Strategy for MVP:

**必須實現** (Constitution要求):
- ✅ **Unit Tests** (Vitest):
  - `services/salary/calculator.test.ts` - 薪資計算引擎
  - `services/salary/momCompliance.test.ts` - MOM法規計算
  - `services/salary/companyRules.test.ts` - 公司規則
  - `utils/dateUtils.test.ts` - 日期工作日計算

- ✅ **Integration Tests** (Vitest + MSW):
  - `tests/integration/ocr.test.ts` - OCR流程: upload → GPT-4 Vision → database
  - `tests/integration/salary.test.ts` - 薪資流程: schedule → timecard → calculation

**延遲至Post-MVP**:
- ⏸️ **E2E Tests** (Playwright):
  - 等待用戶反饋確認核心流程穩定後再投入
  - V1.1版本時添加critical path E2E (OCR import + Salary calc)

**手動測試計劃** (MVP階段):
- 使用真實的鼎泰豐排班表測試OCR(至少10張)
- 與實際工資單對比驗證計算準確性(至少5個用戶樣本)
- 移動設備測試(iOS Safari, Android Chrome)

### Alternatives Considered:

**實施E2E from start**:
- **優點**: 更高的信心,自動化回歸測試
- **缺點**:
  - 開發時間增加1-2週
  - MVP階段UI變動頻繁,E2E test維護成本高
  - 30用戶規模下ROI低
- **為何拒絕**: 違反MVP-First原則,延遲驗證核心假設

**僅手動測試,無自動化測試**:
- **優點**: 最快上線
- **缺點**: 違反Constitution的TDD要求,薪資計算錯誤風險高
- **為何拒絕**: User Data Accuracy是non-negotiable原則

### Post-MVP E2E Roadmap:
```typescript
// 未來E2E測試範例 (V1.1+)
import { test, expect } from '@playwright/test';

test('OCR import flow', async ({ page }) => {
  await page.goto('/schedule/import');
  await page.setInputFiles('input[type="file"]', 'test-schedule.jpg');
  await page.click('button:has-text("確認無誤,導入日曆")');
  await expect(page.locator('.calendar')).toContainText('10:00');
});
```

---

## 4. OCR Provider Strategy: GPT-4 Vision + Tesseract.js Fallback

### Decision: **主用GPT-4 Vision,Tesseract.js作為fallback**

### Rationale:
1. **準確率優先**: GPT-4 Vision對Excel表格和中文識別準確率遠超Tesseract
2. **成本可控**: MVP階段每用戶每月1次識別,成本$0.01-0.03 × 30用戶 = $0.30-0.90
3. **Fallback保證可用性**: GPT-4 Vision API故障時,Tesseract.js在瀏覽器本地運行
4. **Constitution compliance**: AI-First原則要求,識別準確率≥90%只有GPT-4 Vision能保證

### Implementation Strategy:

**Primary: GPT-4 Vision API** (via Vercel serverless function)
```typescript
// api/ocr/recognize.ts
export default async function handler(req, res) {
  const { imageUrl, userName } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: buildOCRPrompt(userName) },
        { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
      ]
    }],
    max_tokens: 2000,
    temperature: 0.1 // 低溫度提高準確性
  });

  return res.json(JSON.parse(response.choices[0].message.content));
}
```

**Fallback: Tesseract.js** (client-side)
```typescript
// services/ocr/tesseractOCR.ts
import Tesseract from 'tesseract.js';

export async function recognizeWithTesseract(imageFile: File): Promise<ScheduleData> {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'chi_sim+eng');

  // 使用正則表達式和啟發式規則解析文本
  // 注意: 準確率較低,僅作為emergency fallback
  return parseScheduleText(text);
}
```

**Fallback觸發條件**:
1. GPT-4 Vision API 5xx錯誤
2. API超時 (>15s)
3. 用戶手動選擇("使用本地識別")

### Alternatives Considered:

**僅用Tesseract.js**:
- **優點**: 完全免費,無API調用成本
- **缺點**:
  - 對Excel表格識別準確率<70%
  - 違反Constitution的90%準確率要求
  - 中文識別效果差
- **為何拒絕**: 無法達到AI-First原則的品質標準

**AWS Textract**:
- **優點**: 專為文檔識別優化,準確率高
- **缺點**:
  - 成本較高($1.50/1000頁)
  - 需要AWS帳戶設置
  - 對中文支持不如GPT-4 Vision
- **為何拒絕**: GPT-4 Vision已滿足需求且成本更低

**Google Cloud Vision API**:
- **優點**: OCR專用服務,免費額度1000次/月
- **缺點**:
  - 對複雜Excel表格的理解不如GPT-4 Vision
  - 需要額外的結構化解析邏輯
  - 無法理解"OFF/OT"等domain-specific縮寫
- **為何拒絕**: GPT-4 Vision的語言理解能力更適合解析複雜排班規則

---

## 5. Database Schema Design: Normalization vs Denormalization

### Decision: **適度非正規化,優先查詢性能**

### Rationale:
1. **查詢模式明確**: 90%查詢為"查詢某月排班+打卡記錄",join操作頻繁
2. **MVP規模小**: 30用戶 × 12個月 × 31天 ≈ 11,160筆記錄,非正規化不會造成顯著儲存浪費
3. **離線優先**: 前端需要完整的月度數據,denormalize減少前端state同步複雜度
4. **Constitution符合**: Supabase免費層50萬行,遠超MVP需求

### Schema Design:

**主要資料表**:
```sql
-- 用戶表 (高度正規化)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  employee_id VARCHAR(50),
  position VARCHAR(50),
  base_salary DECIMAL(10,2) NOT NULL,
  work_schedule_type VARCHAR(20) NOT NULL, -- FIVE_DAY, SIX_DAY, etc.
  outlet_code VARCHAR(10),
  is_workman BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 排班表 (適度非正規化 - 包含OCR元數據)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  month VARCHAR(7) NOT NULL, -- "2025-10"
  original_image_url TEXT,
  recognition_accuracy DECIMAL(3,2),
  imported_at TIMESTAMPTZ DEFAULT NOW(),

  -- 非正規化: 將每天的排班存為JSONB (避免31個join)
  schedule_data JSONB NOT NULL,
  -- 範例結構: { "2025-10-01": { "type": "work", "startTime": "10:00", "isStatutoryRestDay": false }, ... }

  UNIQUE(employee_id, month)
);

-- 打卡記錄 (正規化 - 頻繁CRUD)
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  day_type VARCHAR(30) NOT NULL, -- NORMAL_WORK_DAY, REST_DAY, PUBLIC_HOLIDAY
  actual_start_time TIME,
  actual_end_time TIME,
  rest_hours DECIMAL(3,1) DEFAULT 1.0,
  is_employer_requested BOOLEAN DEFAULT true,

  -- 計算結果快取 (非正規化 - 避免重複計算)
  hours_worked DECIMAL(4,2),
  base_pay DECIMAL(10,2),
  overtime_pay DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- MC記錄 (正規化)
CREATE TABLE mc_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  days INTEGER DEFAULT 1,
  certificate_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 薪資汇总 (高度非正規化 - 避免每次重新計算)
CREATE TABLE monthly_salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  month VARCHAR(7) NOT NULL,

  -- 直接存儲計算結果
  base_salary DECIMAL(10,2),
  attendance_bonus DECIMAL(10,2),
  overtime_pay DECIMAL(10,2),
  rest_day_pay DECIMAL(10,2),
  ph_pay DECIMAL(10,2),
  deductions DECIMAL(10,2),
  total_gross DECIMAL(10,2),

  -- 存儲完整計算明細為JSONB
  calculation_details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month)
);
```

**索引策略**:
```sql
CREATE INDEX idx_schedules_employee_month ON schedules(employee_id, month);
CREATE INDEX idx_time_records_employee_date ON time_records(employee_id, date);
CREATE INDEX idx_mc_records_employee_date ON mc_records(employee_id, date DESC);
CREATE INDEX idx_monthly_salaries_employee_month ON monthly_salaries(employee_id, month);

-- GIN index for JSONB queries
CREATE INDEX idx_schedules_schedule_data ON schedules USING GIN (schedule_data);
```

### Alternatives Considered:

**完全正規化** (每天一筆排班記錄):
- **優點**: 資料一致性最高,更新單日排班無需修改JSONB
- **缺點**:
  - 31天 × 30用戶 × 12月 = 11,160筆排班記錄
  - 查詢整月排班需要31個join或IN查詢
  - 前端需要更複雜的state管理
- **為何拒絕**: MVP階段查詢性能優先,更新頻率低(排班表月初導入1次)

**完全非正規化** (所有打卡+薪資數據存在employee表):
- **優點**: 單表查詢最快
- **缺點**:
  - 每次打卡都更新employee表,並發問題
  - JSONB過大影響查詢性能
  - 無法有效利用Postgres索引
- **為何拒絕**: 過度優化,違反數據建模基本原則

### Non-Functional Benefits:
- **離線支持**: JSONB結構可直接序列化到LocalStorage
- **API效率**: 單次查詢獲取完整月度數據
- **擴展性**: JSONB允許未來添加新字段無需ALTER TABLE

---

## 6. GPT-4 Vision Prompt Engineering

### Best Practices for Schedule OCR:

**Prompt結構**:
1. **角色定義**: "你是專門識別鼎泰豐排班表的AI助手"
2. **格式說明**: 詳細說明排班表格式(第一列姓名,後續列日期)
3. **狀態映射表**: REST/OFF/AL/OFF-OT等標記的含義
4. **輸出格式**: 指定JSON schema
5. **錯誤處理**: 要求輸出confidence和warnings

**範例Prompt** (已在spec.md中定義):
```
你是鼎泰豐排班表識別專家。

任務: 從圖片中提取員工"${userName}"的完整排班。

... (詳細格式說明) ...

返回JSON格式:
{
  "employeeName": "識別到的員工姓名",
  "recognitionConfidence": 0.95,
  "schedule": { ... }
}

type枚舉值（嚴格遵守）:
- work: 正常工作日（有時間數字）
- rest: REST休息日
...
```

**Prompt優化策略**:
- **Few-shot learning**: 在prompt中包含1-2個識別範例
- **Temperature=0.1**: 降低隨機性,提高一致性
- **detail="high"**: 使用高解析度圖片處理模式

### Validation & Error Handling:
```typescript
function validateOCRResult(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.employeeName || data.recognitionConfidence < 0.7) {
    errors.push('員工姓名識別失敗,請重新拍照');
  }

  const days = Object.keys(data.schedule).length;
  if (days < 28 || days > 31) {
    errors.push(`識別到${days}天,不符合月度範圍`);
  }

  // 驗證每個日期的type是否有效
  Object.entries(data.schedule).forEach(([date, record]) => {
    if (!VALID_SCHEDULE_TYPES.includes(record.type)) {
      errors.push(`${date}的排班類型無效: ${record.type}`);
    }
  });

  return { isValid: errors.length === 0, errors };
}
```

---

## Summary of Decisions

| Item | Decision | Key Rationale |
|------|----------|---------------|
| **Routing** | React Router v6 | 生態成熟,AI生成友好,MVP快速開發 |
| **State** | Zustand | 簡單API,無Provider地獄,離線友好 |
| **E2E Testing** | 延遲至Post-MVP | MVP優先手動測試,Unit+Integration已足夠 |
| **OCR Provider** | GPT-4 Vision + Tesseract fallback | 準確率90%+,成本可控,$0.30-0.90/月 |
| **Database** | 適度非正規化(JSONB for schedules) | 查詢性能優先,離線支持,MVP規模小 |
| **Prompt** | 結構化prompt + few-shot + low temp | 提高OCR準確率和一致性 |

**Next Steps**:
- ✅ Technical Context所有NEEDS CLARIFICATION已解決
- ➡️ 進入Phase 1: 生成data-model.md和API contracts
- ➡️ 實現薪資計算引擎的unit tests (TDD)

**Cost Impact**: 所有決策符合月度成本<$5的限制

**Timeline Impact**: 決策優化開發速度,預估可在3週內完成MVP

**Constitution Compliance**: ✅ 所有決策符合AI-First, MVP-First, Cost Optimization, User Data Accuracy原則
