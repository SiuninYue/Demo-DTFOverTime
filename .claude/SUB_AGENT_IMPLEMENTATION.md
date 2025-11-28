# Sub-Agent Implementation Guide
**Version**: 1.0.0
**Purpose**: Sub-Agent 系统实战指南与代码示例

---

## I. 快速开始

### 1.1 基本调用语法

**探索类任务**（搜索/分析代码）:
```markdown
用户: 找到所有处理 REST 日计薪的函数

主 Agent 思考: 这需要多次 grep/搜索，token 消耗 >15K，使用 Sub-Agent

主 Agent 调用:
Task(
  subagent_type: "Explore",
  description: "搜索 REST 日计薪函数",
  model: "haiku",
  prompt: "
请搜索所有与 REST 日加班计薪相关的函数。

目标:
- 文件路径 + 行号
- 函数签名
- 当前实现逻辑概要

范围限制:
- 仅搜索 src/services/ 和 src/utils/
- 关键词: calculateRestDayPay, rest_day, statutory

返回 Markdown 表格格式
  "
)
```

**实现类任务**（写代码/重构）:
```markdown
用户: 实现新的日薪计算功能

主 Agent 思考: 需要修改多个文件，逻辑复杂，使用 Sub-Agent

主 Agent 调用:
Task(
  subagent_type: "general-purpose",
  description: "实现动态日薪计算",
  prompt: "
根据以下需求实现日薪计算功能：

需求:
1. 根据工作制度（5天/5.5天/6天）动态计算当月工作日数
2. 日薪 = 月薪 ÷ 当月工作日数
3. 排除公众假期

实现位置:
- 新增函数: src/utils/salaryCalculator.ts
- 新增测试: src/utils/__tests__/salaryCalculator.test.ts

返回:
- 实现的函数签名
- 测试覆盖的场景列表
- 任何需要讨论的边界情况
  "
)
```

### 1.2 返回格式约定

**主 Agent 处理 Sub-Agent 结果**:
```markdown
<function_results>
<result><name>Task</name>
<output>
[Sub-Agent 报告内容]
找到 3 个相关函数：

1. src/services/salaryEngine.ts:45 - calculateRestDayPay()
   - 实现: 基础报酬 + 加班费
   - 问题: 未区分雇主/员工要求

2. ...
</output>
</result>
</function_results>

主 Agent 总结给用户:
找到 3 个 REST 日计薪函数：
- salaryEngine.ts:45 `calculateRestDayPay()` - 需添加 initiatedBy 参数
- ...

下一步建议: 修改函数签名支持 employer/employee 模式
```

---

## II. 实战场景

### 2.1 场景: 依赖审计与升级

**任务描述**: 检查过时依赖并生成升级方案

**为什么用 Sub-Agent**:
- 需读取 package.json, package-lock.json
- 需搜索代码中的 API 使用
- 需 WebSearch 查找 breaking changes
- Token 消耗 >20K

**实现步骤**:

```markdown
# Step 1: 启动 Sub-Agent
Task(
  subagent_type: "general-purpose",
  description: "审计 Supabase 依赖",
  model: "haiku",  # 初步探索用 haiku
  prompt: "
请完成以下依赖审计任务：

1. 读取 package.json，识别 Supabase 相关依赖
2. 运行 npm outdated 检查版本
3. 搜索代码中使用 @supabase/auth-helpers-react 的位置
4. WebSearch: 'Supabase auth-helpers deprecated 2025'

返回:
## 当前状态
- 依赖列表 (名称 | 当前版本 | 最新版本)

## 使用位置
- 文件路径 + 代码片段

## 迁移建议
- 官方迁移文档链接
- 需要修改的 API 清单
  "
)

# Step 2: 主 Agent 处理结果
收到 Sub-Agent 报告后:
1. 总结关键发现（deprecated 包、breaking changes）
2. 询问用户: "是否继续生成迁移方案？"

# Step 3: 如用户确认，启动实现 Sub-Agent
Task(
  subagent_type: "general-purpose",
  description: "执行 Supabase 迁移",
  model: "sonnet",  # 实现用 sonnet
  prompt: "
根据审计结果，执行以下迁移：

1. 更新 package.json:
   - 移除 @supabase/auth-helpers-react
   - 添加 @supabase/ssr@latest

2. 修改代码:
   - src/lib/supabase.ts: createClientComponentClient → createBrowserClient
   - 所有使用 useSupabaseClient 的组件

3. 运行测试验证

返回:
- 修改的文件列表
- 测试结果（pass/fail）
- 遇到的问题
  "
)
```

### 2.2 场景: 功能探索与文档

**任务描述**: 理解现有代码的架构并生成文档

**为什么用 Sub-Agent**:
- 需递归探索多层调用
- 需理解数据流
- 输出内容较长（文档）

**实现**:

```markdown
Task(
  subagent_type: "Explore",
  description: "分析薪资计算架构",
  model: "sonnet",  # 需要深度理解用 sonnet
  prompt: "
请分析薪资计算系统的架构：

1. 入口函数识别
   - 从 UI 调用开始追踪

2. 数据流分析
   - 输入: 用户排班 + 打卡记录
   - 中间处理: 各类计算函数
   - 输出: 月度工资汇总

3. 关键算法
   - 时薪计算
   - 加班费计算（按日期类型）
   - 勤工奖计算

4. 依赖关系
   - 外部依赖（Supabase, MOM 数据）
   - 内部依赖（工具函数）

返回 Mermaid 流程图 + Markdown 文档:
## 架构概览
[流程图]

## 核心函数
| 函数名 | 位置 | 职责 | 依赖 |

## 数据模型
[TypeScript 接口定义]
  "
)
```

### 2.3 场景: 批量重构

**任务描述**: 将硬编码值提取为配置

**为什么用 Sub-Agent**:
- 需修改 >10 个文件
- 需保证一致性
- 需要回滚能力

**实现**:

```markdown
# Step 1: 探索阶段
Task(
  subagent_type: "Explore",
  description: "查找硬编码配置",
  model: "haiku",
  prompt: "
搜索所有硬编码的配置值：
- 时薪除数: 190.67
- 加班倍数: 1.5, 2.0
- MC 阈值: 1, 3, 4
- 发薪日: 7

返回:
| 文件 | 行号 | 硬编码值 | 用途 |
  "
)

# Step 2: 规划阶段（主 Agent）
根据 Sub-Agent 报告:
1. 设计配置结构（src/config/salary.ts）
2. 确认常量命名（HOURLY_RATE_DIVISOR）
3. 询问用户确认

# Step 3: 实现阶段
Task(
  subagent_type: "general-purpose",
  description: "提取配置到常量",
  model: "sonnet",
  prompt: "
执行以下重构：

1. 创建 src/config/salary.ts:
```typescript
export const SALARY_CONFIG = {
  HOURLY_RATE_DIVISOR: 190.67,
  OT_MULTIPLIERS: {
    NORMAL: 1.5,
    STATUTORY_REST_DAY: { BASE: [1, 2], OT: 1.5 }
  },
  // ...
}
```

2. 替换所有硬编码值为配置引用

3. 运行测试确保无回归

约束:
- 禁止修改测试文件中的期望值
- 保持向后兼容（函数签名不变）

返回:
- Git diff 摘要
- 测试结果
- 需要手动验证的部分
  "
)

# Step 4: 验证阶段（主 Agent）
检查 Sub-Agent 输出:
1. 运行 npm run test
2. 手动审查 Git diff
3. 如有问题，回滚（git reset --hard）
```

---

## III. 进阶技巧

### 3.1 并行执行多任务

**场景**: 同时审计前端和后端依赖

```markdown
# ✅ 正确：单消息多 Task
主 Agent 同时发起:

Task(subagent_type: "general-purpose", description: "审计前端依赖", ...)
Task(subagent_type: "general-purpose", description: "审计后端依赖", ...)

优势: 节省等待时间（并行执行）
```

**场景**: 分析多个功能模块

```markdown
Task(subagent_type: "Explore", description: "分析 Auth 模块", ...)
Task(subagent_type: "Explore", description: "分析 Salary 模块", ...)
Task(subagent_type: "Explore", description: "分析 Schedule 模块", ...)
```

### 3.2 增量探索策略

**问题**: 不确定搜索范围时如何避免浪费

**解决方案**: 递进式 thoroughness

```markdown
# 第一次尝试（快速扫描）
Task(
  subagent_type: "Explore",
  description: "快速查找配置文件",
  model: "haiku",
  prompt: "thoroughness: quick - 查找名为 config.ts 或 settings.ts 的文件"
)

# 如果未找到，扩大范围
Task(
  subagent_type: "Explore",
  description: "中等深度搜索",
  model: "haiku",
  prompt: "thoroughness: medium - 搜索所有包含 'SALARY' 常量的文件"
)

# 最后尝试（全面搜索）
Task(
  subagent_type: "Explore",
  description: "全面搜索配置",
  model: "sonnet",  # 升级到 sonnet
  prompt: "thoroughness: very thorough - 分析所有 .ts 文件，找到配置模式"
)
```

### 3.3 上下文继承

**问题**: Sub-Agent 无法看到之前的对话

**解决方案**: 在 prompt 中传递必要上下文

```markdown
Task(
  subagent_type: "general-purpose",
  description: "实现 REST 日计薪",
  prompt: "
[上下文]
用户已确认需要实现 MOM Part IV 的 REST 日计薪规则。
之前的探索发现现有函数位于 src/services/salaryEngine.ts:45

[需求]
修改 calculateRestDayPay() 函数，新增参数：
- initiatedBy: 'employer' | 'employee'
- halfDayThreshold: number (默认 4 小时)

[实现要求]
...
  "
)
```

### 3.4 错误恢复

**场景**: Sub-Agent 执行失败或结果不符合预期

```markdown
# 第一次尝试失败
<result><name>Task</name><error>无法找到指定文件</error></result>

# 主 Agent 调整策略
分析失败原因: 文件路径可能变更

重试方案:
1. 先用 Glob 搜索文件
2. 将实际路径传递给 Sub-Agent

Task(
  subagent_type: "Explore",
  prompt: "
[已知信息]
通过 Glob 找到实际文件: src/core/salary/calculator.ts (非预期的 src/services/)

[新任务]
分析此文件的 REST 日计薪逻辑...
  "
)
```

---

## IV. Skill 调用 Sub-Agent

### 4.1 何时需要

**Skill 包含大型子任务**:
- 需要探索用户代码库（无法预测结构）
- 需要 WebSearch 获取最新信息
- 数据处理超过 Skill 处理能力

### 4.2 实现模式

**SKILL.md 中的流程定义**:

```markdown
[执行流程]

阶段 1: 需求收集（Skill 执行）
  - 用户交互（3-6 轮问答）
  - 收集参数: <skill_name>, <功能描述>, <触发场景>

阶段 2: 代码库分析（调用 Sub-Agent）
  - 检测用户是否已有类似 Skill
  - 工具: Task(subagent_type="Explore")
  - 输入: Skill 名称关键词
  - 输出: 已有 Skill 列表（避免重复）

阶段 3: 文件生成（Skill 执行）
  - 使用模板生成 SKILL.md, README.md
  - 工具: create_file

阶段 4: 验证（调用 Sub-Agent，可选）
  - 如用户请求，验证生成的 Skill 语法
  - 工具: Task(subagent_type="general-purpose", model="haiku")
  - 检查: YAML 格式, Markdown 语法
```

**Skill 代码示例**（伪代码）:

```python
# skills_mother/scripts/analyze_existing_skills.py

def analyze_codebase_for_skills(skill_name: str):
    """调用 Sub-Agent 分析代码库"""

    prompt = f"""
请搜索 .claude/skills/ 目录，查找是否已有与 '{skill_name}' 类似的 Skill。

返回:
- 已有 Skill 列表（名称 + 功能描述）
- 是否建议复用现有 Skill
    """

    # Claude Agent 会识别此注释并调用 Task tool
    # [调用 Task(subagent_type="Explore", prompt=prompt)]

    # 主 Skill 继续处理 Sub-Agent 返回结果
    return result
```

---

## V. 性能优化

### 5.1 Token 成本分析

| 操作 | Token 估算 | 优化策略 |
|------|-----------|---------|
| 探索 10 个文件 | ~8K | 使用 haiku (-60% 成本) |
| 实现单个函数 | ~12K | 使用 sonnet |
| 全项目重构 | ~30K | 拆分为 3 个并行 Sub-Agent |
| 生成文档 | ~5K | 使用 haiku |

### 5.2 速度优化

**并行化 Checklist**:
- [ ] 识别独立子任务
- [ ] 确保无数据依赖
- [ ] 使用单消息多 Task calls
- [ ] 设置合理的 model（haiku 更快）

**示例: 审计多个依赖包**

```markdown
# ❌ 串行执行（慢）
Task(审计 Supabase)  # 等待 20s
Task(审计 React Router)  # 再等 20s
Task(审计 OpenAI SDK)  # 再等 20s
总耗时: 60s

# ✅ 并行执行（快）
[Task(审计 Supabase), Task(审计 React Router), Task(审计 OpenAI SDK)]
总耗时: 25s（并行处理，取最长任务时间）
```

### 5.3 缓存策略

**问题**: 重复搜索相同内容

**解决方案**: 主 Agent 记忆关键信息

```markdown
# 第一次搜索
Task(查找配置文件) → 结果: src/config/salary.ts

# 主 Agent 记录
<记忆> 配置文件位置: src/config/salary.ts

# 后续任务直接使用，无需重新搜索
Task(修改配置文件, 已知路径: src/config/salary.ts)
```

---

## VI. 调试与问题排查

### 6.1 常见错误

**错误 1: Sub-Agent 返回空结果**

```markdown
原因: 搜索范围太窄或关键词不准确
解决:
1. 检查路径是否正确（src/ vs src/services/）
2. 扩大关键词范围（"calculate" → "calc|compute|salary"）
3. 增加 thoroughness: "medium" → "very thorough"
```

**错误 2: Sub-Agent 修改了不应该改的文件**

```markdown
原因: prompt 中未明确约束
解决:
在 prompt 中添加:

约束条件:
- 禁止修改: node_modules/, dist/, .git/
- 仅允许修改: src/services/salaryEngine.ts
- 禁止删除任何函数
```

**错误 3: Sub-Agent 超时**

```markdown
原因: 任务过于复杂或模型选择不当
解决:
1. 拆分为更小的子任务
2. 降级 model: opus → sonnet → haiku
3. 限定搜索范围（exclude: node_modules/）
```

### 6.2 调试技巧

**验证 Sub-Agent 理解**:

```markdown
# 在实际执行前，先让 Sub-Agent 确认理解
Task(
  subagent_type: "Explore",
  description: "确认任务理解",
  model: "haiku",
  prompt: "
请确认你对以下任务的理解：

任务: 查找所有硬编码的时薪计算公式

你的理解:
1. 搜索范围是？
2. 关键词是什么？
3. 期望输出格式？

仅返回理解说明，不执行搜索
  "
)

# 确认理解正确后，再执行实际任务
```

**增量验证**:

```markdown
# Step 1: 仅搜索，不修改
Task(查找目标函数) → 返回文件列表

# 主 Agent 审查结果
确认文件列表正确

# Step 2: 修改第一个文件
Task(修改 fileA.ts) → 返回 diff

# 主 Agent 验证
运行测试，确认无问题

# Step 3: 批量修改剩余文件
Task(修改 fileB.ts, fileC.ts, ...)
```

---

## VII. 检查清单

### 7.1 启动 Sub-Agent 前

- [ ] 任务复杂度 >15K tokens？
- [ ] 无法用主 Agent 工具（Read/Edit/Grep）快速解决？
- [ ] Prompt 是否明确（目标/范围/约束/输出格式）？
- [ ] Model 选择合理（haiku for 探索, sonnet for 实现）？
- [ ] 如需并行，是否所有任务互相独立？

### 7.2 接收 Sub-Agent 结果后

- [ ] 结果是否完整（无"未找到"或"超时"错误）？
- [ ] 结果是否符合预期格式？
- [ ] 是否需要用户确认再继续？
- [ ] 是否需要总结给用户？
- [ ] 下一步行动是什么？

### 7.3 失败时

- [ ] 错误类型（not_found / timeout / incomplete）？
- [ ] 是否可调整 prompt 重试？
- [ ] 是否需要拆分为更小任务？
- [ ] 是否需要切换策略（Sub-Agent → 主 Agent 工具）？

---

## VIII. 示例库

### 8.1 完整示例：实现新功能

**需求**: 实现动态日薪计算

```markdown
[用户请求]
实现根据工作制度动态计算日薪的功能

[主 Agent 评估]
- 需修改多个文件（utils + tests）
- 需要理解现有计算逻辑
- 预计 token >20K
决策: 使用 Sub-Agent

[执行流程]

## Phase 1: 探索
Task(
  subagent_type: "Explore",
  description: "分析现有日薪计算",
  model: "haiku",
  prompt: "查找当前日薪计算逻辑，关键词: dailyRate, daily_rate, 日薪"
)

<result>
找到 2 处：
1. src/utils/salary.ts:89 - 使用固定 ÷26
2. src/services/salaryEngine.ts:123 - 使用固定 ÷26
</result>

主 Agent: 确认需要修改这 2 个文件

## Phase 2: 设计（主 Agent）
与用户讨论:
- 工作制度类型枚举
- 计算公式确认
- 测试场景

用户确认后 → Phase 3

## Phase 3: 实现
Task(
  subagent_type: "general-purpose",
  description: "实现动态日薪计算",
  model: "sonnet",
  prompt: "
实现以下功能：

1. 新增类型定义（src/types/salary.ts）:
   enum WorkScheduleType { FIVE_DAY, FIVE_HALF_DAY, SIX_DAY }

2. 新增函数（src/utils/workingDays.ts）:
   calculateWorkingDays(year, month, scheduleType): number

3. 修改现有函数:
   - src/utils/salary.ts:89
   - src/services/salaryEngine.ts:123
   使用: monthlySalary / calculateWorkingDays(...)

4. 新增测试（src/utils/__tests__/workingDays.test.ts）:
   - 5天制 11月 → 20天
   - 6天制 11月 → 25天
   - 边界情况: 2月（28/29天）

返回:
- 实现的代码（关键部分）
- 测试结果
- 需要讨论的问题
  "
)

<result>
✅ 实现完成
- 3 个新文件，2 个修改
- 测试通过（8/8）
⚠️ 发现问题: 公众假期数据未集成，需手动配置
</result>

## Phase 4: 验证（主 Agent）
1. 运行 npm run test → ✅
2. 手动测试（npm run dev）
3. 询问用户关于公众假期配置

用户: 暂时硬编码 2025 公众假期

## Phase 5: 完善
Task(
  subagent_type: "general-purpose",
  description: "添加公众假期配置",
  model: "haiku",
  prompt: "
在 src/config/publicHolidays.ts 中添加 2025 年新加坡公众假期数据
格式: { date: '2025-01-01', name: 'New Year' }
  "
)

✅ 功能完成
```

---

## IX. 参考资料

- **Governance 框架**: `.claude/SUB_AGENT_GOVERNANCE.md`
- **Claude Code 官方文档**: WebFetch from docs.claude.com
- **Task Tool API**: 参考主 Agent system prompt

---

**维护者**: Claude Code User
**最后更新**: 2025-11-06
