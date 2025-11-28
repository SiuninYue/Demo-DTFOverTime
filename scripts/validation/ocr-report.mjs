#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const [, , input = 'reports/validation/ocr-results.json'] = process.argv
const filePath = path.resolve(process.cwd(), input)

if (!fs.existsSync(filePath)) {
  console.error(`[ocr-report] Input file not found: ${filePath}`)
  console.error('Create a JSON file with an array or {"cases": []} payload before running this script.')
  process.exit(1)
}

const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
const cases = Array.isArray(payload) ? payload : payload.cases

if (!Array.isArray(cases) || cases.length === 0) {
  console.error('[ocr-report] No cases found in input payload.')
  process.exit(1)
}

const normalizeAccuracy = (entry) => {
  if (typeof entry.accuracy === 'number') {
    return entry.accuracy
  }
  const correct = Number(entry.correctCells ?? entry.correctTokens ?? entry.matches ?? 0)
  const total = Number(entry.totalCells ?? entry.totalTokens ?? entry.expected ?? 0)
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
    return 0
  }
  return Math.min(1, Math.max(0, correct / total))
}

const rows = cases.map((entry, index) => ({
  id: entry.id ?? `Case-${index + 1}`,
  image: entry.image ?? entry.file ?? 'unknown',
  reviewer: entry.reviewer ?? 'unassigned',
  accuracy: normalizeAccuracy(entry),
  warnings: entry.warnings ?? entry.notes ?? '',
}))

const aggregate = rows.reduce(
  (acc, row) => {
    acc.sum += row.accuracy
    if (row.accuracy >= 0.9) acc.pass += 1
    return acc
  },
  { sum: 0, pass: 0 },
)

const averageAccuracy = rows.length ? aggregate.sum / rows.length : 0

console.log('OCR Accuracy Report')
console.log('===================')
console.log(`Cases analysed : ${rows.length}`)
console.log(`Average accuracy: ${(averageAccuracy * 100).toFixed(2)}%`)
console.log(`Pass (>=90%)   : ${aggregate.pass}`)
console.log('')
console.log('Details:')
rows.forEach((row) => {
  const pct = (row.accuracy * 100).toFixed(2)
  console.log(`- ${row.id} | ${row.image} | ${pct}% | reviewer: ${row.reviewer}${row.warnings ? ` | notes: ${row.warnings}` : ''}`)
})
