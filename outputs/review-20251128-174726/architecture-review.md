# Architecture Review
**Reviewer**: System-architect
**Date**: 2025-11-28
**Scope**: scripts/validation/

---

## Architecture Overview

### Current State
```
scripts/validation/
├── ocr-report.mjs         (65 LOC) - OCR accuracy reporting
└── salary-verification.mjs (62 LOC) - Salary calculation validation
```

**Pattern**: Standalone CLI scripts
**Dependencies**: Node.js stdlib only
**Data Flow**: File → Parse → Transform → Report → Exit

---

## Architecture Assessment

### ✅ Strengths

1. **Zero Dependencies**
   - 仅使用 Node.js 标准库
   - 无 supply chain 风险
   - 快速启动，无 npm install

2. **Simple & Focused**
   - 单一职责（SRP）：每个脚本只做一件事
   - CLI-first 设计，易于 CI/CD 集成

3. **Consistent Pattern**
   - 两个脚本使用相同结构
   - 统一的错误消息格式 `[script-name]`
   - 一致的数据流

---

## 🔴 Critical Issues

### 1. Code Duplication Violates DRY (P1)

**Problem**: 60% 代码重复

**Duplicated Logic**:
```javascript
// 在两个文件中重复出现：
// 1. CLI 参数解析
const [, , input = 'default/path'] = process.argv
const filePath = path.resolve(process.cwd(), input)

// 2. 文件检查
if (!fs.existsSync(filePath)) { /* ... */ }

// 3. JSON 读取
const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
const cases = Array.isArray(payload) ? payload : payload.cases

// 4. 空数组检查
if (!Array.isArray(cases) || cases.length === 0) { /* ... */ }
```

**Impact**:
- 修改需要同步两处
- 增加维护成本
- 易引入不一致

**Recommended Architecture**:
```
scripts/validation/
├── utils/
│   ├── file-loader.mjs      # loadValidationData(scriptName, defaultPath)
│   ├── reporters.mjs        # ConsoleReporter, JSONReporter
│   └── validators.mjs       # validateSchema(data, schema)
├── ocr-report.mjs           # 仅保留 OCR 特定逻辑
└── salary-verification.mjs  # 仅保留薪资特定逻辑
```

**Refactored Example**:
```javascript
// utils/file-loader.mjs
export function loadValidationData(scriptName, defaultPath) {
  const [, , input = defaultPath] = process.argv
  const filePath = path.resolve(process.cwd(), input)

  // 统一的验证、读取、解析逻辑
  if (!fs.existsSync(filePath)) {
    throw new ValidationError(`Input file not found: ${basename(filePath)}`)
  }

  // ... 文件大小检查、JSON 解析、schema 验证

  return { cases, filePath: basename(filePath) }
}

// ocr-report.mjs (简化后)
import { loadValidationData } from './utils/file-loader.mjs'

const { cases } = loadValidationData('ocr-report', 'reports/validation/ocr-results.json')
const report = generateOCRReport(cases)  // 仅 OCR 特定逻辑
console.log(report)
```

---

### 2. Lack of Testability (P1)

**Problem**:
- 无导出函数 → 无法单元测试
- 逻辑与 I/O 强耦合
- 无法 mock fs/console

**Current Structure** (不可测试):
```javascript
// All logic in top-level script
const payload = JSON.parse(...)  // Side effect
console.log('Report')            // Side effect
```

**Recommended Architecture** (可测试):
```javascript
// ocr-report.mjs
export function normalizeAccuracy(entry) { /* ... */ }
export function calculateMetrics(cases) { /* ... */ }
export function formatReport(metrics) { /* ... */ }

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const { cases } = loadValidationData(...)
  const metrics = calculateMetrics(cases)
  const report = formatReport(metrics)
  console.log(report)
}

// ocr-report.test.mjs
import { normalizeAccuracy, calculateMetrics } from './ocr-report.mjs'

test('normalizeAccuracy handles missing fields', () => {
  const result = normalizeAccuracy({ correctCells: 9, totalCells: 10 })
  assert.strictEqual(result, 0.9)
})
```

---

### 3. Configuration Hardcoded (P2)

**Problem**: 魔法数字和配置散布在代码中

**Examples**:
- [ocr-report.mjs:46](scripts/validation/ocr-report.mjs#L46): `if (row.accuracy >= 0.9)`
- [salary-verification.mjs:26](scripts/validation/salary-verification.mjs#L26): `const tolerance = Number(entry.tolerance ?? 10)`

**Recommended**: 使用配置文件
```javascript
// config/validation.mjs
export default {
  ocr: {
    passThreshold: 0.9,
    maxFileSize: 10 * 1024 * 1024,  // 10MB
    allowedDir: 'reports/validation'
  },
  salary: {
    defaultTolerance: 10,
    maxFileSize: 10 * 1024 * 1024,
    allowedDir: 'reports/validation'
  }
}
```

---

## Design Pattern Analysis

### Current Pattern: Procedural Script
```
Input → Parse → Transform → Aggregate → Output
```

**Pros**:
- ✅ Simple
- ✅ Fast execution
- ✅ Easy to understand

**Cons**:
- ❌ Not extensible
- ❌ Hard to test
- ❌ Tight coupling

---

### Recommended Pattern: Pipeline + Strategy

```javascript
// Pipeline pattern
class ValidationPipeline {
  constructor(loader, validator, reporter) {
    this.loader = loader
    this.validator = validator
    this.reporter = reporter
  }

  async run(inputPath) {
    const data = await this.loader.load(inputPath)
    const result = this.validator.validate(data)
    return this.reporter.report(result)
  }
}

// Strategy pattern for different validators
class OCRValidator {
  validate(cases) {
    return cases.map(this.normalizeAccuracy)
  }
}

class SalaryValidator {
  validate(cases) {
    return cases.map(this.calculateDelta)
  }
}

// Usage
const pipeline = new ValidationPipeline(
  new FileLoader({ allowedDir: 'reports/validation' }),
  new OCRValidator(),
  new ConsoleReporter()
)

await pipeline.run(process.argv[2])
```

**Benefits**:
- ✅ 易于测试（mock 各组件）
- ✅ 易于扩展（新增 validator/reporter）
- ✅ 关注点分离

---

## Data Flow Architecture

### Current (Monolithic)
```
┌─────────────────────────────────────┐
│        ocr-report.mjs               │
│  ┌─────────────────────────────┐   │
│  │ Parse args                  │   │
│  │ Read file                   │   │
│  │ Parse JSON                  │   │
│  │ Normalize data              │   │
│  │ Calculate metrics           │   │
│  │ Format output               │   │
│  │ Print to console            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Recommended (Modular)
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ FileLoader   │───▶│  Validator   │───▶│  Reporter    │
│              │    │              │    │              │
│ - loadData() │    │ - validate() │    │ - report()   │
│ - validate   │    │ - normalize  │    │ - format()   │
│   path       │    │ - calculate  │    │              │
│ - parse JSON │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                    │
       └───────────────────┴────────────────────┘
                    Composable
```

---

## Extensibility Analysis

### Current State: Low Extensibility

**Adding a new report type requires**:
1. Copy-paste entire script
2. Modify 80% of code
3. Duplicate error handling

### Recommended: High Extensibility

**Adding a new report type**:
```javascript
// new: pdf-validation-report.mjs
import { ValidationPipeline } from './utils/pipeline.mjs'
import { PDFValidator } from './validators/pdf-validator.mjs'

const pipeline = new ValidationPipeline(
  new FileLoader(),
  new PDFValidator(),  // Only implement PDF-specific logic
  new ConsoleReporter()
)

await pipeline.run(process.argv[2])
```

---

## Error Handling Architecture

### Current: Inconsistent
- fs.existsSync → process.exit(1)
- JSON.parse → uncaught exception (crashes)
- Empty array → process.exit(1)
- Calculation errors → silent failures (NaN/Infinity)

### Recommended: Layered Error Handling
```javascript
// Custom error types
class ValidationError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

// Error boundary
try {
  const result = await pipeline.run(input)
  console.log(result)
} catch (err) {
  if (err instanceof ValidationError) {
    console.error(`[ERROR] ${err.message}`)
    process.exit(err.code)
  }
  throw err  // Unexpected errors
}
```

---

## Performance Considerations

### Current Performance: Good
- ✅ 同步 I/O 合理（小文件）
- ✅ 单次处理，无内存泄露
- ✅ 无阻塞操作

### Potential Issues at Scale
| Cases | File Size | Memory | Time |
|-------|-----------|--------|------|
| 10 | 10KB | ~1MB | <10ms |
| 100 | 100KB | ~2MB | <50ms |
| 1,000 | 1MB | ~10MB | ~200ms |
| 10,000 | 10MB | ~100MB | ~2s |
| **100,000** | **100MB** | **~1GB** | **~20s** ⚠️ |

**Recommendation**: 若预期大规模数据
1. 使用流式处理（stream）
2. 分批聚合（chunk processing）
3. 考虑 Worker threads 并行

```javascript
// 流式处理大文件
import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import ndjson from 'ndjson'  // newline-delimited JSON

await pipeline(
  createReadStream(filePath),
  ndjson.parse(),
  async function* (source) {
    for await (const entry of source) {
      yield normalizeAccuracy(entry)
    }
  },
  aggregator
)
```

---

## Integration Architecture

### Current: Standalone CLI
```bash
node scripts/validation/ocr-report.mjs reports/validation/ocr-results.json
```

**Pros**: ✅ Simple, CI/CD friendly
**Cons**: ❌ 无法编程调用

### Recommended: Dual-mode (CLI + Library)
```javascript
// ocr-report.mjs can be used as:

// 1. CLI
$ node ocr-report.mjs input.json

// 2. ES Module
import { generateOCRReport } from './ocr-report.mjs'
const report = generateOCRReport(cases)

// 3. API endpoint
app.post('/api/validate/ocr', async (req, res) => {
  const report = generateOCRReport(req.body.cases)
  res.json(report)
})
```

---

## Documentation Architecture

### Current: None
- ❌ 无 JSDoc
- ❌ 无使用示例
- ❌ 无 API 文档

### Recommended
```javascript
/**
 * Normalize OCR accuracy from various input formats
 *
 * @param {Object} entry - OCR result entry
 * @param {number} [entry.accuracy] - Pre-calculated accuracy (0-1)
 * @param {number} [entry.correctCells] - Number of correct cells
 * @param {number} [entry.totalCells] - Total number of cells
 * @returns {number} Normalized accuracy between 0 and 1
 *
 * @example
 * normalizeAccuracy({ correctCells: 9, totalCells: 10 })
 * // => 0.9
 */
export function normalizeAccuracy(entry) {
  // ...
}
```

---

## Dependency Architecture

### Current: Zero External Dependencies ✅
```json
{
  "dependencies": {}
}
```

**Pros**:
- ✅ No supply chain risk
- ✅ Fast install
- ✅ No version conflicts

**Cons**:
- ❌ Reinventing validation logic
- ❌ No schema validation library

### Recommended: Minimal Strategic Dependencies
```json
{
  "dependencies": {
    "zod": "^3.22.0"  // Schema validation (3.8KB gzipped)
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**Rationale**: Zod 提供类型安全的 schema 验证，避免手写验证逻辑

---

## Architecture Evolution Roadmap

### Phase 1: Safety (Week 1)
- ✅ 添加 try-catch 和路径验证
- ✅ 添加文件大小限制
- ✅ 抽取 utils/file-loader.mjs

### Phase 2: Quality (Week 2-3)
- ✅ 添加单元测试（80% 覆盖）
- ✅ 重构为 Pipeline pattern
- ✅ 添加 TypeScript 类型

### Phase 3: Scale (Month 2)
- ✅ 支持流式处理
- ✅ 添加缓存层
- ✅ 性能优化

### Phase 4: Ecosystem (Month 3)
- ✅ 发布为 npm package
- ✅ CLI + Library 双模式
- ✅ 完整文档和示例

---

## Alternative Architectures Considered

### Option A: Keep Current (Not Recommended)
**Pros**: 无需重构
**Cons**: 技术债务累积，难维护

### Option B: Full OOP Rewrite (Overkill)
```javascript
class ValidationReport {
  constructor(strategy) { /* ... */ }
}
class OCRValidationStrategy { /* ... */ }
```
**Pros**: 完全解耦
**Cons**: 过度设计，复杂度高

### ✅ Option C: Pragmatic Refactor (Recommended)
- 抽取共享逻辑为 utils
- 保持函数式风格
- 增加可测试性
- 最小化改动

---

## Design Principles Alignment

| Principle | Current | Target |
|-----------|---------|--------|
| **SOLID** |
| Single Responsibility | ❌ Mixed concerns | ✅ Separated |
| Open/Closed | ❌ Hard to extend | ✅ Plugin-based |
| Liskov Substitution | N/A | ✅ Validators swappable |
| Interface Segregation | N/A | ✅ Small focused interfaces |
| Dependency Inversion | ❌ Tight coupling | ✅ Inject dependencies |
| **DRY** | ❌ 60% duplication | ✅ <5% duplication |
| **YAGNI** | ✅ No over-engineering | ✅ Keep simple |
| **KISS** | ✅ Simple scripts | ✅ Maintain simplicity |

---

## Summary & Recommendations

### Architecture Score: 4/10

| Aspect | Score | Notes |
|--------|-------|-------|
| Modularity | 2/10 | 代码重复严重 |
| Testability | 1/10 | 无法单元测试 |
| Extensibility | 3/10 | 需 copy-paste |
| Maintainability | 4/10 | 简单但脆弱 |
| Performance | 8/10 | 当前场景足够 |
| Security | 3/10 | 见 security-audit.md |

### Top 3 Priorities
1. **抽取共享逻辑** → utils/file-loader.mjs (2-3h)
2. **添加单元测试** → 80% 覆盖 (4-5h)
3. **重构为可导出函数** → 提高可测试性 (2-3h)

### Long-term Vision
```
scripts/validation/  →  @company/validation-tools (npm package)
    ├── CLI tools
    ├── ES modules (importable)
    ├── Type definitions (.d.ts)
    └── Comprehensive tests
```

---

**Reviewer**: System-architect
**Recommendation**: Refactor recommended, but not blocking deployment after security fixes.
