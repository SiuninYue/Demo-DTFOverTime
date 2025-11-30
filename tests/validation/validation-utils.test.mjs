// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import validationConfig from '../../config/validation.mjs'
import { normalizeAccuracy } from '../../scripts/validation/ocr-report.mjs'
import { buildSalarySummary, pickWorstDelta } from '../../scripts/validation/salary-verification.mjs'
import {
  ensureFileReady,
  extractCases,
  parseJsonFile,
  resolveInputPath,
  ValidationError,
} from '../../scripts/validation/utils/file-loader.mjs'

const tempFile = join(process.cwd(), validationConfig.paths.allowedValidationDir, 'test-validation.json')

afterEach(() => {
  rmSync(tempFile, { force: true })
})

describe('file loader safeguards', () => {
  it('prevents path traversal outside allowed directory', () => {
    const outsidePath = '../outside.json'
    expect(() =>
      resolveInputPath({
        input: outsidePath,
        allowedDir: validationConfig.paths.allowedValidationDir,
        scriptName: 'test-script',
      }),
    ).toThrowError(ValidationError)
  })

  it('rejects files that exceed configured size', () => {
    writeFileSync(tempFile, '123456')
    expect(() =>
      ensureFileReady({
        filePath: tempFile,
        scriptName: 'test-script',
        maxSizeBytes: 1,
      }),
    ).toThrowError(ValidationError)
  })

  it('wraps JSON.parse errors with user-friendly message', () => {
    writeFileSync(tempFile, '{ invalid json }')
    expect(() =>
      parseJsonFile({
        filePath: tempFile,
        scriptName: 'test-script',
      }),
    ).toThrowError(ValidationError)
  })

  it('extracts cases payload or throws when missing', () => {
    expect(() =>
      extractCases({
        payload: { cases: [] },
        scriptName: 'test-script',
      }),
    ).toThrowError(ValidationError)
  })
})

describe('report calculators', () => {
  it('normalizes accuracy based on priority fields', () => {
    const entry = { correctCells: 8, totalCells: 10, correctTokens: 5, totalTokens: 6 }
    expect(normalizeAccuracy(entry)).toBeCloseTo(0.8)
  })

  it('returns worst delta safely when summary is empty', () => {
    expect(pickWorstDelta([])).toEqual({ absDelta: 0, id: 'N/A' })
  })

  it('uses config default tolerance when entry omits it', () => {
    const cases = [
      {
        expected: { netPay: 100 },
        calculated: { netPay: 95 },
      },
    ]
    const summary = buildSalarySummary(cases)
    expect(summary[0].tolerance).toBe(validationConfig.salary.defaultTolerance)
  })
})
