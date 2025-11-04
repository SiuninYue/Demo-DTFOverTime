# skills_mother

> 专业的Skill创建助手，通过对话自动生成符合官方规范的完整Skill包

## 功能概述

这个 Skill 可以帮助你：
- 通过6-9个结构化问题快速理解需求，无需繁琐的技术细节
- 智能判断文件结构，根据复杂度动态生成SKILL.md、REFERENCE、EXAMPLES、scripts等文件
- 自动生成符合Claude Agent Skills官方规范的标准化文档
- 预览确认所有内容，支持修改和迭代优化
- 自动执行质量检查，确保文件命名、YAML格式、目录结构正确
- 支持批量创建多个协作的Skills，并生成主控文件

## 快速开始

### 1. 配置 Skill

在你的项目中创建以下目录结构：
```
D:/Projects/.claude/skills/skills_mother/
├── SKILL.md
├── REFERENCE_WORKFLOW.md
├── EXAMPLES.md
└── README.md
```

### 2. 使用方法

**方式 1：自然语言触发**

直接告诉 Claude：
- "帮我创建一个skill"
- "我想做个新的skill"
- "需要开发一个skill来..."
- "能帮我生成一个skill吗"

**方式 2：描述具体需求**

更具体地描述你的需求，Claude会自动识别并调用这个Skill：
- "创建一个分析CSV数据的skill"
- "我想做一个自动生成API文档的skill"
- "帮我开发一个产品PRD生成器"

### 3. 示例对话

**场景1：创建简单Skill**
```
你：帮我创建一个skill，用来分析CSV数据

Claude：[自动调用 skills_mother]

我会通过几个问题帮你快速创建一个标准的 Skill。

Q1：这个 Skill 的名称是什么？（建议用小写+下划线，如 csv_analyzer）
Q2：它要解决什么问题？用一句话描述核心功能。
Q3：什么时候会用到它？触发场景是什么？

[继续问答流程...]
[生成完整的Skill包]
[预览并确认]
[写入文件]

✅ Skill创建成功！位置：.claude/skills/csv_analyzer/
```

**场景2：批量创建协作Skills**
```
你：我想创建一套产品开发流程的skills，从PRD到设计到开发

Claude：[自动调用 skills_mother]

看起来你需要创建多个相关的 Skills。我可以帮你：

1️⃣ 一次性规划整个工作流
2️⃣ 逐个创建每个 Skill

[引导用户完成批量创建]
[生成CLAUDE.md主控文件]
```

## 配置要点

### YAML 头部
- `name`: skills_mother
- `description`: 包含"创建skill"、"生成skill"、"skill开发"等触发关键词
- `allowed-tools`: create_file, bash_tool, view 等文件操作工具

### 触发关键词

Claude 会在以下情况自动调用这个 Skill：
- 创建skill
- 生成skill
- 新建skill
- 开发skill
- 帮我做个skill
- skill开发助手
- skill creator

### 工作流程

1. **需求收集**（6-9个问题，分3轮）
   - 第一轮：名称、功能、场景（必问）
   - 第二轮：输入、输出、流程（必问）
   - 第三轮：Reference、脚本、示例（智能判断）

2. **智能规划**
   - 自动判断需要生成哪些文件
   - 展示完整的生成计划
   - 等待用户确认

3. **内容生成**
   - 生成所有文件的完整内容
   - 遵循官方规范和最佳实践

4. **预览确认**
   - 完整展示所有文件内容
   - 提供5个检查要点
   - 支持修改和重新生成

5. **文件写入**
   - 创建目录结构
   - 按顺序写入所有文件
   - 自动验证文件格式

6. **后续支持**
   - 修改触发关键词
   - 优化执行流程
   - 新增示例或Reference
   - 批量创建多个Skills

## 文件说明

| 文件 | 用途 | 大小 |
|------|------|------|
| SKILL.md | 核心技能定义，包含完整的6阶段工作流程 | ~5KB |
| REFERENCE_WORKFLOW.md | 完整的工作流程规范、文件结构、质量检查清单 | ~25KB |
| EXAMPLES.md | 5个详细使用案例（简单、中等、高级、修改、批量） | ~15KB |
| README.md | 使用说明书（当前文件） | ~5KB |

## 生成的Skill包结构

一个标准的Skill包可能包含：
```
.claude/skills/<skill_name>/
    ├── SKILL.md          # 必需：核心技能文件
    ├── REFERENCE_<NAME>.md # 可选：参考文档
    ├── EXAMPLES.md       # 可选：详细示例
    ├── README.md         # 必需：使用说明
    ├── scripts/          # 可选：Python脚本
    │   └── <name>.py
    └── templates/        # 可选：模板文件
        └── <name>.md
```

## 注意事项

⚠️ **重要提醒：**

1. **命名规范严格**：
   - SKILL.md、README.md、EXAMPLES.md 必须全大写
   - REFERENCE 格式为 REFERENCE_<NAME>.md
   - 目录和脚本使用小写+下划线

2. **YAML字段限制**：
   - name ≤ 64字符
   - description ≤ 1024字符
   - description必须包含：功能+场景+触发关键词

3. **预览优先原则**：
   - 所有内容生成后会完整展示
   - 必须用户确认后才写入文件
   - 支持随时修改和重新生成

4. **智能而非固定**：
   - 不是每个Skill都需要5个文件
   - 简单需求只生成SKILL.md + README.md
   - 根据复杂度动态调整文件结构

5. **避免模糊表述**：
   - 执行流程必须具体可操作
   - 禁止"根据情况处理"等模糊描述
   - 使用占位符而非固定内容

## 常见问题

### Q：创建一个Skill需要多长时间？

**A：** 取决于复杂度：
- 简单Skill（3个文件）：5-7分钟
- 中等Skill（4个文件）：8-12分钟
- 复杂Skill（5个文件）：15-20分钟
- 批量创建（多个Skills）：每个8-10分钟

### Q：我不懂技术细节，也能创建Skill吗？

**A：** 完全可以！你只需要：
1. 能描述你想要什么功能
2. 能说清楚什么时候用
3. 能大致说明执行步骤

技术细节（YAML格式、文件结构、命名规范）全部由skills_mother自动处理。

### Q：生成的Skill不满意怎么办？

**A：** 有两种方式：
1. **预览阶段修改**：在内容展示后，选择"2️⃣ 需要修改某些部分"
2. **生成后修改**：告诉我"修改xxx的触发关键词"或"优化xxx的执行流程"

### Q：可以查看其他人创建的Skill案例吗？

**A：** 查看 EXAMPLES.md 文件，里面有5个详细的使用案例：
- 示例1：简单的CSV分析Skill
- 示例2：中等复杂的API文档生成Skill
- 示例3：高级的PRD生成Skill
- 示例4：修改已有Skill
- 示例5：批量创建协作Skills

### Q：如何让Claude自动调用我的Skill？

**A：** 关键在于YAML头部的description字段。确保包含：
1. **功能描述**：这个Skill能做什么
2. **使用场景**：什么时候会用到
3. **触发关键词**：用户可能说的话（如"分析CSV"、"生成报告"）

示例：
```yaml
description: 自动分析CSV文件并生成统计报告。适用于数据分析师需要快速了解数据特征时。触发关键词：分析CSV、CSV分析、数据统计、CSV报告。
```

### Q：可以创建中文命名的Skill吗？

**A：** 不建议。虽然技术上可行，但官方规范建议：
- Skill名称：小写英文+下划线（如 csv_analyzer）
- 文件名：全大写英文（如 SKILL.md）

这样可以避免跨平台的兼容性问题。

## 版本信息

- 创建时间：2025-11-02
- 版本：1.0.0
- 维护者：Skill Creator

## 快速命令

常用的修改命令：
```
"修改 <skill_name> 的触发关键词"
"优化 <skill_name> 的执行流程"
"为 <skill_name> 添加新示例"
"更新 <skill_name> 的Reference"
"帮我创建配套的CLAUDE.md主控文件"
```

---

*本 Skill 由 Skill Creator 生成*