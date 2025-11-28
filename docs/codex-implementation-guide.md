# Codex Implementation Guide - DTF Salary Tracker

**Generated**: 2025-11-06 by Claude Code
**Purpose**: 提供给Codex的代码实现规格（纯规格定义，不含代码实现）
**Status**: 🟢 Ready for Implementation

---

## 📋 概述

本文档基于ME批准的推荐方案（docs/policy-decision-meeting.md），提供Codex实现所需的完整规格。
CC已完成文档层修改（Constitution/Spec/Plan/Tasks），Codex负责所有代码实现。

**Constitution Version**: v1.1.0 (MOM规则细化)
**Key Changes**:
- PH/REST计薪从简化倍率改为MOM分段计算
- OCR分阶段（MVP仅上传，Phase B识别）
- G1-G5 MVP简化方案

---

## 🎯 CRITICAL优先级任务（阻塞性）

### 1. Salary Engine更新（MUST DO FIRST）

**Why Critical**: Constitution v1.1.0强制要求，所有薪资计算依赖此基础

#### 1.1 REST DAY计薪函数

**文件**: `src/services/salary/momCompliance.ts`

**新增函数签名**:
```typescript
interface RestDayPayParams {
  workHours: number;
  initiatedBy: 'employer' | 'employee'; // 雇主要求 vs 员工要求
  isStatutoryRestDay: boolean; // 法定休息日 vs 非法定
  normalDailyHours: number; // 正常日工时（如8h）
  dailyRate: number; // 日薪（动态计算，禁用÷26）
  hourlyRate: number; // 时薪（月薪÷190.67）
}

interface PayResult {
  basePay: number;
  overtimePay: number;
  total: number;
  rule: string; // 规则说明（如"MOM Part IV - Employer-requested"）
}

function calculateRestDayPay(params: RestDayPayParams): PayResult;
```

**实现逻辑** (参考Constitution v1.1.0 §IV 第82-85行):
```
非法定休息日:
  → 按正常OT规则（超时×1.5）

法定休息日 + 雇主要求:
  工作≤半日（normalDailyHours/2） → basePay = 1×dailyRate
  工作>半日 → basePay = 2×dailyRate
  超正常工时部分 → overtimePay = (workHours - normalDailyHours) × hourlyRate × 1.5

法定休息日 + 员工要求:
  工作≤半日 → basePay = 0.5×dailyRate
  工作≤正常工时 → basePay = 1×dailyRate
  超正常工时部分 → overtimePay = (workHours - normalDailyHours) × hourlyRate × 1.5
```

**测试规格**: `tasks.md` T029（7个场景）

**参考**:
- Constitution: `.specify/memory/constitution.md`第82-85行
- Spec附录C: `specs/001-dtf-salary-tracker-mvp/spec.md`第424-478行
- Policy meeting: `docs/policy-decision-meeting.md`第136-155行

---

#### 1.2 PH Pay计薪函数

**文件**: `src/services/salary/momCompliance.ts`

**修改函数签名**:
```typescript
interface PHPayParams {
  workHours: number;
  normalDailyHours: number;
  dailyRate: number;
  hourlyRate: number;
}

function calculatePHPay(params: PHPayParams): PayResult;
```

**实现逻辑** (参考Constitution v1.1.0 §IV 第86行):
```
基础报酬 = 1×dailyRate（额外给付，因月薪已包含假期基本薪）
加班费 = Math.max(0, workHours - normalDailyHours) × hourlyRate × 1.5

总计 = 基础报酬 + 加班费
规则说明 = "MOM Part IV - Public Holiday (extra daily pay + OT)"
```

**测试规格**: `tasks.md` T030（3个场景）

**参考**:
- Constitution: `.specify/memory/constitution.md`第86行
- Spec附录D: `specs/001-dtf-salary-tracker-mvp/spec.md`第482-505行

---

#### 1.3 测试用例规格

**文件**:
- `tests/unit/salary/momCompliance.test.ts` (T028)
- `tests/unit/salary/restDayPay.test.ts` (T029)
- `tests/unit/salary/phPay.test.ts` (T030)
- `tests/unit/salary/calculator.test.ts` (T031)
- `tests/unit/utils/dateUtils.test.ts` (T032)

**测试数据**（所有测试统一使用）:
```typescript
const testData = {
  baseSalary: 1770,
  hourlyRate: 1770 / 190.67, // = 9.28
  dailyRate: 1770 / 20, // 假设5天制11月20个工作日 = 88.50
  normalDailyHours: 8,
};
```

**T029详细场景**:
```typescript
describe('calculateRestDayPay', () => {
  describe('法定休息日-雇主要求', () => {
    it('3小时工作 → 1日薪', () => {
      expect(result.total).toBe(88.50);
    });
    it('6小时工作 → 2日薪', () => {
      expect(result.total).toBe(177.00);
    });
    it('10小时工作 → 2日薪+2h OT', () => {
      expect(result.basePay).toBe(177.00);
      expect(result.overtimePay).toBeCloseTo(27.84);
      expect(result.total).toBeCloseTo(204.84);
    });
  });

  describe('法定休息日-员工要求', () => {
    it('3小时工作 → 0.5日薪', () => {
      expect(result.total).toBeCloseTo(44.25);
    });
    it('6小时工作 → 1日薪', () => {
      expect(result.total).toBe(88.50);
    });
    it('10小时工作 → 1日薪+2h OT', () => {
      expect(result.basePay).toBe(88.50);
      expect(result.overtimePay).toBeCloseTo(27.84);
      expect(result.total).toBeCloseTo(116.34);
    });
  });

  describe('非法定休息日', () => {
    it('10小时工作 → 仅2h OT', () => {
      expect(result.total).toBeCloseTo(27.84);
    });
  });
});
```

**T030详细场景**:
```typescript
describe('calculatePHPay', () => {
  it('6小时工作 → 额外1日薪', () => {
    expect(result.total).toBe(88.50);
  });
  it('8小时工作 → 额外1日薪', () => {
    expect(result.total).toBe(88.50);
  });
  it('10小时工作 → 额外1日薪+2h OT', () => {
    expect(result.basePay).toBe(88.50);
    expect(result.overtimePay).toBeCloseTo(27.84);
    expect(result.total).toBeCloseTo(116.34);
  });
});
```

**验收标准**:
```bash
npm run test -- src/services/salary
# 所有tests必须100% pass
```

---

## 📸 MVP Upload功能（HIGH优先级）

### 2. Photo Upload基础设施

**Why Important**: OCR识别延后Phase B，MVP需上传+手动输入作为替代

#### 2.1 Supabase Storage服务

**文件**: `src/services/supabase/storage.ts`

**函数签名**:
```typescript
async function uploadScheduleImage(file: File): Promise<string>;
function getImageUrl(path: string): string;
async function deleteImage(path: string): Promise<void>;
```

**实现要点**:
- Bucket name: `'schedule-images'`（需在Supabase Console手动创建）
- 文件大小限制: 5MB（客户端验证）
- 文件命名: `{userId}/{year}-{month}-{timestamp}.jpg`
- 返回值: public URL字符串

**错误处理**:
- 文件超5MB → 抛出`FileTooLargeError`
- 网络失败 → 重试3次，exponential backoff
- 用户未认证 → 抛出`AuthenticationError`

**测试**: 手动测试（集成测试T125延后）

**参考**: `tasks.md` T046

---

#### 2.2 Upload UI组件

**文件**: `src/components/upload/ImageUpload.tsx`

**功能需求**:
- 支持3种上传方式：拍照、相册选择、拖拽
- 上传进度显示（0-100%）
- 实时文件大小验证（5MB超限提示）
- 预览上传后的图片（缩略图）

**Props接口**:
```typescript
interface ImageUploadProps {
  onUpload: (url: string) => void;
  onError: (error: Error) => void;
  maxSize?: number; // 默认5MB
}
```

**UI流程**:
```
1. 用户点击"上传排班表"按钮
2. 显示3个选项：
   - 📷 拍照
   - 🖼️ 从相册选择
   - 📁 拖拽文件到此处
3. 选择文件后验证大小
4. 上传中显示进度条
5. 上传成功显示缩略图 + ✓ 已保存
6. 提示："照片已保存！请手动输入排班数据。（未来版本将支持自动识别）"
```

**参考**: `tasks.md` T049

---

#### 2.3 Manual Schedule Form

**文件**: `src/components/schedule/ManualScheduleForm.tsx`

**功能需求**:
- 逐日输入排班状态和时间
- 批量复制功能（如"周一至周五复制相同排班"）
- 状态选择：Work/REST/OFF/AL/Training/Support
- 时间输入：支持12/24小时格式

**Props接口**:
```typescript
interface ManualScheduleFormProps {
  month: string; // YYYY-MM格式
  initialData?: Partial<Schedule>;
  onSubmit: (schedule: Schedule) => void;
}
```

**UI设计**:
```
日期列表（1-31号）：
[1] 🕙 10:00 - 19:00  [Work ▾]  [编辑]
[2] 🔴 REST             [复制到3-5]
[3] 🕙 10:00 - 19:00  [Work ▾]
...

[批量操作]：
- 周一至周五：[Work] 10:00-19:00
- 所有周六：[OFF]
```

**参考**: `tasks.md` T050

---

## 🔧 MVP范围简化任务

### 3. G1 - 禁用离线编辑

**文件**: 需修改的组件（Timecard/Schedule编辑相关）

**实现**:
```typescript
// 检测网络状态
const isOnline = navigator.onLine;

// 禁用保存按钮
<Button
  disabled={!isOnline}
  onClick={handleSave}
>
  {isOnline ? '保存' : '离线模式 - 需要网络连接'}
</Button>

// 添加提示
{!isOnline && (
  <Alert variant="warning">
    ⚠️ 当前离线，无法保存数据。已缓存的排班可继续查看。
  </Alert>
)}
```

**保留功能**: 离线查看已缓存的排班（scheduleStore persist）

**参考**: `tasks.md` T135, `docs/policy-decision-meeting.md`第201-228行

---

### 4. G2 - PDPA手动验证清单

**文件**: `specs/001-dtf-salary-tracker-mvp/quickstart.md`

**添加章节**:
```markdown
## PDPA合规验证

### Supabase Region验证步骤

1. 登录Supabase Dashboard
2. 进入Project Settings → General
3. 确认**Region**显示为：**Southeast Asia (Singapore)** 或 `ap-southeast-1`
4. 截图保存作为合规证明

⚠️ 如果region不是Singapore，请：
- 创建新项目时选择正确region
- 或联系Supabase support迁移数据

### 数据本地化说明

- 用户数据存储在新加坡AWS服务器
- 符合新加坡PDPA（Personal Data Protection Act）要求
- 不会传输至其他国家/地区
```

**参考**: `tasks.md` T144, `docs/policy-decision-meeting.md`第230-254行

---

### 5. G3 - 简化规则Badge

**文件**: `src/components/salary/SalaryBreakdown.tsx`

**实现**:
```tsx
<SalaryRow>
  <Label>加班倍率</Label>
  <Value>1.5×</Value>
  <Badge variant="primary" size="sm">MOM标准</Badge>
</SalaryRow>

<SalaryRow>
  <Label>勤工奖</Label>
  <Value>$100.00</Value>
  <Badge variant="secondary" size="sm">公司规则</Badge>
</SalaryRow>
```

**简化说明**:
- MVP仅显示"MOM标准"vs"公司规则"两类Badge
- 不提供点击详情查看条款（Phase B功能）
- 不显示具体条款引用（如"Part IV §38(4)"）

**参考**: `tasks.md` T092a, `docs/policy-decision-meeting.md`第256-278行

---

### 6. G5 - Console性能日志

**文件**: `src/hooks/useSalary.ts`

**实现**:
```typescript
export function useSalary() {
  const calculateMonthlySummary = useCallback(() => {
    console.time('salary-calculation');

    const result = calculator.calculateMonthlySummary(...);

    console.timeEnd('salary-calculation');
    // 输出示例: "salary-calculation: 45ms"

    if (performance.now() - startTime > 1000) {
      console.warn('⚠️ Salary calculation slow:', duration, 'ms (expected <1s)');
    }

    return result;
  }, []);
}
```

**监控指标**: SC-008要求<1s刷新

**参考**: `tasks.md` T140a, `docs/policy-decision-meeting.md`第304-328行

---

## 📚 参考文档索引

### Constitution & Specs
- **Constitution v1.1.0**: `.specify/memory/constitution.md`
  - §IV User Data Accuracy (第77-91行): 完整MOM规则
  - Sync Impact Report (第1-30行): 修改原因和影响

- **Spec.md**: `specs/001-dtf-salary-tracker-mvp/spec.md`
  - FR-022 (第189-194行): 特殊日期类型计算规则
  - 附录C (第424-478行): REST DAY详细说明
  - 附录D (第482-505行): PH详细说明

- **Plan.md**: `specs/001-dtf-salary-tracker-mvp/plan.md`
  - Constitution Check (第100-103行): 验证通过状态
  - Technical Context (第22-40行): 技术栈决策

- **Tasks.md**: `specs/001-dtf-salary-tracker-mvp/tasks.md`
  - Phase 2 (第64-97行): Salary Engine TDD任务
  - Phase 3 (第92-152行): OCR分阶段任务
  - Remediation章节 (第586-659行): 更新说明

### Decision Records
- **Policy Meeting**: `docs/policy-decision-meeting.md`
  - 方案A详细执行步骤 (第81-158行)
  - G1-G5详细分析 (第201-328行)

- **Audit Discussion**: `docs/audit-resolution-discussion.md`
  - C1&C2问题背景 (第27-87行)
  - CX技术评估 (第79-83, 133-136行)

### MOM官方文档
- 工时、加班与休息日: https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days
- 公共假期权益: https://www.mom.gov.sg/employment-practices/public-holidays-entitlement-and-pay
- 月薪与日薪定义: https://www.mom.gov.sg/employment-practices/salary/monthly-and-daily-salary

---

## ✅ Implementation Checklist

### Phase 1: CRITICAL (必须先完成)
- [ ] 实现calculateRestDayPay() (momCompliance.ts)
- [ ] 实现calculatePHPay() (momCompliance.ts)
- [ ] 编写并通过所有salary tests (T028-T032)
- [ ] 验证测试100% pass

### Phase 2: Upload Infrastructure
- [ ] 创建Supabase Storage bucket
- [ ] 实现uploadScheduleImage() (storage.ts)
- [ ] 实现ImageUpload组件 (ImageUpload.tsx)
- [ ] 实现ManualScheduleForm组件

### Phase 3: MVP Simplifications
- [ ] G1: 禁用离线编辑逻辑
- [ ] G2: 添加PDPA验证清单到quickstart.md
- [ ] G3: SalaryBreakdown添加MOM Badge
- [ ] G5: useSalary添加console.time日志

### Final Verification
- [ ] 运行所有unit tests
- [ ] 手动测试上传流程
- [ ] 验证quickstart.md步骤
- [ ] 确认Constitution v1.1.0对齐

---

## 🚨 常见问题

**Q: 任务编号为什么有重复/跳号？**
A: Constitution修改导致新增4个测试任务（T029-T032），理论上后续任务应+4，但未执行全局重编号。请按任务描述和phase识别，不依赖编号。

**Q: OCR相关代码是否需要实现？**
A: MVP阶段仅保留接口定义（抛出NotImplementedError），完整实现延后Phase B。参考tasks.md第115-121行Phase B任务列表。

**Q: 如何验证MOM规则正确性？**
A:
1. 对照Constitution v1.1.0 §IV
2. 运行tests确保pass
3. 对比Spec.md附录C/D的示例计算
4. 查阅MOM官方链接确认

**Q: G1-G5标注的任务是否都要实现？**
A:
- [G1-简化MVP] / [G2-手动验证MVP] / [G3-简化MVP] / [G5-简化MVP] → 实现简化版
- [U1-DEFERRED] → 不实现
- [U1-KEEP] → 正常实现

**Q: 遇到文档冲突怎么办？**
A: 优先级顺序：Constitution v1.1.0 > Spec.md > Plan.md > Tasks.md。如仍有疑问，参考docs/policy-decision-meeting.md的ME最终决策。

---

**Document Version**: v1.0
**Generated by**: Claude Code
**For**: Codex Implementation
**Last Updated**: 2025-11-06
