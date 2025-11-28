import { CalculationMode } from '@/types/employee'

export interface PartIVEvaluationInput {
  baseSalary: number
  isWorkman: boolean
}

export interface PartIVEvaluationResult {
  isApplicable: boolean
  calculationMode: CalculationMode
  threshold: number
}

const WORKMAN_THRESHOLD = 4500
const NON_WORKMAN_THRESHOLD = 2600

export const getPartIVThreshold = (isWorkman: boolean): number =>
  isWorkman ? WORKMAN_THRESHOLD : NON_WORKMAN_THRESHOLD

export const evaluatePartIV = ({
  baseSalary,
  isWorkman,
}: PartIVEvaluationInput): PartIVEvaluationResult => {
  const threshold = getPartIVThreshold(isWorkman)
  const isApplicable = baseSalary <= threshold
  return {
    isApplicable,
    calculationMode: isApplicable
      ? CalculationMode.FULL_COMPLIANCE
      : CalculationMode.BASIC_TRACKING,
    threshold,
  }
}
