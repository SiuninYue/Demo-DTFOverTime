const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export default {
  paths: {
    allowedValidationDir: 'reports/validation',
    ocrDefaultInput: 'reports/validation/ocr-results.json',
    salaryDefaultInput: 'reports/validation/salary-verification.json',
  },
  limits: {
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  },
  ocr: {
    passThreshold: 0.9,
  },
  salary: {
    defaultTolerance: 10,
  },
}
