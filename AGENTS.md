# AI Agent Architecture

> **目的**: 定义项目的 AI Agent 执行模型（Main Agent + Skills + Sub-Agents）

---

## 执行模型概览

```
Main Agent (Claude Code)
│
├─ Direct Tools (基础操作)
│  ├─ Read/Write/Edit (文件操作)
│  ├─ Bash (命令执行)
│  ├─ Grep/Glob (代码搜索)
│  └─ WebSearch/WebFetch (网络)
│
├─ Skills (轻量工作流，共享上下文)
│  ├─ ann_ai - Prompt 优化
│  ├─ skills_mother - Skill 生成器
│  └─ [自定义 Skills]
│
└─ Sub-Agents (大型任务，隔离上下文)
   ├─ Explore - 代码探索
   ├─ Plan - 规划分析
   └─ general-purpose - 通用任务
```

---

## 决策框架

### 何时使用 Direct Tools
- 已知文件路径（直接 Read/Edit）
- 简单搜索（<3 文件，用 Grep）
- 单文件创建/修改
- 运行测试/构建命令

### 何时使用 Skills
- 标准化工作流（已重复 ≥3 次）
- 需要用户交互（多轮问答）
- 轻量操作（<5 步，<15K tokens）
- 示例: Prompt 优化、文档生成

### 何时使用 Sub-Agents
- 大型探索（>20 文件，关键词模糊）
- 复杂实现（多文件修改，需自主规划）
- 独立任务（可隔离上下文）
- Token 消耗 >15K

**详细规范**: `.claude/SUB_AGENT_GOVERNANCE.md`

---

## Skills 管理

### 已安装 Skills

| Skill | 功能 | 触发词 |
|-------|------|--------|
| `ann_ai` | 将粗糙输入转换为精准 AI prompt | `/prompt`, 优化提示词 |
| `skills_mother` | 创建新的 Skill 包 | 创建 skill, 生成 skill |

### 创建新 Skill

```bash
# 方式 1: 使用 skills_mother
触发词: "帮我创建一个 skill"

# 方式 2: 手动创建
mkdir .claude/skills/<skill_name>
touch .claude/skills/<skill_name>/SKILL.md
```

**必要条件**（满足任意 2 项）:
- [ ] 工作流重复 ≥3 次
- [ ] 流程固定（步骤可标准化）
- [ ] 需要领域知识（规范/标准）
- [ ] 包含确定性操作（脚本）

**规范**: `.claude/skills/skills_mother/REFERENCE_WORKFLOW.md`

---

## Sub-Agent 使用指南

### 标准调用

```markdown
用户: 找到所有计算加班费的函数

主 Agent 评估: 需要多次搜索，token >15K，使用 Sub-Agent

主 Agent 执行:
Task(
  subagent_type: "Explore",
  description: "搜索加班费计算函数",
  model: "haiku",
  prompt: "
目标: 查找所有 OT 计算相关函数
范围: src/services/, src/utils/
关键词: overtime, OT, calculateOT
返回: Markdown 表格（文件 | 函数 | 行号）
  "
)
```

### Model 选择

- `haiku`: 探索/搜索（成本低，速度快）
- `sonnet`: 实现/重构（默认，平衡）
- `opus`: 架构设计（慎用，成本高）

### 并行执行

```markdown
# ✅ 独立任务可并行
Task(搜索前端路由)
Task(搜索后端 API)
Task(搜索测试文件)

# ❌ 依赖任务必须串行
Task(找到函数位置)  # 先执行
等待结果 → Task(修改函数)  # 后执行
```

**实战指南**: `.claude/SUB_AGENT_IMPLEMENTATION.md`

---

## 上下文管理

### 污染阈值

⚠️ Token 使用 >100K (50%): 优先使用 Sub-Agent
🚨 Token 使用 >150K (75%): 必须总结或 `/clear`

### 清理策略

```bash
/clear  # 清空对话历史，保留项目状态
```

主 Agent 会在接近阈值时主动建议清理。

---

## 成本优化

### Token 预算

| 操作类型 | 目标 Token | 工具选择 |
|---------|-----------|---------|
| 简单搜索 | <3K | Grep/Glob |
| 代码探索 | 5-15K | Sub-Agent (haiku) |
| 功能实现 | 10-25K | Sub-Agent (sonnet) |
| 架构设计 | 20-40K | 主 Agent + 用户讨论 |

### Checklist

- [ ] 探索用 `haiku` model
- [ ] 使用 `thoroughness: "quick"` 初步扫描
- [ ] 并行独立任务
- [ ] 避免重复搜索（记录关键信息）

---

# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React application. `main.jsx` wires Vite to the DOM, `App.jsx` hosts the feature surface, and `assets/` stores component-level media. Keep shared UI primitives in `src/components/` when you introduce them.
- `public/` exposes static files and the single `index.html`. Reference assets here only when they must bypass the bundler.
- `docs/` and `specs/001-dtf-salary-tracker-mvp/` capture product context. Add planning notes or architecture diagrams alongside the relevant spec to retain traceability.
- Preserve generated output in `dist/`; it is ignored by ESLint via `globalIgnores`, so keep source elsewhere.

## Build, Test, and Development Commands
- `npm install` — install dependencies; re-run after updating `package.json`.
- `npm run dev` — launch Vite with hot module reloading at `http://localhost:5173`.
- `npm run build` — produce optimized assets in `dist/`; run before tagging a release.
- `npm run preview` — serve the production build locally for smoke tests.
- `npm run lint` — apply the ESLint bundle (JS recommended, React Hooks, React Refresh). Fix or silence intentionally unused globals with a leading `_` or uppercase token per rule config.

## Coding Style & Naming Conventions
- Use 2-space indentation, single quotes, and semicolon-free syntax to match existing files.
- Author React components as functions in PascalCase; hooks and utilities stay camelCase.
- Co-locate styles in `.css` files alongside their owners; import them explicitly rather than relying on globals.
- Favor named exports when multiple utilities live in one module; default exports are reserved for page-level shells.

## Testing Guidelines
- No automated test runner is wired in yet; introduce Vitest when adding coverage. House specs under `src/__tests__/` or `src/<feature>/__tests__/`.
- Name test files `<Module>.test.jsx` and mirror the component folder. Keep assertions focused on user-observable behavior.
- Before opening a PR, run `npm run build` to catch type or bundler regressions and document any manual QA performed.

## Commit & Pull Request Guidelines
- Follow the conventional heading pattern `type: concise summary` (`chore: ignore Windows Zone.Identifier files` is the current precedent). Use `feat`, `fix`, `refactor`, or `docs` as appropriate.
- Commits should be scoped to a single concern and include context in the body when touching specs or configuration.
- PRs must describe intent, reference the relevant spec folder, and attach screenshots or GIFs for UI-visible changes. Tag reviewers who own the affected area.
