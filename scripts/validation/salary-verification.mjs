#!/usr/bin/env node
import process from 'node:process'
import { z } from 'zod'
import validationConfig from '../../config/validation.mjs'
import { loadValidationCases, ValidationError } from './utils/file-loader.mjs'

const scriptName = 'salary-verification'

const salaryCaseSchema = z
  .array(
    z
      .object({
        id: z.string().optional(),
        employeeId: z.string().optional(),
        month: z.string().optional(),
        tolerance: z.number().nonnegative().optional(),
        expected: z
          .object({
            netPay: z.number().finite().optional(),
            totalGross: z.number().finite().optional(),
          })
          .partial()
          .optional(),
        calculated: z
          .object({
            netPay: z.number().finite().optional(),
            totalGross: z.number().finite().optional(),
          })
          .partial()
          .optional(),
      })
      .passthrough(),
  )
  .default([])

export const buildSalarySummary = (
  cases,
  defaultTolerance = validationConfig.salary.defaultTolerance,
) =>
  cases.map((entry, index) => {
    const target = Number(entry.expected?.netPay ?? entry.expected?.totalGross ?? 0)
    const actual = Number(entry.calculated?.netPay ?? entry.calculated?.totalGross ?? 0)
    const tolerance = Number(entry.tolerance ?? defaultTolerance)
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

export const pickWorstDelta = (summary) =>
  summary.length > 0
    ? summary.reduce((max, row) => (row.absDelta > max.absDelta ? row : max))
    : { absDelta: 0, id: 'N/A' }

export const printSalaryReport = (summary) => {
  const failing = summary.filter((row) => !row.pass)
  const worst = pickWorstDelta(summary)

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
}

export const main = (input = validationConfig.paths.salaryDefaultInput) => {
  try {
    const { cases } = loadValidationCases({
      input,
      schema: salaryCaseSchema,
      scriptName,
    })
    const summary = buildSalarySummary(cases)
    printSalaryReport(summary)
  } catch (err) {
    const exitCode = err.exitCode ?? 1
    const message = err instanceof ValidationError ? err.message : `[${scriptName}] ${err.message}`
    console.error(message)
    process.exit(exitCode)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , input = validationConfig.paths.salaryDefaultInput] = process.argv
  main(input)
}
