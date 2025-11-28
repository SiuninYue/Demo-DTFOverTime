# Spec/Plan/Tasks Audit Resolution Discussion

**Created**: 2025-11-06
**Status**: 🟡 Under Discussion
**Participants**: CC (Claude Code), CX (Cursor/Reviewer), ME (Yueka)

---

## 📋 Discussion Protocol

**Format**:
```
cc: [Claude Code的意见]
cx: [Chatgpt codex的回应]
me: [Yueka的决策]
```

**Decision Markers**:
- ✅ APPROVED - 已确认执行
- ❌ REJECTED - 不执行
- 🔄 REVISED - 需修改后执行
- ⏸️ DEFERRED - 延后处理

---

## 🔴 CRITICAL Issues (阻塞开发)

### C1 & C2: PH/休息日计薪规则冲突

**背景**:
- Constitution §IV规定: PH=2.0×, 休息日=1.5×（整天）
- Spec.md使用: PH=额外1日薪+1.5×OT, 休息日=MOM ½/1/2复杂方案
- 两者矛盾导致无法开始实现

**cc**: 建议修正Constitution以符合MOM实际法规（方案A）

**理由**:
1. Spec.md附录C已详细研究MOM官方规定
2. MOM官方确实使用复杂的分段计算（非简单倍率）
3. Constitution §IV本身要求"99%+ accurate & MOM compliant"
4. 简化为固定倍率会导致计薪不准，违反Constitution原则

**方案A: 修正Constitution（推荐）**
```markdown
# 修改位置: .specify/memory/constitution.md:71-79

## 修改前
- Overtime multipliers:
  - 正常工作日加班: 1.5x
  - 休息日加班 (OFF/OT): 1.5x (整天)
  - 公共假期: 2.0x

## 修改后
- Overtime calculations (MOM Part IV compliant):
  - 正常工作日OT: 超时 × 1.5x
  - 法定休息日 (Statutory Rest Day):
    * 雇主要求: ≤半日→1日薪, >半日→2日薪, 超正常工时→额外1.5×OT
    * 员工要求: ≤半日→0.5日薪, ≤正常工时→1日薪, 超时→额外1.5×OT
  - 非法定休息日: 按正常工作日OT规则 (超时1.5×)
  - 公共假期 (PH): 额外1日基本薪 + 超正常工时部分1.5×OT

## Version Bump
- 1.0.0 → 1.1.0 (MINOR: 新增MOM规则细化)

## Sync Impact
- 影响文件: spec.md (已对齐), tasks.md (需添加相关测试)
- 模板更新: 无需更新（原则未变，仅规则细化）
```

**方案B: 简化Spec为固定倍率（不推荐）**
```markdown
风险: ⚠️ 违反MOM实际规定，计薪误差可能>1%
仅在以下情况考虑:
- 无法获取MOM官方确认
- MVP阶段简化优先
- 用户接受误差风险
```

**cx**: [等待CX评估MOM法规复杂度是否必要]

**me**: [等待决策]

**Decision**: ⏸️ PENDING

---

### C3: OCR验证测试缺失

**背景**: Constitution §Development Workflow要求TDD for OCR validation，但tasks.md仅有salary tests

**cc**: 建议在Phase 2添加OCR validation测试任务

**补充任务**:
```markdown
### Phase 2: Foundational - OCR Validation Tests (新增)

位置: tasks.md:66行后（Salary测试前）

- [ ] T028 编写tests/unit/ocr/validation.test.ts
  * 测试OCR结果JSON schema验证
  * 测试置信度阈值检测（<70%标记为需确认）
  * 测试日期范围验证（28-31天）
  * 测试员工姓名匹配逻辑

- [ ] T029 编写tests/unit/ocr/promptParsing.test.ts
  * 测试GPT-4 Vision prompt构建逻辑
  * 测试状态映射表（REST/OFF/AL/C等）
  * 测试时间格式解析（1000→10:00, "1200 2100"→12:00-21:00）

- [ ] T030 实现src/services/ocr/validator.ts
  * validateOCRResult(result: OCRResult): ValidationReport
  * checkDateRange(days: number): boolean
  * validateScheduleTypes(types: string[]): boolean
  * calculateConfidence(cellResults: CellResult[]): number

- [ ] T031 运行所有OCR测试确保100% pass

## 任务编号调整
- 原T028-T034 (salary tests) → T032-T038
- 原T035-后续 → T039-后续（全部+4）
```

**理由**:
1. Constitution明确要求OCR validation tests
2. OCR是P0核心功能（SC-001: 90%准确率）
3. 无测试无法验证FR-006（识别置信度计算）
4. 阻塞US1验收标准

**cx**: [评估测试粒度是否合适]

**me**: [等待决策]

**Decision**: ⏸️ PENDING

---

## 🟠 HIGH Risks (影响上线但非阻塞)

### G1: 离线同步功能缺实现任务

**背景**: FR-047要求"网络恢复后自动同步本地数据"，但tasks.md仅有UI指示器

**cc**: 建议在Phase 10添加后台同步任务

**补充任务**:
```markdown
### Phase 10: Polish - Offline Sync Implementation

- [ ] T141 创建src/services/offline/syncQueue.ts
  * 本地IndexedDB队列存储pending changes
  * 重试策略（exponential backoff, 最多3次）
  * 网络状态监听（online event）

- [ ] T142 实现Supabase冲突解析逻辑
  * Timestamp-based merge（取最新修改）
  * 冲突标记机制（显示"数据已在其他设备修改"）
  * 手动解决UI（可选，MVP可省略）

- [ ] T143 编写tests/integration/offline-sync.test.ts
  * 模拟离线→添加打卡→上线→验证同步成功
  * 模拟冲突场景（两设备同时编辑）
```

**是否MVP必须**:
- 核心离线查看（FR-046）→ 已有（scheduleStore缓存）✅
- 离线新增数据→ 可降级为"需联网才能保存" ⚠️
- 自动同步→ 可MVP后添加 ⏸️

**cx**: [评估是否可降级为"仅离线查看，编辑需联网"]

**me**: [决策MVP范围]

**Decision**: ⏸️ PENDING

---

### G2: 数据本地化PDPA合规验证缺失

**背景**: FR-048要求"数据存储在新加坡区域"，但无验证任务

**cc**: 建议添加自动化region验证

**补充任务**:
```markdown
### Phase 10: Security & Compliance

- [ ] T144 创建scripts/verify-supabase-region.sh
  ```bash
  #!/bin/bash
  # 调用Supabase Management API检查项目region
  REGION=$(curl -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    https://api.supabase.com/v1/projects/$PROJECT_ID | jq -r '.region')

  if [ "$REGION" != "ap-southeast-1" ]; then
    echo "❌ ERROR: Supabase region is $REGION, expected ap-southeast-1"
    exit 1
  fi
  echo "✅ Supabase region verified: $REGION"
  ```

- [ ] T145 在GitHub Actions CI中添加region验证gate
  * 部署前自动运行verify-region.sh
  * 失败则阻止部署

- [ ] T146 更新quickstart.md添加Supabase设置步骤
  * 创建项目时选择"Singapore (Southeast Asia)"
  * 截图说明region选择位置
```

**手动验证替代方案**:
```markdown
在quickstart.md添加人工检查清单:
- [ ] 登录Supabase Dashboard
- [ ] 确认Project Settings → General → Region = "Southeast Asia (Singapore)"
- [ ] 截图留档
```

**cx**: [评估是否需要自动化，还是人工检查足够]

**me**: [决策]

**Decision**: ⏸️ PENDING

---

### G3: 合规引擎规则溯源UI缺失

**背景**: FR-051-053要求显示规则来源（如"MOM Part IV"），tasks.md无相关UI任务

**cc**: 建议在Phase 6 (US3)添加provenance UI

**补充任务**:
```markdown
### Phase 6: User Story 3 - 增强合规透明度

- [ ] T092a 在SalaryBreakdown组件添加规则来源标签
  * OT倍率旁显示"(来源: MOM Part IV §38(4))"
  * 勤工奖旁显示"(来源: DTF公司手册 2024版)"
  * 点击查看完整条款引用（弹窗或链接）

- [ ] T092b 实现src/services/salary/complianceValidator.ts
  * validateCompanyRule(rule: CompanyRule): ValidationResult
  * 检测公司规则是否低于MOM baseline
  * 示例: OT multiplier < 1.5 → reject with warning

- [ ] T126a 在integration tests添加规则provenance验证
  * 测试工资明细中包含规则来源字段
  * 测试公司规则<MOM时触发警告
```

**MVP简化方案**:
```markdown
如需简化MVP:
- FR-051: 仅显示"MOM标准"vs"公司政策"（无具体条款）✅
- FR-052: 仅文字提示，无点击详情 ✅
- FR-053: 仅console.warn，无UI警告 ⚠️
- 完整规则引擎→ Post-MVP ⏸️
```

**cx**: [评估是否MVP必须，还是可简化]

**me**: [决策]

**Decision**: ⏸️ PENDING

---

### G4: OCR测试样本量不足

**背景**: SC-001要求"基于50张真实排班表测试"，T129仅10张

**cc**: 建议修改T129并添加acceptance gate

**修改任务**:
```markdown
### Phase 9: Integration Tests

- [ ] T129 使用真实排班表测试OCR准确率
  * 收集≥50张真实鼎泰丰排班表（不同月份、不同员工、不同格式）
  * 每张图片记录: 文件名、实际内容（ground truth）、识别结果、准确率
  * 整体准确率必须≥90%
  * 生成测试报告: docs/ocr-accuracy-report.md

- [ ] T129a 创建OCR acceptance gate
  * 若准确率<90%，阻止部署
  * 分析错误模式（模糊图片、特殊标记、手写备注等）
  * 记录需改进的prompt engineering方向
```

**样本收集策略**:
```markdown
方式1: 联系鼎泰丰员工提供历史排班表（脱敏处理）
方式2: 使用模拟数据生成50张不同格式Excel截图
方式3: 混合策略（20张真实 + 30张模拟）← 推荐MVP
```

**cx**: [评估50张是否必要，还是可降为20-30张]

**me**: [决策样本量和收集方式]

**Decision**: ⏸️ PENDING

---

### G5: 性能指标缺乏instrumentation

**背景**: SC-008/015-017定义性能目标，但tasks.md仅有"通用性能测试"

**cc**: 建议添加具体指标监控任务

**补充任务**:
```markdown
### Phase 10: Performance Optimization

- [ ] T150a 配置Lighthouse CI预算
  * 创建lighthouserc.json配置
  * FCP<2s, LCP<2.5s, TTI<3s
  * 每次部署自动运行，未达标阻止merge

- [ ] T150b 在useSalary hook添加性能监控
  ```typescript
  const startTime = performance.now();
  const result = calculateMonthlySummary(...);
  const duration = performance.now() - startTime;

  if (duration > 1000) {
    console.warn('Salary calculation slow:', duration, 'ms');
  }
  // 对应SC-008: <1s刷新
  ```

- [ ] T150c 在MonthCalendar添加render profiling
  * React DevTools Profiler API监控渲染时间
  * 超500ms时console.warn
  * 对应SC-016: 日历切换<500ms

- [ ] T150d 关联性能测试到Success Criteria
  * T150运行时验证SC-008 (<1s)
  * T150运行时验证SC-015-017 (FCP<2s等)
  * 生成性能报告: docs/performance-report.md
```

**MVP简化方案**:
```markdown
- Lighthouse CI → Post-MVP（手动Lighthouse足够）⏸️
- Console性能日志 → MVP保留 ✅
- 自动化性能回归测试 → Post-MVP ⏸️
```

**cx**: [评估instrumentation粒度]

**me**: [决策]

**Decision**: ⏸️ PENDING

---

## 🟡 MEDIUM Risks (对齐需要)

### A1: 技术栈选择未文档化

**背景**: Plan.md:28-39标注"NEEDS CLARIFICATION"，但tasks.md已使用react-router-dom+Zustand

**cc**: 建议在plan.md记录决策理由

**补充内容**:
```markdown
### plan.md Technical Context修改

## 修改位置: plan.md:28-29

## 修改前
- NEEDS CLARIFICATION: React Router vs TanStack Router for routing
- NEEDS CLARIFICATION: Zustand vs Jotai for state management

## 修改后
**Routing**: React Router DOM v6
- 理由: 社区成熟（weekly 10M+ downloads）、文档完善、与React 19兼容
- 备选TanStack Router排除原因: 较新（学习曲线），MVP不需要type-safe routing

**State Management**: Zustand
- 理由: 极简API（无boilerplate）、包体积小（3KB）、易于测试、支持persist
- 备选Jotai排除原因: Atom模式对简单场景过度设计
```

同步tasks.md:23（已使用正确依赖）

**cx**: [确认技术选型理由是否充分]

**me**: [决策]

**Decision**: ⏸️ PENDING

---

### A2: E2E测试范围不一致

**背景**: Plan说"Playwright E2E"，Tasks说"不包含E2E (Post-MVP)"

**cc**: 建议统一为"E2E延后至Post-MVP"

**修改位置**:
```markdown
### plan.md:36-40

## 修改前
**Testing**:
- Vitest (unit tests for salary calculation engine)
- React Testing Library (component tests)
- Playwright (E2E tests for critical flows - NEEDS CLARIFICATION: 是否在MVP階段需要E2E)

## 修改后
**Testing**:
- Vitest (unit tests for salary calculation engine)
- React Testing Library (component tests)
- Integration Tests (Vitest + MSW for API mocking)
- E2E Tests (Playwright) - ⏸️ Deferred to Post-MVP

**Rationale**: MVP聚焦Unit + Integration覆盖，E2E成本高且CI复杂，用户手动测试足够
```

**cx**: [确认MVP是否完全不需要E2E]

**me**: [决策]

**Decision**: ⏸️ PENDING

---

### A3 & I1: Spec内部冲突

**背景**: spec.md:155说"PH OT=2×"，:193说"额外1日薪+1.5×OT"

**cc**: 建议修正155行以对齐193行正确规则

**修改位置**:
```markdown
### spec.md:155

## 修改前
- 公共假期加班（PH）→ 系统自动应用2倍加班费（而非1.5倍）

## 修改后
- 公共假期加班（PH）→ 系统自动应用额外1日基本薪+超时1.5×OT规则
```

**cx**: [确认]

**me**: [决策]

**Decision**: ⏸️ PENDING

---

### U1: 无需求关联的技术任务

**背景**: T069/T136/T137/T140（serverless API/虚拟滚动/缓存/code splitting）无明确需求

**cc**: 建议要么关联需求，要么defer

**分析**:
```markdown
| Task | 当前状态 | 建议 |
|------|---------|------|
| T069 (salary serverless API) | 可选 | → 关联FR-033（导出工资单需服务端渲染PDF）或defer |
| T136 (日历虚拟滚动) | 过度优化 | → Defer (MVP仅1个月日历，30天无需虚拟滚动) |
| T137 (薪资缓存) | 已有monthly_salaries表 | → 保留（关联FR-026实时计算优化）|
| T140 (code splitting) | 性能优化 | → 关联SC-015（FCP<2s）或defer |
```

**cx**: [评估哪些可defer]

**me**: [决策]

**Decision**: ⏸️ PENDING

---

## 📊 Summary Dashboard

| Category | Total | Approved | Rejected | Pending |
|----------|-------|----------|----------|---------|
| CRITICAL | 3 | 0 | 0 | 3 |
| HIGH | 5 | 0 | 0 | 5 |
| MEDIUM | 4 | 0 | 0 | 4 |
| **Total** | **12** | **0** | **0** | **12** |

---

## 🎯 Next Actions

**等待CX Review**:
1. 评估C1&C2 MOM规则复杂度是否必要
2. 确认C3 OCR测试任务粒度
3. 决策G1-G5哪些可降级或defer
4. 验证技术选型理由（A1）

**等待ME Decision**:
1. 最终确认Constitution修改方案
2. 批准任务补充计划
3. 明确MVP最小范围

**Ready to Execute** (一旦批准):
- [ ] 修改Constitution
- [ ] 更新tasks.md（添加新任务+调整编号）
- [ ] 修改spec.md（修正冲突）
- [ ] 更新plan.md（记录决策）

---

## 💡 Alternative Collaboration Methods

**cc**: 除了这个markdown文档，还可以考虑：

### 方案1: Issue-based Workflow (推荐给大团队)
```markdown
在GitHub Issues中创建:
- Issue #1: [CRITICAL] Constitution PH/休息日规则冲突
- Issue #2: [CRITICAL] OCR测试缺失
...

优点: 可追踪、可assign、有notification
缺点: 需要GitHub，流程较重
```

### 方案2: Inline Comments (适合快速迭代)
```markdown
直接在spec.md/tasks.md中添加注释:

<!--
@cc: 建议修改此处PH规则
@cx: 同意，理由...
@me: 批准执行
-->

优点: 上下文清晰、修改直观
缺点: 难以追踪历史讨论
```

### 方案3: Kanban Board (可视化进度)
```markdown
创建 docs/audit-kanban.md:

| TODO | IN REVIEW | APPROVED | DONE |
|------|-----------|----------|------|
| C1&C2 | - | - | - |
| C3 | - | - | - |

优点: 一目了然状态
缺点: 缺少详细讨论内容
```

### 方案4: 当前Markdown方案 (推荐给你们的场景)
```markdown
优点:
✅ 单一真相来源（single source of truth）
✅ 结构化讨论（按优先级分类）
✅ 决策记录清晰（decision markers）
✅ 易于版本控制（git diff友好）

缺点:
⚠️ 需要手动更新状态
⚠️ 无自动通知机制
```

**我的建议**: 当前Markdown方案最适合你们（2-3人协作、快速迭代、需要详细讨论记录）

**cx**: [CX是否同意此协作方式，或有更好建议]

**me**: [最终选择协作方式]

---

**Document Version**: v1.0
**Last Updated**: 2025-11-06 by CC
**Status**: 等待CX首次Review
