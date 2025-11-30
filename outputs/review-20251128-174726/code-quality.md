# Code Quality Report
**Reviewer**: Backend-dev
**Date**: 2025-11-28

---

## Overview
审查 `scripts/validation/` 下 2 个报告生成脚本。整体代码清晰，但缺少错误处理、类型安全和测试。

---

## Files Reviewed

### 1. ocr-report.mjs (65 LOC)
**Purpose**: 生成 OCR 准确性报告

#### Positive
✅ ESM 模块化良好
✅ 函数式编程风格（map/reduce）
✅ 变量命名清晰（`averageAccuracy`, `aggregate`）
✅ 良好的默认参数处理

#### Issues

**P0 - JSON.parse 未捕获异常** [ocr-report.mjs:15](scripts/validation/ocr-report.mjs#L15)
```javascript
const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
```
- 恶意/损坏 JSON → 进程崩溃
- 修复：`try-catch` 包裹

**P1 - 缺少输入验证**
- `normalizeAccuracy` 假设字段存在
- 应验证 entry 结构

**P2 - 复杂逻辑缺注释** [ocr-report.mjs:23-33](scripts/validation/ocr-report.mjs#L23-L33)
```javascript
const normalizeAccuracy = (entry) => {
  // 多个回退字段，逻辑不明显
  const correct = Number(entry.correctCells ?? entry.correctTokens ?? entry.matches ?? 0)
  // ...
}
```
- 建议：添加文档注释说明字段优先级

**P2 - 硬编码阈值** [ocr-report.mjs:46](scripts/validation/ocr-report.mjs#L46)
```javascript
if (row.accuracy >= 0.9) acc.pass += 1
```
- 建议：改为配置参数

**P2 - 不可测试**
- 无导出函数，无法单元测试
- 建议：抽取 `generateReport(cases)`

---

### 2. salary-verification.mjs (62 LOC)
**Purpose**: 验证薪资计算准确性

#### Positive
✅ 与 ocr-report 风格一致
✅ 清晰的数据转换逻辑
✅ 有失败退出码（exit code 1）

#### Issues

**P0 - 同上：JSON.parse 未捕获** [salary-verification.mjs:15](scripts/validation/salary-verification.mjs#L15)

**P1 - 边界情况未处理** [salary-verification.mjs:43](scripts/validation/salary-verification.mjs#L43)
```javascript
const worst = summary.reduce((max, row) => ...)
```
- 若 `summary` 为空数组 → `summary[0]` 为 undefined → reduce 初始值错误
- 修复：检查 `summary.length > 0`

**P2 - Number 强制转换** [salary-verification.mjs:24-26](scripts/validation/salary-verification.mjs#L24-L26)
```javascript
const target = Number(entry.expected?.netPay ?? entry.expected?.totalGross ?? 0)
```
- NaN 风险小（有默认值 0），但应显式检查 `isFinite()`

**P2 - 硬编码容差** [salary-verification.mjs:26](scripts/validation/salary-verification.mjs#L26)
```javascript
const tolerance = Number(entry.tolerance ?? 10)
```
- 默认值 10 应在配置文件

---

## Code Duplication

### P1 - 严重重复逻辑
两个文件共享以下模式：
```javascript
// 1. 参数解析
const [, , input = 'default/path'] = process.argv
const filePath = path.resolve(process.cwd(), input)

// 2. 文件存在检查
if (!fs.existsSync(filePath)) {
  console.error(`[script] Input file not found: ${filePath}`)
  process.exit(1)
}

// 3. JSON 读取解析
const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
const cases = Array.isArray(payload) ? payload : payload.cases
```

**建议**: 创建 `scripts/validation/utils.mjs`:
```javascript
export function loadValidationData(scriptName, defaultPath) {
  // 统一处理参数、读取、解析、验证
}
```

---

## Best Practices Violations

### Missing
- ❌ 单元测试（0% 覆盖）
- ❌ TypeScript 类型
- ❌ JSDoc 注释
- ❌ Linting 配置（ESLint）
- ❌ 错误边界处理

### Recommendations
1. 添加 `package.json` scripts:
   ```json
   {
     "test:validation": "node --test scripts/validation/*.test.mjs",
     "lint:validation": "eslint scripts/validation/"
   }
   ```

2. 使用 Zod/Joi 验证输入 schema:
   ```javascript
   import { z } from 'zod'
   const caseSchema = z.object({
     id: z.string().optional(),
     accuracy: z.number().optional(),
     // ...
   })
   ```

---

## Positive Patterns

✅ **一致的错误消息格式**
```javascript
console.error(`[script-name] Error message`)
```

✅ **良好的默认参数**
```javascript
const [, , input = 'default/path'] = process.argv
```

✅ **函数式编程**
```javascript
const rows = cases.map(...)
const aggregate = rows.reduce(...)
```

---

## Summary

| Category | Score | Notes |
|----------|-------|-------|
| Readability | 8/10 | 清晰变量名，逻辑流畅 |
| Maintainability | 5/10 | 代码重复严重 |
| Robustness | 3/10 | 缺少错误处理 |
| Testability | 2/10 | 无导出函数，不可测 |
| **Overall** | **5/10** | 需重构和加固 |

**Top 3 Priorities**:
1. 添加 try-catch 和输入验证
2. 抽取共享工具函数
3. 添加单元测试
