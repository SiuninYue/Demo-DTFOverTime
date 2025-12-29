/**
 * 密码验证工具
 * Password validation utilities
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * 验证密码强度
 * Validates password strength (at least 8 characters, contains letters and numbers)
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 获取密码强度等级
 * Get password strength level for UI display
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length === 0) {
    return 'weak'
  }

  let score = 0

  // Length score
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Complexity score
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

/**
 * 验证两次密码输入是否一致
 * Validates if password and confirmation match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0
}
