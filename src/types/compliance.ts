export type ComplianceRuleLayer =
  | 'MOM_STATUTORY'
  | 'COMPANY_POLICY'
  | 'SHOP_AGREEMENT'
  | 'INDIVIDUAL_CONTRACT'

export type ComplianceRuleType =
  | 'OT_MULTIPLIER'
  | 'REST_DAY_PAY'
  | 'PH_PAY'
  | 'ATTENDANCE_BONUS'
  | 'ALLOWANCE'
  | 'DEDUCTION'
  | 'PART_IV_ELIGIBILITY'
  | 'CUSTOM'

export interface ComplianceRule {
  id?: string
  type: ComplianceRuleType
  layer: ComplianceRuleLayer
  priority: number
  source: string
  payload: Record<string, unknown>
  effectiveFrom?: string
  effectiveTo?: string
}

export interface ComplianceRuleSet {
  id: string
  name: string
  outletCode?: string
  positionLevel?: string
  rules: ComplianceRule[]
  createdAt?: string
}
