# 政策决策会议 - Constitution修改与MVP范围确认

**Date**: 2025-11-06
**Owner**: ME (Yueka)
**Facilitator**: CC (Claude Code)
**Reviewer**: CX (Cursor)
**Status**: ✅ EXECUTED - Remediation Complete

---

## 📋 会议目标

1. **锁定C1&C2政策决策**: 确定PH/休息日计薪规则（Constitution vs Spec）
2. **确认MVP最小范围**: 明确哪些HIGH风险项必须MVP，哪些可defer
3. **批准执行计划**: 给出绿灯，CC开始执行remediation

---

## 🎯 决策1: Constitution修改方案（CRITICAL）

### 问题核心

**矛盾**:
- Constitution说: PH=2.0×, 休息日=1.5×
- Spec说: PH=额外1日薪+1.5×OT, 休息日=MOM ½/1/2方案

**影响**:
- 阻塞薪资计算引擎开发（Phase 2 foundational）
- 影响US2（打卡）、US3（工资预估）所有相关功能

### 方案对比表

| 维度 | 方案A: 修改Constitution | 方案B: 简化Spec |
|------|------------------------|----------------|
| **准确性** | ✅ 符合MOM官方规定 | ❌ 可能误差>1% |
| **复杂度** | ⚠️ 中等（需ripple updates） | ✅ 低（保持现状） |
| **工作量** | 📝 Medium effort (CX评估) | 📝 Low effort |
| **风险** | ✅ 低（规则明确） | ⚠️ 高（可能违法/不准） |
| **用户体验** | ✅ 透明展示复杂规则 | ⚠️ 简化但可能误导 |
| **Constitution原则** | ✅ 符合§IV准确性要求 | ❌ 违反99%准确率 |

### 方案A详细执行步骤（CX已确认可行）

#### Step 1: 修改Constitution
```bash
文件: .specify/memory/constitution.md
行号: 71-79
版本: 1.0.0 → 1.1.0 (MINOR bump)
```

**修改内容**:
```diff
- Overtime multipliers:
-   - 正常工作日加班: 1.5x
-   - 休息日加班 (OFF/OT): 1.5x (整天)
-   - 公共假期: 2.0x
+ Overtime calculations (MOM Part IV compliant):
+   - 正常工作日OT: 超时 × 1.5x
+   - 法定休息日 (Statutory Rest Day):
+     * 雇主要求: ≤半日→1日薪, >半日→2日薪, 超正常工时→额外1.5×OT
+     * 员工要求: ≤半日→0.5日薪, ≤正常工时→1日薪, 超时→额外1.5×OT
+   - 非法定休息日: 按正常工作日OT规则 (超时1.5×)
+   - 公共假期 (PH): 额外1日基本薪 + 超正常工时部分1.5×OT
```

**添加Sync Impact Report**:
```markdown
<!--
  =============================================================================
  SYNC IMPACT REPORT
  =============================================================================
  Version: 1.0.0 → 1.1.0 (MOM规则细化)

  Modified Principles:
    - §IV User Data Accuracy: 细化加班计算规则以完全符合MOM Part IV

  Rationale:
    - 原1.0.0版本使用简化倍率（PH=2.0×, REST=1.5×）
    - 实际MOM规定使用分段计算（基础报酬+额外OT）
    - 简化方式可能导致计薪误差>1%，违反§IV准确性原则
    - Spec.md已详细研究MOM官方文档，确认复杂规则必要性

  Templates Requiring Updates:
    ✅ spec.md - 已对齐MOM规则（无需修改）
    ⚠️ tasks.md - 需添加REST/PH测试场景
    ⚠️ plan.md - 需更新Constitution Check结果

  Follow-up TODOs:
    - [ ] 更新所有salary test fixtures（tests/unit/salary/*.test.ts）
    - [ ] 验证calculateRestDayPay()实现分雇主/员工要求
    - [ ] 验证calculatePHPay()实现额外1日薪+OT逻辑
  =============================================================================
-->
```

#### Step 2: Ripple Updates（CX称"mechanical but necessary"）

**2.1 更新spec.md**
```bash
文件: specs/001-dtf-salary-tracker-mvp/spec.md
行号: 155（修正内部冲突）

修改前: - 公共假期加班（PH）→ 系统自动应用2倍加班费（而非1.5倍）
修改后: - 公共假期加班（PH）→ 系统自动应用额外1日基本薪+超时1.5×OT规则
```

**2.2 更新plan.md**
```bash
文件: specs/001-dtf-salary-tracker-mvp/plan.md
章节: Constitution Check → §IV User Data Accuracy

添加: ✅ PASS - 已更新至Constitution v1.1.0（MOM规则细化）
```

**2.3 更新tasks.md（测试场景）**
```bash
文件: specs/001-dtf-salary-tracker-mvp/tasks.md
位置: Phase 2, T028-T034 (salary tests)

新增测试场景:
- 法定休息日雇主要求（3h/6h/10h工作）
- 法定休息日员工要求（3h/6h/10h工作）
- 非法定休息日（按正常OT）
- 公共假期（8h/10h工作，验证额外1日薪）

示例:
- [ ] T029 (新增) 编写tests/unit/salary/restDayPay.test.ts
  * 测试法定休息日雇主要求: 3h→1日薪, 10h→2日薪+2h OT
  * 测试法定休息日员工要求: 3h→0.5日薪, 10h→1日薪+2h OT
  * 测试非法定休息日: 10h→8h正常+2h×1.5 OT
```

#### Step 3: 代码实现更新

**3.1 更新薪资计算引擎**
```typescript
// src/services/salary/momCompliance.ts

// 新增参数
interface RestDayPayParams {
  workHours: number;
  initiatedBy: 'employer' | 'employee'; // 新增
  isStatutoryRestDay: boolean; // 新增
  normalDailyHours: number;
  dailyRate: number;
  hourlyRate: number;
}

function calculateRestDayPay(params: RestDayPayParams): PayResult {
  const { workHours, initiatedBy, isStatutoryRestDay, normalDailyHours, dailyRate, hourlyRate } = params;

  // 非法定休息日: 按正常OT规则
  if (!isStatutoryRestDay) {
    const overtimeHours = Math.max(0, workHours - normalDailyHours);
    return {
      basePay: 0,
      overtimePay: overtimeHours * hourlyRate * 1.5,
      total: overtimeHours * hourlyRate * 1.5,
      rule: 'Non-statutory rest day (MOM standard OT)',
    };
  }

  // 法定休息日: MOM Part IV规则
  if (initiatedBy === 'employer') {
    // 雇主要求
    const basePay = workHours <= normalDailyHours / 2 ? dailyRate : dailyRate * 2;
    const overtimeHours = Math.max(0, workHours - normalDailyHours);
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    return {
      basePay,
      overtimePay,
      total: basePay + overtimePay,
      rule: 'MOM Part IV - Employer-requested rest day work',
    };
  } else {
    // 员工要求
    let basePay = 0;
    if (workHours <= normalDailyHours / 2) {
      basePay = dailyRate * 0.5;
    } else if (workHours <= normalDailyHours) {
      basePay = dailyRate;
    } else {
      basePay = dailyRate;
    }
    const overtimeHours = Math.max(0, workHours - normalDailyHours);
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    return {
      basePay,
      overtimePay,
      total: basePay + overtimePay,
      rule: 'MOM Part IV - Employee-requested rest day work',
    };
  }
}
```

**3.2 更新UI组件**
```typescript
// src/components/timecard/RestDayTimecardForm.tsx

// 新增UI元素
<select name="initiatedBy">
  <option value="employer">雇主要求加班</option>
  <option value="employee">员工自愿加班</option>
</select>

<Checkbox name="isStatutoryRestDay" defaultChecked>
  这是每周法定休息日 (Statutory Rest Day)
</Checkbox>

// 实时计算提示
{initiatedBy === 'employer' && workHours <= 4 && (
  <Alert>雇主要求≤半日工作 → 基础报酬: 1日薪</Alert>
)}
{initiatedBy === 'employer' && workHours > 4 && (
  <Alert>雇主要求>半日工作 → 基础报酬: 2日薪 + 超时OT</Alert>
)}
```

#### 工作量估算（CX评估）

| 任务 | 工时 | 复杂度 |
|------|------|--------|
| 修改Constitution + Sync Report | 0.5h | Easy |
| 更新spec.md/plan.md | 0.5h | Easy |
| 更新tasks.md测试场景 | 1h | Medium |
| 实现新测试用例 | 2h | Medium |
| 更新薪资计算引擎代码 | 3h | Medium |
| 更新UI组件（REST表单） | 1h | Easy |
| 验证所有测试通过 | 1h | Medium |
| **总计** | **9h** | **Medium** |

### 方案B详细说明（不推荐）

**执行步骤**:
1. 保持Constitution不变
2. 简化spec.md规则：
   - PH: 统一2.0×倍率（不区分额外1日薪）
   - 休息日: 统一1.5×倍率（不区分雇主/员工）
3. 删除isStatutoryRestDay、initiatedBy字段
4. 简化薪资计算引擎

**风险分析**:
| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 计薪不准（误差>1%） | 高 | 用户失去信任 | ❌ 无法缓解 |
| 违反MOM规定 | 中 | 法律风险 | ⚠️ 需法律咨询 |
| 用户投诉 | 中 | 产品声誉 | ⚠️ 需披露简化假设 |

**可能适用场景**:
- ⚠️ MVP快速验证阶段（接受误差风险）
- ⚠️ 用户明确同意使用简化规则
- ⚠️ 仅用于个人预估（非官方工资单）

---

## ✅ ME决策区 - C1&C2政策选择

**me**:
```
[ ] 方案A: 修改Constitution（推荐）
    理由: _______________________________
    接受工作量: 9小时
    预期完成: _______天内

[ ] 方案B: 简化Spec（不推荐）
    理由: _______________________________
    风险接受: 同意计薪可能不准
    披露策略: _______________________________

[ ] 其他方案: _______________________________
```

**决策截止**: 2025-11-__ （建议24小时内）

---

## 🎯 决策2: MVP范围优先级排序

### 背景

CX评估: HIGH风险项技术上不难，主要是scoping MVP vs Post-MVP

### 分类建议表

| 项目 | 类别 | MVP必须? | CC建议 | 理由 |
|------|------|---------|--------|------|
| **C3: OCR验证测试** | CRITICAL | ✅ YES | **MVP包含** | Constitution强制要求，Low effort |
| **G1: 离线同步** | HIGH | ❌ NO | **Post-MVP** | 可降级为"编辑需联网"，Medium effort |
| **G2: PDPA自动验证** | HIGH | ⚠️ MAYBE | **手动验证** | 自动化Medium effort，手动Low effort |
| **G3: 规则溯源UI** | HIGH | ⚠️ MAYBE | **简化版MVP** | 仅显示"MOM"vs"公司"，详细条款Post-MVP |
| **G4: OCR 50样本** | HIGH | ⚠️ MAYBE | **降为30样本** | 50样本High effort，30样本Medium effort |
| **G5: 性能instrumentation** | HIGH | ❌ NO | **Post-MVP** | 手动Lighthouse足够，自动化defer |
| **A1: 技术栈文档化** | MEDIUM | ✅ YES | **MVP包含** | 10分钟工作，必要性高 |
| **A2: E2E测试** | MEDIUM | ❌ NO | **Post-MVP** | tasks.md已明确延后 |
| **A3/I1: Spec冲突** | MEDIUM | ✅ YES | **MVP包含** | 随C1&C2一起修正 |
| **U1: 无需求任务** | MEDIUM | ⚠️ REVIEW | **逐个评估** | 见下方详细分析 |

### 详细分析: G1-G5

#### G1: 离线同步

**MVP降级方案（推荐）**:
```markdown
✅ 保留: 离线查看已导入排班（FR-046, 已有scheduleStore缓存）
❌ 移除: 离线新增打卡自动同步（FR-047）

替代方案:
- 离线时禁用"保存"按钮，显示"需要网络连接"
- 或LocalStorage暂存 + 手动"点击同步"按钮（无自动）

工作量对比:
- 完整自动同步: 6h (syncQueue + conflict resolution + tests)
- 简化手动同步: 2h (LocalStorage + sync button)
- 完全禁用离线编辑: 0.5h (UI disable logic)
```

**me决策**:
```
[ ] MVP包含自动同步（+6h）
[ ] MVP包含手动同步按钮（+2h）
[ ] MVP禁用离线编辑（+0.5h）← 推荐
```

#### G2: PDPA区域验证

**MVP方案对比**:
```markdown
方案1: 自动化脚本 + CI gate (Medium effort, 4h)
  ✅ 优点: 部署前自动检查，防止误配置
  ❌ 缺点: 需Supabase Management API key，CI配置复杂

方案2: 手动验证清单 (Low effort, 0.5h)
  ✅ 优点: 快速，适合单人项目
  ❌ 缺点: 依赖人工，可能遗忘
  步骤: quickstart.md添加截图验证步骤

方案3: 仅文档说明（Minimal, 0.1h）
  ⚠️ 风险: 无验证，可能违反PDPA
```

**me决策**:
```
[ ] 方案1: 自动化（+4h）
[ ] 方案2: 手动清单（+0.5h）← 推荐MVP
[ ] 方案3: 仅文档（+0.1h）
```

#### G3: 规则溯源UI

**MVP简化方案（推荐）**:
```typescript
// 完整版（Post-MVP, 6h）
<SalaryRow>
  OT倍率: 1.5×
  <RuleSource onClick={showDetails}>
    来源: MOM Part IV §38(4)
  </RuleSource>
</SalaryRow>

// 简化版（MVP, 1h）← 推荐
<SalaryRow>
  OT倍率: 1.5× <Badge>MOM标准</Badge>
</SalaryRow>

// 最简版（0.5h）
<SalaryRow>
  OT倍率: 1.5×
</SalaryRow>
```

**me决策**:
```
[ ] 完整规则溯源（+6h）
[ ] 简化Badge标记（+1h）← 推荐MVP
[ ] 无规则来源显示（+0h）
```

#### G4: OCR样本量

**样本量对比**:
```markdown
50张样本（SC-001原要求）:
  - 收集难度: High（需联系多位员工）
  - 测试时间: 3-4h
  - 置信度: 99%

30张样本（降级方案）:
  - 收集难度: Medium（2-3位员工）
  - 测试时间: 2h
  - 置信度: 95%

10张样本（当前tasks.md）:
  - 收集难度: Low（1位员工）
  - 测试时间: 0.5h
  - 置信度: 80% ⚠️ 可能不足
```

**me决策**:
```
[ ] 50张样本（+4h）
[ ] 30张样本（+2h）← 推荐MVP
[ ] 保持10张（+0h）⚠️ 风险
```

#### G5: 性能监控

**MVP方案（推荐）**:
```markdown
✅ 保留: 手动Lighthouse测试（tasks.md T149-T150）
❌ 移除: 自动化Lighthouse CI（+3h）
❌ 移除: React Profiler API集成（+2h）
✅ 保留: Console性能日志（+0.5h）← 推荐添加

示例console日志:
console.time('salary-calculation');
const result = calculateMonthlySummary(...);
console.timeEnd('salary-calculation'); // "salary-calculation: 45ms"

if (duration > 1000) {
  console.warn('⚠️ Salary calculation slow:', duration, 'ms');
}
```

**me决策**:
```
[ ] 完整自动化监控（+5h）
[ ] 仅Console日志（+0.5h）← 推荐MVP
[ ] 无额外监控（+0h）
```

### 详细分析: U1无需求任务

| Task | 建议 | 理由 |
|------|------|------|
| T069 (salary serverless API) | ⏸️ Defer | 前端计算足够，除非需服务端PDF导出 |
| T136 (日历虚拟滚动) | ⏸️ Defer | 30天无需虚拟滚动，过度优化 |
| T137 (薪资结果缓存) | ✅ Keep | 已有monthly_salaries表，关联FR-026 |
| T140 (code splitting) | ⏸️ Defer | 仅当FCP>2s时添加，先测后优化 |

---

## ✅ ME决策区 - MVP范围确认

### 必须包含（已确认）
```
✅ C3: OCR验证测试
✅ A1: 技术栈文档化
✅ A3/I1: 修正Spec冲突
```

### 需要决策（勾选）

**HIGH优先级项目**:
```
[ ] G1: 离线同步
    选择: [ ] 自动 [ ] 手动 [ ] 禁用 ← 我的选择

[ ] G2: PDPA验证
    选择: [ ] 自动化 [ ] 手动清单 [ ] 仅文档 ← 我的选择

[ ] G3: 规则溯源UI
    选择: [ ] 完整 [ ] 简化Badge [ ] 无 ← 我的选择

[ ] G4: OCR样本量
    选择: [ ] 50张 [ ] 30张 [ ] 10张 ← 我的选择

[ ] G5: 性能监控
    选择: [ ] 自动化 [ ] Console日志 [ ] 无 ← 我的选择
```

**MEDIUM优先级项目**:
```
[ ] A2: E2E测试 → 确认延后至Post-MVP
[ ] U1: 无需求任务
    - T069 serverless API: [ ] Keep [ ] Defer ← 我的选择
    - T136 虚拟滚动: [ ] Keep [ ] Defer ← 我的选择
    - T137 薪资缓存: [ ] Keep [ ] Defer ← 我的选择
    - T140 code splitting: [ ] Keep [ ] Defer ← 我的选择
```

### 工作量汇总

**基线MVP（必须项）**:
```
C3 (OCR测试): 3h
A1 (技术栈文档): 0.2h
A3/I1 (Spec冲突): 0.5h
---------------------
小计: 3.7h
```

**可选项工作量**:
```
如果全选"推荐MVP"方案:
+ G1 (禁用离线编辑): 0.5h
+ G2 (手动清单): 0.5h
+ G3 (简化Badge): 1h
+ G4 (30样本): 2h
+ G5 (Console日志): 0.5h
+ U1 (Defer T069/T136/T140, Keep T137): 0h
---------------------
推荐MVP总计: 8.2h

如果全选"完整版":
+ G1-G5完整: 23h
---------------------
完整版总计: 26.7h
```

**加上C1&C2 Constitution修改**:
```
方案A (MOM规则): 9h
---------------------
总MVP工作量:
- 推荐版: 8.2h + 9h = 17.2h (~2-3天)
- 完整版: 26.7h + 9h = 35.7h (~4-5天)
```

---

## 🚀 执行计划（待ME批准后启动）

### Phase 1: CRITICAL修复（必须完成）
```bash
优先级: P0
时间: 1-2天

[ ] C1&C2: Constitution修改（9h）
    - 修改constitution.md
    - 更新spec/plan/tasks
    - 更新薪资引擎代码
    - 更新测试用例
    - 验证所有测试通过

[ ] C3: OCR验证测试（3h）
    - 添加validator tests
    - 实现validator.ts
    - 任务重编号

[ ] A3/I1: Spec冲突修正（0.5h）
```

### Phase 2: MVP范围项（根据ME决策）
```bash
优先级: P1
时间: 0.5-2天（取决于选择）

[ ] G1-G5: 按ME选择的方案执行
[ ] U1: Defer或Keep指定任务
[ ] A1: 技术栈文档化（0.2h）
```

### Phase 3: 文档更新
```bash
优先级: P2
时间: 0.5天

[ ] 更新audit-resolution-discussion.md状态
[ ] 生成remediation完成报告
[ ] 更新quickstart.md（如有新验证步骤）
```

### 验收标准
```bash
✅ 所有CRITICAL问题状态 = APPROVED或RESOLVED
✅ Constitution通过自我一致性检查（无新冲突）
✅ 所有unit tests通过（包括新增OCR/salary tests）
✅ ME批准的MVP范围项全部完成
✅ 文档同步更新（spec/plan/tasks对齐）
```

---

## 📝 ME最终批准签字

**我已阅读并理解**:
- [x] C1&C2政策决策的影响和工作量
- [ ] MVP范围选择的取舍
- [ ] 执行计划的时间预估

**我的决策**:
```
C1&C2方案: [ ] 方案A [ ] 方案B [ ] 其他: ___________

MVP范围:
  [ ] 推荐版（8.2h + 9h = 17.2h）
  [ ] 完整版（26.7h + 9h = 35.7h）
  [ ] 自定义（见上方勾选）

预期开始时间: 2025-11-__
预期完成时间: 2025-11-__

批准执行: ____________（ME签名）
日期: 2025-11-06
```

---

**cc**: 等待ME填写决策并批准后，我将立即开始执行remediation

**cx**: [待ME决策后补充任何技术建议]

---

## 📝 Execution Record

**ME Decision**: 2025-11-06
**Selected**: 方案A（修改Constitution）+ 推荐MVP范围

**Execution Timeline**:
- Phase 1.1: Constitution v1.0.0 → v1.1.0 ✅
- Phase 1.2: Spec.md修正PH冲突 ✅
- Phase 1.3: Plan.md更新Constitution Check ✅
- Phase 1.4: Tasks.md添加测试场景+OCR分阶段+G1-G5标注 ✅
- Phase 2: Codex实现指南生成 ✅
- Phase 3: 审计文档归档 ✅

**Total Time**: ~2.5h (纯文档修改，代码实现由Codex负责)

**Next Step**: Codex实现 → 参考 `docs/codex-implementation-guide.md`

---

**Document Version**: v1.1
**Status**: ✅ EXECUTED & ARCHIVED
