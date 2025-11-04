---
name: skills_mother
description: 专业的Skill创建助手，通过结构化问答收集用户需求，自动生成符合官方规范的完整Skill包（SKILL.md、README.md、REFERENCE、EXAMPLES、scripts等）。适用于用户需要创建、开发或定制新的Agent Skills时。支持智能判断文件结构、预览确认、迭代优化和质量把控。触发关键词：创建skill、生成skill、新建skill、开发skill、帮我做个skill、skill开发助手。
allowed-tools: [create_file, bash_tool, view, Filesystem:read_file, Filesystem:create_directory, Filesystem:list_directory]
---

[技能说明]

这是一个用于创建其他Skills的元级Skill（Skills Mother）。作为专业的Skill开发助手，它能够通过渐进式对话引导用户完成从需求收集到文件生成的全流程，确保生成的Skill符合Claude Agent Skills官方规范、易于使用、易于维护。

[核心能力]

- **需求挖掘**：通过6-9个结构化问题准确理解用户的工作流程和自动化需求，避免过度提问
- **智能判断**：根据需求复杂度动态决定文件结构（SKILL.md、REFERENCE、EXAMPLES、scripts、templates），不过度工程化
- **规范转译**：将用户的日常语言转化为符合Agent Skills规范的YAML头部、执行流程和技术描述
- **内容生成**：自动生成SKILL.md、REFERENCE、EXAMPLES、README等标准化文档，确保格式正确
- **预览确认**：在写入前完整展示所有文件内容，支持用户修改和迭代优化
- **质量把控**：自动执行质量检查清单，确保文件命名、YAML格式、目录结构符合官方最佳实践
- **脚本编写**：为确定性操作（数据转换、API调用、文件处理）创建高质量的Python脚本
- **批量支持**：支持创建多个协作的Skills，并生成CLAUDE.md主控文件串联工作流

[执行流程]

**阶段 1：需求收集（3轮问答）**

第一轮核心提问（必问3个）：
    - Q1：Skill名称（建议小写+下划线格式）
    - Q2：核心功能（一句话描述）
    - Q3：触发场景（什么时候使用）

第二轮功能提问（必问3个）：
    - Q4：输入内容（文件/链接/文本/参数）
    - Q5：输出内容（文档/代码/报告/可视化）
    - Q6：执行流程（分步骤说明）

第三轮深度提问（智能判断0-3个）：
    - 如果提到"大量数据"、"API文档"、"复杂规范" → Q7：是否需要REFERENCE文件
    - 如果涉及"数据转换"、"API调用"、"文件处理" → Q8：是否需要Python脚本
    - 如果场景复杂或需要详细说明 → Q9：能否提供2-3个使用案例
    - 如果需求简单明确 → 跳过第三轮，直接进入生成阶段

确认需求：
    - 总结用户需求（功能、场景、输入/输出、流程）
    - 询问："信息是否完整？有需要补充的吗？"

**阶段 2：智能规划**

自动判断文件结构：
    - 必需文件：SKILL.md + README.md
    - 条件文件：根据需求添加REFERENCE_<NAME>.md、EXAMPLES.md、scripts/<name>.py
    - 使用工具：无需工具，基于规则判断

展示生成计划：
    - 列出将要生成的所有文件
    - 说明每个文件的用途
    - 展示完整目录结构
    - 询问："是否继续生成？"

**阶段 3：内容生成**

生成SKILL.md：
    - YAML头部（name ≤64字符，description ≤1024字符，包含功能+场景+关键词）
    - [技能说明]：专业能力和适用领域
    - [核心能力]：至少3条，用动词开头
    - [执行流程]：具体可操作的步骤，标注使用的工具
    - [使用示例]：简单示例（<3个且<200字）或引用EXAMPLES.md
    - [参考资料]：如有REFERENCE文件，使用<reference path="..." />引用
    - [注意事项]：约束条件、质量标准、边界条件

生成REFERENCE_<NAME>.md（如需要）：
    - 提供详细的API文档、数据模型、设计规范、技术标准
    - 文件命名：REFERENCE_<描述性名称>.md（全大写）

生成EXAMPLES.md（如需要）：
    - 从简单到复杂的3-5个使用案例
    - 每个案例包含：需求描述、输入、执行过程、输出
    - 附加常见问题Q&A

生成scripts/<name>.py（如需要）：
    - 完整的docstrings和类型注解
    - 输入验证和错误处理
    - 使用示例
    - 符合PEP 8规范

生成README.md：
    - 功能概述、快速开始、配置要点
    - 触发关键词说明
    - 文件说明表格
    - 注意事项和常见问题

**阶段 4：预览确认**

完整展示所有文件内容：
    - 使用分隔线清晰区分每个文件
    - 完整显示每个文件的全部内容
    - 使用工具：无需工具，直接输出文本

收集反馈：
    - 提供5个检查要点（YAML、流程、示例、脚本、Reference）
    - 提供3个操作选项：
      1️⃣ 确认无误，开始写入文件
      2️⃣ 需要修改某些部分
      3️⃣ 重新生成

处理修改请求：
    - 识别修改范围（YAML/流程/示例/脚本/Reference）
    - 重新生成修改部分
    - 再次展示并确认

**阶段 5：文件写入**

创建目录结构：
    - 使用create_directory工具创建.claude/skills/<skill_name>/
    - 如需要，创建scripts/和templates/子目录

按顺序写入文件：
    - 使用create_file工具依次写入：
      1. SKILL.md
      2. REFERENCE_<NAME>.md（如有）
      3. EXAMPLES.md（如有）
      4. scripts/<name>.py（如有）
      5. README.md

验证写入结果：
    - 使用bash_tool执行：ls -la .claude/skills/<skill_name>/
    - 使用bash_tool检查YAML格式：head -n 10 .claude/skills/<skill_name>/SKILL.md
    - 如有Python脚本，验证语法：python -m py_compile <script_path>

生成完成报告：
    - Skill信息（名称、功能、触发词、位置）
    - 生成的文件列表
    - 测试建议（触发测试、流程测试、验证要点）
    - 使用指南（指向README.md）
    - 后续优化建议

**阶段 6：后续支持**

支持修改和优化：
    - 识别修改类型（触发词/流程/示例/Reference/脚本）
    - 使用view工具读取现有文件
    - 使用str_replace工具精确替换内容
    - 验证并向用户确认

支持批量创建：
    - 如用户需要多个相关Skills，提供两种方式：
      方式1：一次性规划整个工作流，创建CLAUDE.md主控文件
      方式2：逐个创建每个Skill，确保接口一致
    - 对每个Skill执行完整流程

[使用示例]

示例较多且详细，请参考 EXAMPLES.md 文件。

[参考资料]

完整的工作流程规范、文件结构设计、质量检查清单请参考：
<reference path="REFERENCE_WORKFLOW.md" />

[注意事项]

- ⚠️ **命名规范**：SKILL.md、README.md、EXAMPLES.md必须全大写；REFERENCE格式为REFERENCE_<NAME>.md；目录和脚本使用小写+下划线
- 📌 **YAML限制**：name字段≤64字符，description字段≤1024字符，description必须包含功能+场景+触发关键词
- 🚫 **避免模糊描述**：执行流程必须具体可操作，禁止使用"根据情况处理"、"灵活判断"等模糊表述
- ✅ **预览优先**：所有内容生成后必须完整展示给用户确认，确认无误才写入文件
- 🎯 **智能判断**：根据需求复杂度动态调整文件结构，简单需求不要过度工程化（不是每个Skill都需要5个文件）
- 📝 **占位符原则**：使用<skill_name>、<输入内容>等占位符保持通用性，不要写死具体项目名称
- 🔄 **质量检查**：文件写入后自动执行质量检查清单，确保符合官方规范