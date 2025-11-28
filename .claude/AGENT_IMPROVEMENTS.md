# Agent 系统改善建议
**Version**: 1.0.0
**Purpose**: 高级优化建议与未来发展方向

---

## I. 立即可实施的改善

### 1.1 Agent Context Manager (上下文监控器)

**问题**: 目前依赖手动判断何时使用 Sub-Agent

**解决方案**: 创建自动监控 Skill

**实现**:

```yaml
# .claude/skills/context_monitor/SKILL.md
---
name: context_monitor
description: 自动监控主 Agent token 使用率，建议何时切换到 Sub-Agent 或清理上下文
allowed-tools: [view, bash_tool]
---

[执行流程]

自动触发条件:
- 每 5 轮对话后自动检查
- Token 使用率 >50% 时主动提示

检查指标:
1. 当前 token 使用率（从 <token_usage> 标签）
2. 最近 3 次任务的平均 token 消耗
3. 预测接下来任务的 token 需求

输出建议:
- ✅ 可继续使用主 Agent
- ⚠️ 建议下次任务使用 Sub-Agent
- 🚨 必须立即清理上下文（/clear 或总结）

示例输出:
```
📊 上下文健康检查
- Token 使用: 85K/200K (42.5%) ✅
- 最近任务平均: 12K tokens/任务
- 预测: 剩余任务 ~9 个可在主 Agent 完成

建议: 继续当前模式，探索类任务优先使用 Sub-Agent
```
```

**优势**:
- 自动化决策，减少认知负担
- 数据驱动（基于实际使用率）
- 主动预警，避免上下文溢出

---

### 1.2 Sub-Agent 结果验证器

**问题**: Sub-Agent 返回结果可能不完整或错误

**解决方案**: 标准化验证流程

**实现**:

```typescript
// .claude/scripts/validate_subagent_result.py

def validate_result(result: dict, expected_format: dict) -> dict:
    """
    验证 Sub-Agent 返回结果的完整性

    Args:
        result: Sub-Agent 返回的结果
        expected_format: 期望的格式定义

    Returns:
        {
            "valid": bool,
            "missing_fields": list,
            "suggestions": list
        }
    """

    validation = {
        "valid": True,
        "missing_fields": [],
        "suggestions": []
    }

    # 检查必需字段
    for field in expected_format.get("required_fields", []):
        if field not in result:
            validation["valid"] = False
            validation["missing_fields"].append(field)
            validation["suggestions"].append(
                f"重新提示 Sub-Agent 包含 '{field}' 字段"
            )

    # 检查数据质量
    if "files" in result and len(result["files"]) == 0:
        validation["suggestions"].append(
            "未找到文件，建议：1) 扩大搜索范围 2) 调整关键词 3) 增加 thoroughness"
        )

    # 检查格式
    if expected_format.get("output_format") == "table":
        if not is_markdown_table(result.get("content")):
            validation["suggestions"].append("结果非表格格式，建议重新生成")

    return validation


# 使用示例
expected = {
    "required_fields": ["files", "summary"],
    "output_format": "table"
}

result = validate_result(subagent_output, expected)

if not result["valid"]:
    print(f"⚠️ 验证失败: {result['missing_fields']}")
    print(f"建议: {result['suggestions']}")
```

**集成到 Skill**:

```markdown
[执行流程]

阶段 3: 调用 Sub-Agent
  - 使用 Task tool 执行探索

阶段 4: 验证结果（新增）
  - 使用 validate_subagent_result.py
  - 如验证失败，自动重试（最多 2 次）
  - 如仍失败，向用户报告并请求手动介入

阶段 5: 处理结果
  - 仅在验证通过后继续
```

---

### 1.3 Sub-Agent 成本追踪

**问题**: 无法量化 Sub-Agent 的成本效益

**解决方案**: 记录每次调用的指标

**实现**:

```yaml
# .claude/data/subagent_metrics.json
[
  {
    "timestamp": "2025-11-06T10:30:00Z",
    "subagent_type": "Explore",
    "model": "haiku",
    "task_description": "搜索薪资计算函数",
    "token_used": 8500,
    "duration_seconds": 12,
    "success": true,
    "retry_count": 0,
    "cost_estimate_usd": 0.0017  // $0.0002/1K tokens × 8.5K
  },
  {
    "timestamp": "2025-11-06T11:15:00Z",
    "subagent_type": "general-purpose",
    "model": "sonnet",
    "task_description": "实现动态日薪计算",
    "token_used": 23000,
    "duration_seconds": 45,
    "success": true,
    "retry_count": 1,
    "cost_estimate_usd": 0.069  // $0.003/1K × 23K
  }
]
```

**分析脚本**:

```python
# .claude/scripts/analyze_subagent_costs.py

def generate_cost_report(metrics_file: str):
    """生成 Sub-Agent 成本报告"""

    with open(metrics_file) as f:
        data = json.load(f)

    total_cost = sum(m["cost_estimate_usd"] for m in data)
    total_tokens = sum(m["token_used"] for m in data)
    avg_duration = sum(m["duration_seconds"] for m in data) / len(data)
    success_rate = sum(1 for m in data if m["success"]) / len(data)

    # 按模型分组
    by_model = {}
    for m in data:
        model = m["model"]
        if model not in by_model:
            by_model[model] = {"count": 0, "cost": 0}
        by_model[model]["count"] += 1
        by_model[model]["cost"] += m["cost_estimate_usd"]

    print(f"""
📊 Sub-Agent 成本报告

总览:
- 调用次数: {len(data)}
- 总 Token: {total_tokens:,}
- 总成本: ${total_cost:.4f}
- 平均耗时: {avg_duration:.1f}s
- 成功率: {success_rate:.1%}

按模型:
""")
    for model, stats in by_model.items():
        print(f"  {model}: {stats['count']} 次, ${stats['cost']:.4f}")

    # 优化建议
    haiku_count = by_model.get("haiku", {}).get("count", 0)
    sonnet_count = by_model.get("sonnet", {}).get("count", 0)

    if sonnet_count > haiku_count * 2:
        print("\n💡 优化建议: 探索任务可更多使用 haiku（成本降低 60%）")

# 使用
generate_cost_report(".claude/data/subagent_metrics.json")
```

**优势**:
- 数据驱动的模型选择
- 识别成本优化机会
- 证明 Sub-Agent 的 ROI

---

## II. 中期改善（1-2 周）

### 2.1 智能任务拆分器

**问题**: 手动拆分复杂任务为 Sub-Agent 可执行的子任务

**解决方案**: 自动分析任务复杂度并生成执行计划

**Skill 设计**:

```yaml
---
name: task_decomposer
description: 分析复杂任务，自动拆分为最优的 Sub-Agent 调用序列
---

[执行流程]

输入: 用户的复杂任务描述

阶段 1: 复杂度分析
  - 关键词识别（搜索、实现、重构、测试）
  - 预估范围（文件数量、修改范围）
  - 依赖关系图

阶段 2: 拆分策略
  - 识别可并行的子任务
  - 识别依赖链（A → B → C）
  - 为每个子任务选择最优 Agent 类型

阶段 3: 生成执行计划
  输出 Markdown 格式:
  ```
  ## 执行计划

  ### Phase 1: 探索（并行）
  - [Sub-Agent Explore, haiku] 搜索现有实现
  - [Sub-Agent Explore, haiku] 搜索测试文件

  ### Phase 2: 规划（主 Agent）
  - 与用户讨论设计方案

  ### Phase 3: 实现（串行）
  - [Sub-Agent general-purpose, sonnet] 实现核心逻辑
  - [Sub-Agent general-purpose, haiku] 添加测试

  预估:
  - Token: ~35K (节省 40% vs 主 Agent)
  - 成本: ~$0.08
  - 耗时: ~2 分钟
  ```

阶段 4: 用户确认
  - 显示执行计划
  - 询问: "是否按此计划执行？"
  - 支持调整（如改变并行/串行）

阶段 5: 自动执行
  - 按计划依次调用 Sub-Agent
  - 实时报告进度
  - 自动验证每阶段结果
```

**示例对话**:

```
用户: 实现一个新的薪资计算功能，支持动态日薪

主 Agent: 分析任务复杂度...
- 需要搜索现有代码 ✓
- 需要实现新函数 ✓
- 需要添加测试 ✓
- 预估修改 5-8 个文件

这是一个复杂任务，我为你生成了执行计划：

[显示 3 阶段计划]

预计节省 40% token（35K vs 60K），成本 $0.08
是否按此计划执行？

用户: 确认

主 Agent: 开始执行...

[Phase 1/3] 探索阶段（并行 2 个 Sub-Agent）
✅ 找到 3 个相关函数
✅ 找到 2 个测试文件

[Phase 2/3] 规划阶段
设计方案: ...
是否继续？

[Phase 3/3] 实现阶段
✅ 实现核心逻辑（23K tokens）
✅ 添加测试（8K tokens）

✅ 任务完成！总 token: 31K，成本: $0.07
```

---

### 2.2 Sub-Agent 模板库

**问题**: 重复编写类似的 Sub-Agent prompt

**解决方案**: 预定义常用场景的模板

**实现**:

```yaml
# .claude/templates/subagent_prompts.yaml

templates:
  search_functions:
    description: 搜索特定功能的函数
    subagent_type: Explore
    model: haiku
    prompt_template: |
      请搜索所有与 {{keyword}} 相关的函数。

      目标:
      - 文件路径 + 行号
      - 函数签名
      - 功能概要

      范围: {{scope}}
      关键词: {{keywords}}

      返回 Markdown 表格格式

    variables:
      keyword: required
      scope: default "src/"
      keywords: required (list)

  implement_feature:
    description: 实现新功能
    subagent_type: general-purpose
    model: sonnet
    prompt_template: |
      实现以下功能：

      {{feature_description}}

      文件位置:
      {{#each files}}
      - {{this.path}}: {{this.purpose}}
      {{/each}}

      测试要求:
      {{#each test_cases}}
      - {{this}}
      {{/each}}

      约束条件:
      - 禁止修改: {{no_modify}}
      - 代码风格: {{code_style}}

      返回:
      - 实现代码片段
      - 测试结果
      - 需要讨论的问题

    variables:
      feature_description: required
      files: required (list)
      test_cases: required (list)
      no_modify: default "node_modules/"
      code_style: default "项目现有风格"

  refactor_code:
    description: 重构代码
    subagent_type: general-purpose
    model: sonnet
    prompt_template: |
      重构以下代码：

      目标: {{goal}}
      范围: {{scope}}

      重构规则:
      {{#each rules}}
      - {{this}}
      {{/each}}

      保持:
      - 功能不变（所有测试必须通过）
      - API 兼容（函数签名不变）

      返回:
      - Git diff 摘要
      - 测试结果
      - 性能对比（如适用）
```

**使用示例**:

```python
# .claude/scripts/use_template.py

def generate_from_template(template_name: str, variables: dict):
    """从模板生成 Sub-Agent prompt"""

    with open(".claude/templates/subagent_prompts.yaml") as f:
        templates = yaml.safe_load(f)

    template = templates["templates"][template_name]

    # 验证必需变量
    for var, meta in template["variables"].items():
        if meta == "required" and var not in variables:
            raise ValueError(f"缺少必需变量: {var}")

    # 应用默认值
    for var, meta in template["variables"].items():
        if isinstance(meta, str) and meta.startswith("default"):
            default = meta.split(" ", 1)[1]
            variables.setdefault(var, default)

    # 渲染 prompt
    from jinja2 import Template
    prompt = Template(template["prompt_template"]).render(**variables)

    return {
        "subagent_type": template["subagent_type"],
        "model": template["model"],
        "prompt": prompt
    }


# 使用
params = generate_from_template("search_functions", {
    "keyword": "REST 日计薪",
    "keywords": ["calculateRestDayPay", "rest_day", "statutory"]
})

Task(**params)
```

**优势**:
- 标准化 prompt 结构
- 减少错误（必需字段验证）
- 知识积累（最佳实践模板化）

---

### 2.3 Agent 协作协议

**问题**: Skill 与 Sub-Agent 之间的接口不标准

**解决方案**: 定义标准化的输入/输出格式

**协议定义**:

```yaml
# .claude/protocols/agent_communication.yaml

# Sub-Agent 输入协议
input_schema:
  type: object
  required: [subagent_type, description, prompt]
  properties:
    subagent_type:
      enum: [Explore, Plan, general-purpose]
    description:
      type: string
      maxLength: 50
      description: 简短任务描述（5-10 字）
    model:
      enum: [haiku, sonnet, opus]
      default: sonnet
    prompt:
      type: string
      format: |
        [上下文]（可选）
        之前对话的关键信息

        [目标]（必需）
        明确的任务目标

        [范围]（必需）
        搜索/修改范围限制

        [约束]（可选）
        禁止操作/规则

        [输出格式]（必需）
        Markdown/Table/JSON/Code

# Sub-Agent 输出协议
output_schema:
  type: object
  required: [status, summary, details]
  properties:
    status:
      enum: [success, partial_success, failed]
    summary:
      type: string
      maxLength: 200
      description: 1-3 句话总结
    details:
      type: object
      description: 详细结果（格式自定义）
    issues:
      type: array
      items:
        type: object
        properties:
          severity: [warning, error]
          message: string
          suggestion: string
    metadata:
      type: object
      properties:
        token_used: integer
        duration_seconds: integer
        files_modified: array

# 示例
example_output:
  status: success
  summary: 找到 3 个 REST 日计薪函数，其中 2 个需要修改
  details:
    functions:
      - file: src/services/salaryEngine.ts
        line: 45
        name: calculateRestDayPay
        issue: 未区分雇主/员工要求
      - file: src/utils/salary.ts
        line: 120
        name: getRestDayBase
        issue: 使用固定倍数，需改为分段计算
  issues:
    - severity: warning
      message: 发现过时的计算方法
      suggestion: 参考 MOM 最新规定更新
  metadata:
    token_used: 8500
    duration_seconds: 12
    files_modified: []
```

**验证工具**:

```python
# .claude/scripts/validate_protocol.py

from jsonschema import validate

def validate_subagent_output(output: dict):
    """验证 Sub-Agent 输出是否符合协议"""

    with open(".claude/protocols/agent_communication.yaml") as f:
        protocol = yaml.safe_load(f)

    schema = protocol["output_schema"]

    try:
        validate(instance=output, schema=schema)
        print("✅ 输出符合协议")
        return True
    except Exception as e:
        print(f"❌ 协议违规: {e}")
        return False
```

**强制执行**（集成到 Skills）:

```markdown
[执行流程]

阶段 3: 调用 Sub-Agent
  - 生成符合输入协议的 prompt
  - 使用 Task tool 执行

阶段 4: 验证输出
  - 使用 validate_protocol.py 检查
  - 如不符合，记录警告并尝试修复
  - 如无法修复，回退到宽松模式

阶段 5: 处理结果
  - 基于标准化格式提取信息
  - 统一错误处理
```

---

## III. 长期改善（1-2 月）

### 3.1 Sub-Agent 学习系统

**愿景**: Sub-Agent 从历史执行中学习，优化未来的 prompt

**实现思路**:

1. **记录每次执行**:
   - 输入 prompt
   - 输出质量评分（用户反馈 👍👎）
   - 是否需要重试
   - 最终成功的 prompt（如有调整）

2. **分析模式**:
   - 高质量 prompt 的共同特征
   - 常见失败原因
   - 最优 model 选择（按任务类型）

3. **生成建议**:
   ```
   基于 50 次类似任务，建议：
   - Model: haiku → sonnet（准确率 +15%）
   - Prompt: 添加 "返回 Markdown 表格" → 格式符合率 +40%
   - Scope: 排除 node_modules/ → 速度提升 2x
   ```

4. **自动优化**:
   ```python
   def optimize_prompt(task_type: str, initial_prompt: str):
       """基于历史数据优化 prompt"""

       history = load_history(task_type)

       # 分析成功案例
       successful = [h for h in history if h["success"] and h["rating"] >= 4]

       # 提取共同模式
       patterns = extract_patterns(successful)

       # 应用到新 prompt
       optimized = apply_patterns(initial_prompt, patterns)

       return optimized
   ```

---

### 3.2 分布式 Sub-Agent 网络

**愿景**: 多个 Sub-Agent 协作完成超大型任务

**架构**:

```
Coordinator Agent (主控)
│
├─ Worker 1: 探索前端代码
├─ Worker 2: 探索后端代码
├─ Worker 3: 探索测试文件
│
└─ Aggregator: 合并结果
```

**通信机制**:

```yaml
# Sub-Agent 间消息传递
message_queue:
  - from: Worker1
    to: Aggregator
    type: partial_result
    payload:
      frontend_routes: [...]

  - from: Worker2
    to: Aggregator
    type: partial_result
    payload:
      backend_endpoints: [...]

  - from: Aggregator
    to: Coordinator
    type: final_result
    payload:
      route_mapping: {...}
```

**优势**:
- 处理超大代码库（>100K 行）
- 极致并行化（5+ Sub-Agent 同时工作）
- 容错性（单个 Worker 失败不影响整体）

---

### 3.3 可视化 Agent Dashboard

**愿景**: Web UI 实时监控 Agent 状态

**功能**:

1. **实时监控**:
   - 当前活跃 Sub-Agent 数量
   - Token 使用率实时图表
   - 任务队列状态

2. **历史分析**:
   - 按日/周/月的成本趋势
   - 成功率热力图
   - 最常用的 Sub-Agent 类型

3. **交互控制**:
   - 暂停/恢复 Sub-Agent
   - 调整优先级
   - 手动触发清理

**技术栈**:
```
Frontend: React + Recharts
Backend: FastAPI (读取 .claude/data/)
实时更新: Server-Sent Events
```

---

## IV. 优先级总结

### 🔥 立即实施（本周）

1. ✅ **Context Monitor Skill**: 自动化 token 监控
2. ✅ **结果验证器**: 标准化 Sub-Agent 输出验证
3. ✅ **成本追踪**: 建立 metrics 记录系统

**理由**: 低成本、高价值、立即见效

---

### ⚡ 短期实施（2 周内）

4. **任务拆分器 Skill**: 自动化复杂任务规划
5. **Sub-Agent 模板库**: 减少重复 prompt 编写
6. **协作协议**: 标准化接口

**理由**: 提升开发效率，减少认知负担

---

### 🚀 长期规划（1-2 月）

7. **学习系统**: AI 驱动的 prompt 优化
8. **分布式网络**: 处理超大型任务
9. **可视化 Dashboard**: 全面监控与控制

**理由**: 需要数据积累和架构升级

---

## V. ROI 估算

### Context Monitor

- **投入**: 2 小时开发
- **收益**: 减少 30% 上下文溢出，节省 ~10 次 `/clear` 中断
- **ROI**: 15x

### 结果验证器

- **投入**: 3 小时开发
- **收益**: 减少 50% Sub-Agent 重试，节省 ~$0.50/月
- **ROI**: 有限但提升质量

### 任务拆分器

- **投入**: 8 小时开发
- **收益**: 节省 40% 规划时间，提升 25% token 效率
- **ROI**: 5x（长期更高）

---

## VI. 下一步行动

建议按以下顺序实施：

```
Week 1:
[ ] 创建 context_monitor Skill
[ ] 添加 subagent_metrics.json 记录
[ ] 实现基础结果验证

Week 2:
[ ] 扩展验证器功能
[ ] 生成第一份成本报告
[ ] 设计任务拆分器接口

Week 3-4:
[ ] 实现任务拆分器
[ ] 创建模板库（5-10 个常用场景）
[ ] 定义协作协议 v1.0
```

---

**维护者**: Claude Code User
**最后更新**: 2025-11-06
