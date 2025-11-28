#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const [, , input = 'reports/validation/salary-verification.json'] = process.argv
const filePath = path.resolve(process.cwd(), input)

if (!fs.existsSync(filePath)) {
  console.error(`[salary-verification] Input file not found: ${filePath}`)
  console.error('Provide a JSON file with {"cases": []} as described in docs/salary-verification-report.md.')
  process.exit(1)
}

const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
const cases = Array.isArray(payload) ? payload : payload.cases

if (!Array.isArray(cases) || cases.length === 0) {
  console.error('[salary-verification] No cases found in input payload.')
  process.exit(1)
}

const summary = cases.map((entry, index) => {
  const target = Number(entry.expected?.netPay ?? entry.expected?.totalGross ?? 0)
  const actual = Number(entry.calculated?.netPay ?? entry.calculated?.totalGross ?? 0)
  const tolerance = Number(entry.tolerance ?? 10)
  const delta = actual - target
  const absDelta = Math.abs(delta)
  return {
    id: entry.id ?? `Payslip-${index + 1}`,
    employeeId: entry.employeeId ?? 'unknown',
    month: entry.month ?? 'unknown',
    target,
    actual,
    delta,
    absDelta,
    tolerance,
    pass: absDelta <= tolerance,
  }
})

const failing = summary.filter((row) => !row.pass)
const worst = summary.reduce((max, row) => (row.absDelta > max.absDelta ? row : max), summary[0])

console.log('Salary Verification Report')
console.log('===========================')
console.log(`Cases analysed : ${summary.length}`)
console.log(`Failures       : ${failing.length}`)
console.log(`Worst delta    : $${worst.absDelta.toFixed(2)} (${worst.id})`)
console.log('')
console.log('Details:')
summary.forEach((row) => {
  const deltaLabel = `${row.delta >= 0 ? '+' : '-'}$${Math.abs(row.delta).toFixed(2)}`
  console.log(
    `- ${row.id} (${row.employeeId}, ${row.month}) => actual $${row.actual.toFixed(2)} vs target $${row.target.toFixed(2)} | delta ${deltaLabel} | ${row.pass ? 'PASS' : 'FAIL'}`,
  )
})

if (failing.length) {
  process.exitCode = 1
}
