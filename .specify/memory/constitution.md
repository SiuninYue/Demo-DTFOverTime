<!--
  =============================================================================
  SYNC IMPACT REPORT
  =============================================================================
  Version: 1.0.0 → 1.0.0 (Initial Constitution)

  Modified Principles: None (initial creation)
  Added Sections:
    - Core Principles (5 principles)
    - Technical Constraints
    - Development Workflow
    - Governance

  Removed Sections: None

  Templates Requiring Updates:
    ✅ plan-template.md - Reviewed, aligned with constitution principles
    ✅ spec-template.md - Reviewed, user story approach compatible
    ✅ tasks-template.md - Reviewed, task organization compatible
    ✅ Command files - Reviewed, no outdated agent-specific references

  Follow-up TODOs: None
  =============================================================================
-->

# DTF Salary Tracker Constitution

## Core Principles

### I. AI-First Development (NON-NEGOTIABLE)

**Principle**: Every feature MUST leverage AI to minimize manual user input and maximize automation.

**Rules**:
- Use GPT-4 Vision for OCR recognition (排班表识别必须用Vision API)
- Prefer automatic data extraction over manual forms
- AI识别准确率必须 ≥90% 才可发布
- 识别失败时必须提供人工修正fallback

**Rationale**: 核心差异化功能是"拍照导入排班表"，AI质量直接决定产品价值。如果OCR不准确，产品就失去了存在意义。

### II. MVP-First Mindset (NON-NEGOTIABLE)

**Principle**: Only implement P0 features in V1.0. All other features are explicitly deferred.

**Rules**:
- V1.0 MUST NOT include: 主管模式、VI分红、多工作、社区功能
- 每个功能必须明确标注优先级 (P0/P1/P2)
- P1-P2功能只有在MVP验证成功后才能开发
- 复杂度必须在plan.md的Complexity Tracking表格中justify

**Rationale**: 避免功能膨胀，专注验证核心假设（OCR识别排班 + 工资预估）。过早优化会浪费资源在未验证需求上。

### III. Cost Optimization

**Principle**: Monthly operational cost MUST stay under $5 for first 30 users.

**Rules**:
- Use Supabase free tier (50万行DB + 1GB storage)
- Use Vercel free tier for hosting
- GPT-4 Vision calls limited to 1x/user/month (导入排班时)
- No premium dependencies or paid services in V1.0

**Rationale**: 保持极低成本允许长期免费运营，降低启动风险。只有在用户增长后才考虑付费基础设施。

### IV. User Data Accuracy (NON-NEGOTIABLE)

**Principle**: Salary calculations MUST be 99%+ accurate and comply with Singapore MOM regulations.

**Rules**:
- Hourly rate calculation: `baseSalary / 190.67` (MOM标准)
- Overtime multipliers:
  - 正常工作日加班: 1.5x
  - 休息日加班 (OFF/OT): 1.5x (整天)
  - 公共假期: 2.0x
- Attendance bonus calculation:
  - MC ≤1天: 100%
  - MC 2-3天: 50%
  - MC ≥4天: 0%
- 所有计算必须有unit tests验证

**Rationale**: 工资计算错误会导致用户失去信任，这是不可接受的。必须严格遵守新加坡劳工法规。

### V. Mobile-First Design

**Principle**: UI/UX MUST prioritize mobile experience (iOS/Android).

**Rules**:
- Responsive design required for all screens
- Touch-friendly interactions (button ≥44px)
- Camera integration for photo upload
- Offline-capable for basic features (查看已导入的排班)
- 加载状态必须 <2s for OCR recognition

**Rationale**: 目标用户是轮班制餐饮员工，主要在手机上使用。桌面端是次要场景。

## Technical Constraints

### Technology Stack (FIXED)

**Language/Version**: JavaScript (React 19.1.1), Node.js for API calls
**Framework**: React + Vite + Tailwind CSS
**Backend**: Supabase (PostgreSQL + Storage + Auth)
**OCR Service**: OpenAI GPT-4 Vision API
**Hosting**: Vercel (frontend + serverless functions)
**Analytics**: Posthog (free tier)

**Rationale**: Stack选择基于：
- AI-friendly code generation (Claude/Cursor)
- 最低成本 (全部free tier)
- 快速开发迭代

### Performance Standards

- OCR recognition: <10s for 排班表 (Excel截图)
- Page load: <2s (mobile 4G)
- Salary calculation: <100ms
- Offline mode: 查看已导入排班表 (no network)

### Data Constraints

- User data stored in Singapore region (Supabase Asia Pacific)
- Schedule images: max 5MB per upload
- Encrypted at rest and in transit
- No data sharing with third parties

## Development Workflow

### TDD for Critical Features (REQUIRED for P0)

**Critical features requiring tests**:
- Salary calculation engine (工资计算)
- OCR result validation (识别结果验证)
- MOM compliance calculations (时薪/加班费)

**Test requirements**:
- Unit tests for all calculation logic
- Integration tests for OCR → database flow
- Contract tests if API endpoints added

**Non-critical features**: UI components, 日历显示, etc. (tests optional)

### Feature Development Cycle

1. **Specification** (`/speckit.specify`):
   - User stories MUST be prioritized (P1/P2/P3)
   - Each story MUST be independently testable
   - Edge cases for 排班表 variations documented

2. **Planning** (`/speckit.plan`):
   - Constitution check REQUIRED before Phase 0
   - Complexity justification for any violations
   - OCR prompt engineering documented in research.md

3. **Task Generation** (`/speckit.tasks`):
   - Tasks grouped by user story (independent delivery)
   - Parallel tasks marked with [P]
   - File paths MUST be absolute

4. **Implementation** (`/speckit.implement`):
   - Tests written FIRST for calculation logic
   - OCR accuracy validated with real 排班表 samples
   - Commit after each task completion

### Version Control

- Feature branches: `###-feature-name` format
- Commit messages: 中文简体, 使用conventional commits
  - `feat: 添加排班表OCR识别`
  - `fix: 修正加班费计算错误`
  - `refactor: 简化工资计算逻辑`

### Code Style

- 代码: 英文变量名和注释
- 文档: 中文简体 (如PRD、spec、tasks)
- UI文本: 中文简体 (用户界面)
- 压缩规则: 删冗词、用列表、长词用英文缩写

## Governance

### Amendment Process

1. Constitution changes require:
   - Documentation of rationale in constitution.md
   - Version bump (MAJOR/MINOR/PATCH)
   - Update of all affected templates
   - Sync impact report at file top

2. Version bump rules:
   - **MAJOR**: Backward incompatible changes (e.g., remove TDD requirement)
   - **MINOR**: New principle added (e.g., add security principle)
   - **PATCH**: Clarifications, typo fixes, wording improvements

### Compliance Review

- All specs MUST pass `/speckit.analyze` before implementation
- Constitution violations MUST be justified in plan.md Complexity Tracking table
- Critical features (P0) MUST have tests before release

### Escalation

- Ambiguous requirements → Use `/speckit.clarify` (ask ≤5 questions)
- Constitution conflicts → Document in plan.md, propose amendment
- Technical blockers → Escalate to user for guidance

**Version**: 1.0.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-11-04
