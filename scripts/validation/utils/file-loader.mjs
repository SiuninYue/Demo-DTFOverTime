import { readFileSync, existsSync, statSync } from 'node:fs'
import { basename, isAbsolute, relative, resolve } from 'node:path'
import process from 'node:process'
import validationConfig from '../../../config/validation.mjs'

class ValidationError extends Error {
  constructor(message, exitCode = 1) {
    super(message)
    this.name = 'ValidationError'
    this.exitCode = exitCode
  }
}

const toMegabytes = (bytes) => (bytes / 1024 / 1024).toFixed(1)

export const resolveInputPath = ({ input, allowedDir, scriptName }) => {
  const allowedDirPath = resolve(process.cwd(), allowedDir)
  const filePath = resolve(process.cwd(), input)
  const rel = relative(allowedDirPath, filePath)

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new ValidationError(
      `[${scriptName}] Invalid path: must be within ${allowedDir}/`,
    )
  }

  return filePath
}

export const ensureFileReady = ({ filePath, scriptName, maxSizeBytes }) => {
  if (!existsSync(filePath)) {
    throw new ValidationError(
      `[${scriptName}] Input file not found: ${basename(filePath)}`,
    )
  }

  const stats = statSync(filePath)
  if (stats.size > maxSizeBytes) {
    const maxMb = toMegabytes(maxSizeBytes)
    const actualMb = toMegabytes(stats.size)
    throw new ValidationError(
      `[${scriptName}] File too large: ${actualMb}MB (max ${maxMb}MB)`,
    )
  }
}

export const parseJsonFile = ({ filePath, scriptName }) => {
  try {
    const raw = readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    throw new ValidationError(
      `[${scriptName}] Invalid JSON: ${err.message}`,
    )
  }
}

export const extractCases = ({ payload, scriptName }) => {
  const cases = Array.isArray(payload) ? payload : payload?.cases

  if (!Array.isArray(cases) || cases.length === 0) {
    throw new ValidationError(`[${scriptName}] No cases found in input payload.`)
  }

  return cases
}

export const validateCasesSchema = ({ cases, schema, scriptName }) => {
  if (!schema) return cases
  const result = schema.safeParse(cases)

  if (!result.success) {
    throw new ValidationError(
      `[${scriptName}] Invalid input: ${result.error.message}`,
    )
  }

  return result.data
}

export const loadValidationCases = ({ input, schema, scriptName }) => {
  const filePath = resolveInputPath({
    input,
    allowedDir: validationConfig.paths.allowedValidationDir,
    scriptName,
  })

  ensureFileReady({
    filePath,
    scriptName,
    maxSizeBytes: validationConfig.limits.maxFileSizeBytes,
  })

  const payload = parseJsonFile({ filePath, scriptName })
  const cases = extractCases({ payload, scriptName })
  const validated = validateCasesSchema({ cases, schema, scriptName })

  return { filePath, cases: validated }
}

export { ValidationError }
