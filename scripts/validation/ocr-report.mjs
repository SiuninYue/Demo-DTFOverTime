#!/usr/bin/env node
import process from 'node:process'
import { z } from 'zod'
import validationConfig from '../../config/validation.mjs'
import { loadValidationCases, ValidationError } from './utils/file-loader.mjs'

const scriptName = 'ocr-report'

const ocrCaseSchema = z
  .array(
    z
      .object({
        id: z.string().optional(),
        image: z.string().optional(),
        file: z.string().optional(),
        reviewer: z.string().optional(),
        accuracy: z.number().min(0).max(1).optional(),
        correctCells: z.number().int().nonnegative().optional(),
        totalCells: z.number().int().positive().optional(),
        correctTokens: z.number().int().nonnegative().optional(),
        totalTokens: z.number().int().positive().optional(),
        matches: z.number().int().nonnegative().optional(),
        expected: z.number().int().positive().optional(),
        warnings: z.string().optional(),
        notes: z.string().optional(),
      })
      .passthrough(),
  )
  .default([])

/**
 * Normalize accuracy from multiple field formats
 * Priority: accuracy > correctCells/totalCells > correctTokens/totalTokens > matches/expected
 */
export const normalizeAccuracy = (entry) => {
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

export const buildOcrRows = (cases) =>
  cases.map((entry, index) => ({
    id: entry.id ?? `Case-${index + 1}`,
    image: entry.image ?? entry.file ?? 'unknown',
    reviewer: entry.reviewer ?? 'unassigned',
    accuracy: normalizeAccuracy(entry),
    warnings: entry.warnings ?? entry.notes ?? '',
  }))

export const summarizeAccuracy = (rows, passThreshold = validationConfig.ocr.passThreshold) => {
  const aggregate = rows.reduce(
    (acc, row) => {
      acc.sum += row.accuracy
      if (row.accuracy >= passThreshold) acc.pass += 1
      return acc
    },
    { sum: 0, pass: 0 },
  )

  const averageAccuracy = rows.length ? aggregate.sum / rows.length : 0

  return {
    averageAccuracy,
    passCount: aggregate.pass,
    total: rows.length,
    passThreshold,
  }
}

export const printReport = (rows, summary) => {
  console.log('OCR Accuracy Report')
  console.log('===================')
  console.log(`Cases analysed : ${summary.total}`)
  console.log(`Average accuracy: ${(summary.averageAccuracy * 100).toFixed(2)}%`)
  console.log(`Pass (>=${(summary.passThreshold * 100).toFixed(0)}%)   : ${summary.passCount}`)
  console.log('')
  console.log('Details:')
  rows.forEach((row) => {
    const pct = (row.accuracy * 100).toFixed(2)
    console.log(`- ${row.id} | ${row.image} | ${pct}% | reviewer: ${row.reviewer}${row.warnings ? ` | notes: ${row.warnings}` : ''}`)
  })
}

export const main = (input = validationConfig.paths.ocrDefaultInput) => {
  try {
    const { cases } = loadValidationCases({
      input,
      schema: ocrCaseSchema,
      scriptName,
    })

    const rows = buildOcrRows(cases)
    const summary = summarizeAccuracy(rows)
    printReport(rows, summary)
  } catch (err) {
    const exitCode = err.exitCode ?? 1
    const message = err instanceof ValidationError ? err.message : `[${scriptName}] ${err.message}`
    console.error(message)
    process.exit(exitCode)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , input = validationConfig.paths.ocrDefaultInput] = process.argv
  main(input)
}
