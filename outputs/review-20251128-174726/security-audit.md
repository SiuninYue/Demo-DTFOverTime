# Security Audit Report
**Reviewer**: Devil-advocate
**Date**: 2025-11-28
**Scope**: scripts/validation/

---

## 🔴 CRITICAL VULNERABILITIES (P0)

### 1. Unhandled JSON.parse Exception - CWE-755
**Severity**: P0 - Critical
**CVSS**: 7.5 (High) - Availability Impact
**Files**: Both scripts

**Location**:
- [ocr-report.mjs:15](scripts/validation/ocr-report.mjs#L15)
- [salary-verification.mjs:15](scripts/validation/salary-verification.mjs#L15)

**Vulnerable Code**:
```javascript
const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
```

**Attack Scenario**:
```bash
# Attacker creates malformed JSON
echo '{"cases": [invalid json}' > /tmp/evil.json
node scripts/validation/ocr-report.mjs /tmp/evil.json
# → Process crashes with SyntaxError
```

**Impact**:
- ⚠️ Denial of Service（DoS）
- ⚠️ 进程崩溃导致 CI/CD pipeline 中断
- ⚠️ 错误堆栈可能泄露文件路径

**Fix**:
```javascript
let payload
try {
  const raw = fs.readFileSync(filePath, 'utf8')
  payload = JSON.parse(raw)
} catch (err) {
  console.error(`[script] Invalid JSON: ${err.message}`)
  process.exit(1)
}
```

**OWASP Reference**: A04:2021 - Insecure Design

---

### 2. Path Traversal Vulnerability - CWE-22
**Severity**: P0 - Critical
**CVSS**: 7.5 (High) - Confidentiality Impact
**Files**: Both scripts

**Location**:
- [ocr-report.mjs:6-7](scripts/validation/ocr-report.mjs#L6-L7)
- [salary-verification.mjs:6-7](scripts/validation/salary-verification.mjs#L6-L7)

**Vulnerable Code**:
```javascript
const [, , input = 'default.json'] = process.argv
const filePath = path.resolve(process.cwd(), input)
// 无路径验证！
```

**Attack Scenario**:
```bash
# Attacker reads arbitrary system files
node scripts/validation/ocr-report.mjs ../../../../etc/passwd
node scripts/validation/salary-verification.mjs ~/.ssh/id_rsa

# Error message leaks file contents:
# SyntaxError: Unexpected token ... in JSON at position 0
```

**Impact**:
- 🚨 读取敏感文件（/etc/passwd, ~/.env, credentials）
- 🚨 信息泄露（错误消息可能包含文件内容片段）
- 🚨 CI/CD 环境中可能暴露 secrets

**Fix**:
```javascript
import { dirname, resolve, relative } from 'node:path'

const allowedDir = resolve(process.cwd(), 'reports/validation')
const filePath = resolve(process.cwd(), input)

// Ensure path is within allowed directory
const rel = relative(allowedDir, filePath)
if (rel.startsWith('..') || path.isAbsolute(rel)) {
  console.error('[script] Invalid path: must be within reports/validation/')
  process.exit(1)
}
```

**OWASP Reference**: A01:2021 - Broken Access Control

---

## 🟠 HIGH SEVERITY (P1)

### 3. Unbounded File Size - CWE-400
**Severity**: P1 - High
**CVSS**: 6.5 (Medium-High)

**Vulnerable Code**:
```javascript
fs.readFileSync(filePath, 'utf8')  // 同步读取整个文件到内存
```

**Attack Scenario**:
```bash
# Attacker provides 2GB JSON file
dd if=/dev/zero of=/tmp/huge.json bs=1M count=2048
node scripts/validation/ocr-report.mjs /tmp/huge.json
# → Out of Memory (OOM) crash
```

**Impact**:
- Memory exhaustion (DoS)
- CI/CD runner crashes
- Potential system-wide impact in shared environments

**Fix**:
```javascript
import { statSync } from 'node:fs'

const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
const stats = statSync(filePath)
if (stats.size > MAX_FILE_SIZE) {
  console.error(`[script] File too large: ${stats.size} bytes (max ${MAX_FILE_SIZE})`)
  process.exit(1)
}
```

---

### 4. Information Disclosure in Error Messages - CWE-209
**Severity**: P1 - Medium
**Files**: Both scripts

**Vulnerable Code**:
```javascript
console.error(`[ocr-report] Input file not found: ${filePath}`)
// 泄露完整文件系统路径
```

**Example Leak**:
```
[ocr-report] Input file not found: /home/yueka/projects/AI-CODE-PROJECTS/DTFOverTime/reports/validation/ocr-results.json
```

**Impact**:
- 泄露项目目录结构
- 泄露用户名（yueka）
- 帮助攻击者了解系统布局

**Fix**:
```javascript
import { basename } from 'node:path'
console.error(`[script] Input file not found: ${basename(filePath)}`)
// 仅显示文件名，不显示完整路径
```

---

## 🟡 MEDIUM SEVERITY (P2)

### 5. Missing Input Validation - CWE-20
**Severity**: P2
**Files**: Both scripts

**Issues**:
- 未验证 JSON schema
- 未检查必需字段
- `Number()` 强制转换可能产生 NaN

**Fix**:
```javascript
// Use Zod for schema validation
import { z } from 'zod'

const caseSchema = z.object({
  id: z.string().optional(),
  image: z.string(),
  accuracy: z.number().min(0).max(1).optional(),
  correctCells: z.number().int().nonnegative().optional(),
  totalCells: z.number().int().positive().optional()
})

const payloadSchema = z.object({
  cases: z.array(caseSchema)
})

const result = payloadSchema.safeParse(payload)
if (!result.success) {
  console.error(`[script] Invalid input: ${result.error.message}`)
  process.exit(1)
}
```

---

### 6. Lack of Rate Limiting
**Severity**: P2
**Context**: CI/CD 环境

**Risk**:
- 无限制并发执行可能导致资源耗尽
- 建议在 CI 配置中添加限流

---

## 🟢 LOW SEVERITY (P3)

### 7. No Logging/Audit Trail
- 无法追踪谁执行了验证
- 无执行时间戳记录
- 建议添加简单日志：
  ```javascript
  console.log(`[script] Executed by ${process.env.USER} at ${new Date().toISOString()}`)
  ```

---

## OWASP Top 10 Mapping

| OWASP Category | Finding | Priority |
|----------------|---------|----------|
| A01: Broken Access Control | Path Traversal | P0 |
| A04: Insecure Design | Unhandled Exceptions | P0 |
| A04: Insecure Design | No File Size Limit | P1 |
| A05: Security Misconfiguration | Info Disclosure | P1 |
| A03: Injection | Missing Input Validation | P2 |

---

## Security Best Practices Checklist

### Currently Missing
- ❌ Input validation & sanitization
- ❌ Path traversal protection
- ❌ File size limits
- ❌ Error handling (try-catch)
- ❌ Secure error messages
- ❌ Security tests
- ❌ Dependency scanning (no package.json)

### Recommended
- ✅ Use `node:` protocol imports (already done)
- ✅ No external dependencies (reduces supply chain risk)

---

## Threat Model

### Attack Surface
| Entry Point | Risk | Mitigation |
|-------------|------|------------|
| CLI argument | High | Path validation |
| JSON file content | High | Schema validation |
| File system | Medium | Size limits |
| Error output | Low | Sanitize messages |

### Attack Vectors
1. **Malicious JSON** → DoS via exception
2. **Path traversal** → Information disclosure
3. **Large files** → Memory exhaustion
4. **CI/CD injection** → If integrated into pipeline

---

## Compliance Considerations

若项目需符合以下标准，当前代码**不合规**：
- **OWASP ASVS** Level 2+: 需添加输入验证、错误处理
- **CWE Top 25**: 违反 CWE-22 (Path Traversal), CWE-755 (Exception Handling)
- **GDPR** (若处理个人数据): 信息泄露风险

---

## Remediation Priority

### Phase 1 (Immediate - P0)
1. 添加 try-catch 包裹 JSON.parse
2. 实现路径验证（白名单目录）
3. 添加文件大小检查

**Estimated Time**: 2-3 hours

### Phase 2 (This Week - P1)
1. 消毒错误消息
2. 添加 JSON schema 验证
3. 添加安全测试用例

**Estimated Time**: 4-5 hours

### Phase 3 (Tech Debt - P2)
1. 添加日志/审计
2. 文档化安全假设
3. CI/CD 安全扫描集成

---

## Security Test Cases

建议添加以下测试：
```javascript
// tests/security.test.mjs
import { test } from 'node:test'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

test('rejects path traversal attempts', async () => {
  const { stderr } = await execAsync(
    'node scripts/validation/ocr-report.mjs ../../../../etc/passwd',
    { encoding: 'utf8' }
  )
  assert.match(stderr, /Invalid path/)
})

test('handles malformed JSON gracefully', async () => {
  await fs.writeFile('/tmp/bad.json', '{invalid}')
  const { stderr } = await execAsync(
    'node scripts/validation/ocr-report.mjs /tmp/bad.json',
    { encoding: 'utf8' }
  )
  assert.match(stderr, /Invalid JSON/)
})

test('rejects files exceeding size limit', async () => {
  // Create 20MB file
  await execAsync('dd if=/dev/zero of=/tmp/huge.json bs=1M count=20')
  const { stderr } = await execAsync(
    'node scripts/validation/ocr-report.mjs /tmp/huge.json',
    { encoding: 'utf8' }
  )
  assert.match(stderr, /too large/)
})
```

---

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)

---

## Sign-off

**Reviewer**: Devil-advocate (Security)
**Recommendation**: **DO NOT DEPLOY** until P0 issues are resolved.
**Re-review Required**: Yes (after fixes)
