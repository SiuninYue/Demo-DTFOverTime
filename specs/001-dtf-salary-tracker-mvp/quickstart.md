# Quickstart Guide: DTF Salary Tracker MVP

**Feature**: `001-dtf-salary-tracker-mvp` | **Last Updated**: 2025-11-05

快速設置開發環境並運行 DTF 工資追蹤器 MVP。

---

## Prerequisites

### System Requirements
- Node.js 18+ (推薦使用 nvm)
- pnpm 8+ (或 npm 9+)
- Git
- WSL2 (Ubuntu 22.04) if on Windows 11

### External Services
1. **Supabase Account** (免費層足夠)
   - 註冊: https://supabase.com
   - 創建新項目: `dtf-salary-tracker`
   - Region: Southeast Asia (Singapore)

2. **OpenAI Account** (用於 GPT-4 Vision OCR)
   - 註冊: https://platform.openai.com
   - 獲取 API Key (需要付費 billing)
   - 預估成本: $1-5/月 (30 用戶)

3. **Vercel Account** (免費層)
   - 註冊: https://vercel.com
   - 用於部署 serverless functions

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd DTFOverTime
git checkout 001-dtf-salary-tracker-mvp
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Environment Setup

創建 `.env.local` 文件:

```bash
cp .env.example .env.local
```

填寫環境變數:

```env
# Supabase
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]

# OpenAI (for serverless function)
OPENAI_API_KEY=sk-[your-api-key]

# Vercel (for deployment)
VERCEL_TOKEN=[your-vercel-token]
```

**獲取 Supabase Keys**:
1. 登入 Supabase Dashboard
2. 選擇項目 → Settings → API
3. 複製 `Project URL` 和 `anon public` key

---

## Database Setup

### 1. Initialize Supabase Schema

使用 Supabase SQL Editor 或本地 CLI:

```bash
# Option A: 使用 Supabase CLI (推薦)
npx supabase login
npx supabase link --project-ref [your-project-ref]
npx supabase db push

# Option B: 手動執行 SQL
# 1. 打開 Supabase Dashboard → SQL Editor
# 2. 複製 specs/001-dtf-salary-tracker-mvp/data-model.md 中的 SQL DDL
# 3. 執行所有 CREATE TABLE 和 CREATE INDEX 語句
```

### 2. Enable Row Level Security (RLS)

```sql
-- 在 Supabase SQL Editor 中執行
-- (已包含在 data-model.md 的 DDL 中)

-- 驗證 RLS 已啟用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 3. Create Storage Bucket

```sql
-- 創建 schedule-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('schedule-images', 'schedule-images', true);

-- 設置 storage policy (允許用戶上傳自己的圖片)
CREATE POLICY "Users can upload own schedule images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'schedule-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
```

### 4. Seed Test Data (Optional)

```bash
npm run db:seed
# 創建測試用戶和範例排班數據
```

---

## Development

### 1. Run Development Server

```bash
npm run dev
# 或指定端口
npm run dev -- --port 3000
```

應用會在 http://localhost:5173 啟動 (Vite 默認端口)

### 2. Run Salary Calculation Tests

```bash
# 運行所有單元測試 (包含薪資計算引擎)
npm run test

# 運行特定測試文件
npm run test -- src/services/salary/calculator.test.ts

# 運行測試並監聽變化
npm run test:watch

# 測試覆蓋率報告
npm run test:coverage
```

**關鍵測試文件**:
- `tests/unit/salary/calculator.test.ts` - 核心薪資計算邏輯
- `tests/unit/salary/momCompliance.test.ts` - MOM 合規規則
- `tests/integration/salary.test.ts` - 完整薪資計算流程

### 3. Run Serverless Functions Locally

```bash
# 使用 Vercel CLI
npx vercel dev
# Serverless functions 會在 http://localhost:3000/api 可用
```

測試 OCR endpoint:

```bash
curl -X POST http://localhost:3000/api/ocr/recognize \
  -H "Authorization: Bearer [supabase-jwt-token]" \
  -F "image=@./public/sample-schedule.jpg" \
  -F "userName=KELLY TEIN ROU YI" \
  -F "month=2025-10"
```

### 4. Type Generation

從 Supabase schema 生成 TypeScript types:

```bash
npx supabase gen types typescript --project-id [project-ref] > src/types/supabase.ts
```

---

## Testing

### Unit Tests (TDD for Salary Engine)

```bash
# 運行薪資計算引擎測試 (必須 100% pass)
npm run test -- src/services/salary

# 預期測試案例:
# ✓ 基本時薪計算 (salary / 190.67)
# ✓ 動態日薪計算 (各種工作制度 + 不同月份)
# ✓ 工作日加班 (1.5x hourly rate)
# ✓ 休息日加班 (雇主要求 vs 員工要求)
# ✓ 公眾假期加班 (1 day base + 1.5x OT)
# ✓ 勤工獎計算 (MC 影響規則)
# ✓ Part IV 不適用場景
```

### Integration Tests

```bash
# 測試完整流程: OCR → Schedule → Timecard → Salary
npm run test:integration

# 預期案例:
# ✓ OCR 導入排班表
# ✓ 用戶修正識別錯誤
# ✓ 每日打卡記錄
# ✓ 實時薪資計算
# ✓ 月度薪資匯總
```

### E2E Tests (Post-MVP)

```bash
# E2E 測試在 MVP 階段不包含
# 如需運行 Playwright 測試:
npx playwright install
npm run test:e2e
```

---

## Common Development Tasks

### Add New MOM Rule

1. 更新 `src/services/salary/momCompliance.ts`
2. 添加對應測試到 `tests/unit/salary/momCompliance.test.ts`
3. 運行測試確保通過
4. 更新 `data-model.md` 如有 schema 變更

### Add New Schedule Type

1. 更新 `src/types/schedule.ts` 中的 `ScheduleType` enum
2. 更新 OCR prompt (api-spec.yaml)
3. 更新 `src/services/ocr/visionOCR.ts` 的識別邏輯
4. 添加測試案例

### Modify Salary Calculation

⚠️ **Critical**: 薪資計算變更必須:
1. 先寫測試 (TDD 流程)
2. 更新 `src/services/salary/calculator.ts`
3. 運行所有測試確保無回歸
4. 更新 `spec.md` 附錄公式說明

---

## Deployment

### Deploy to Vercel

```bash
# 首次部署
npx vercel

# 生產環境部署
npx vercel --prod

# 設置環境變數
npx vercel env add OPENAI_API_KEY
npx vercel env add VITE_SUPABASE_URL
npx vercel env add VITE_SUPABASE_ANON_KEY
```

### Verify Deployment

1. 檢查 Vercel Dashboard 部署狀態
2. 測試 OCR endpoint: `https://[your-app].vercel.app/api/ocr/recognize`
3. 測試前端應用: `https://[your-app].vercel.app`
4. 驗證 Supabase 連接 (檢查 Network tab)

---

## Troubleshooting

### Issue: OCR Recognition Fails

**Symptom**: POST /api/ocr/recognize returns 500 error

**Possible Causes**:
1. OpenAI API key 無效或額度不足
2. 圖片大小超過 5MB
3. GPT-4 Vision 服務不可用

**Solution**:
```bash
# 檢查 API key
echo $OPENAI_API_KEY

# 測試 OpenAI 連接
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 使用 Tesseract 作為 fallback (客戶端)
# 前端會自動切換,無需手動操作
```

### Issue: Salary Calculation Incorrect

**Symptom**: 計算結果與預期不符

**Debug Steps**:
1. 檢查員工 work_schedule_type 是否正確
2. 驗證當月工作日數計算:
   ```typescript
   import { calculateWorkingDays } from './src/utils/dateUtils';
   console.log(calculateWorkingDays(2025, 10, 'FIVE_DAY')); // 應該 = 23
   ```
3. 檢查 Part IV 適用性:
   ```sql
   SELECT name, base_salary, is_workman, is_part_iv_applicable
   FROM employees WHERE id = '[user-id]';
   ```
4. 運行測試找出失敗案例:
   ```bash
   npm run test -- --reporter=verbose
   ```

### Issue: Supabase RLS Denies Access

**Symptom**: Database queries return empty or 401 error

**Solution**:
1. 驗證用戶已登入:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log(user); // 應該有 user object
   ```
2. 檢查 RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'employees';
   ```
3. 確認 JWT token 有效:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   console.log(session?.expires_at); // 應該未過期
   ```

### Issue: npm run dev Fails on WSL2

**Symptom**: Port already in use or permission denied

**Solution**:
```bash
# 檢查端口佔用
netstat -tulpn | grep 5173

# 強制使用其他端口
npm run dev -- --port 3000

# WSL2 網絡問題
# 在 Windows 中允許防火牆規則
# PowerShell (管理員):
New-NetFirewallRule -DisplayName "WSL" -Direction Inbound -InterfaceAlias "vEthernet (WSL)" -Action Allow
```

---

## Quick Reference

### File Locations
- **Salary Calculation Engine**: `src/services/salary/calculator.ts`
- **MOM Compliance Rules**: `src/services/salary/momCompliance.ts`
- **OCR Service**: `src/services/ocr/visionOCR.ts`
- **Database Schema**: `specs/001-dtf-salary-tracker-mvp/data-model.md`
- **API Contracts**: `specs/001-dtf-salary-tracker-mvp/contracts/`

### Key Commands
```bash
npm run dev              # Start dev server
npm run test             # Run all tests
npm run test:watch       # Watch mode for tests
npm run build            # Production build
npm run preview          # Preview production build
npx vercel dev           # Run serverless functions locally
npx vercel --prod        # Deploy to production
```

### Important URLs
- Supabase Dashboard: https://app.supabase.com
- OpenAI Platform: https://platform.openai.com
- Vercel Dashboard: https://vercel.com/dashboard
- MOM Guidelines: https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days

---

## PDPA & Security Checklist

1. **Data Residency** – 在 Supabase Dashboard → Settings → General 確認 Region 為 `Southeast Asia (Singapore)`，並截圖留存以備稽核。
2. **At-Rest Encryption** – Settings → Database → Encryption 應顯示已啟用 Storage Encryption；所有環境變數與 API URL 必須使用 `https`.
3. **Access Control** – 前端所有 Supabase 查詢皆以 `employee_id` 篩選並依賴 RLS；呼叫 `/api/ocr/recognize` 與 `/api/salary/calculate` 時需附帶 `Authorization: Bearer <supabase access token>`。
4. **Rate Limits** – OCR API 允許 8 req/min、Salary API 允許 20 req/min；若收到 `429` 需退避重試並提示使用者。
5. **Data Retention** – 將 monthly_salaries 與 time_records 的清理排程記錄在 Ops playbook（預設 12 個月），並設定負責人。

## Serverless API Access Notes

- 從前端呼叫時請使用 `const { data: { session } } = await supabase.auth.getSession()` 取得 access token，再在 `fetch` header 加上 `Authorization: Bearer ${session?.access_token}`。
- 本地 (dev/test) 仍允許無 Authorization 的請求，但部署至 Production 後若缺少 access token 即回傳 401。

## Next Steps

完成 quickstart 後:

1. ✅ 閱讀 `spec.md` 了解完整功能需求
2. ✅ 閱讀 `research.md` 了解技術決策
3. ✅ 檢查 `data-model.md` 熟悉 database schema
4. ✅ 運行所有測試確保環境正確
5. ⏭️ 等待 `/speckit.tasks` 生成開發任務列表
6. ⏭️ 開始實現第一個任務 (通常從薪資計算引擎開始)

---

**Questions?**
- 查看 `spec.md` 的 Functional Requirements
- 查看 `contracts/api-spec.yaml` 的 API 定義
- 查看 `contracts/supabase-api.md` 的數據操作範例
