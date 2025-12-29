import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { getSupabaseClient } from '@/config/supabase'
import {
  validatePasswordStrength,
  validatePasswordMatch,
} from '@/utils/passwordValidation'

function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { resetPassword, isLoading } = useAuthStore()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkRecoverySession = async () => {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setIsTokenValid(false)
        setError(t('auth.invalidResetToken'))
      } else {
        setIsTokenValid(true)
      }
    }

    checkRecoverySession()
  }, [t])

  // Countdown timer after successful reset
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isSuccess && countdown === 0) {
      navigate('/login')
    }
  }, [isSuccess, countdown, navigate])

  const resolveResetError = (resetError: Error) => {
    const message = resetError.message.toLowerCase()

    if (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('enotfound')
    ) {
      return t('auth.networkError')
    }
    if (message.includes('password')) {
      return t('auth.passwordTooWeak')
    }

    return t('auth.resetPasswordError')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!password) {
      setError(t('auth.passwordRequired'))
      return
    }

    const { isValid, errors } = validatePasswordStrength(password)
    if (!isValid) {
      setError(t('auth.passwordTooWeak'))
      return
    }

    if (!validatePasswordMatch(password, confirmPassword)) {
      setError(t('auth.passwordNotMatch'))
      return
    }

    const { error: resetError } = await resetPassword(password)

    if (resetError) {
      setError(resolveResetError(resetError))
    } else {
      setIsSuccess(true)
    }
  }

  // Token is invalid
  if (isTokenValid === false) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('app.name')}</h1>
            <h2>{t('auth.resetPasswordTitle')}</h2>
          </div>

          <div className="auth-error">
            {error}
          </div>

          <Link to="/forgot-password" className="auth-button" style={{ textAlign: 'center', display: 'block', marginTop: '1rem', textDecoration: 'none' }}>
            {t('auth.sendResetLink')}
          </Link>

          <div className="auth-footer">
            <p>
              <Link to="/login">{t('auth.backToLogin')}</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('app.name')}</h1>
            <h2>{t('auth.resetPasswordTitle')}</h2>
          </div>

          <div className="auth-success">
            {t('auth.resetPasswordSuccess', { countdown })}
          </div>

          <Link to="/login" className="auth-button" style={{ textAlign: 'center', display: 'block', marginTop: '1rem', textDecoration: 'none' }}>
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  // Loading state (checking token)
  if (isTokenValid === null) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('app.name')}</h1>
            <h2>{t('auth.resetPasswordTitle')}</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            {t('common.loading')}
          </div>
        </div>
      </div>
    )
  }

  // Reset form
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('app.name')}</h1>
          <h2>{t('auth.resetPasswordTitle')}</h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">{t('auth.newPassword')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="password-hint">
            {t('auth.passwordRequirements')}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.resettingPassword') : t('auth.resetPasswordButton')}
          </button>

          <div className="auth-footer">
            <p>
              <Link to="/login">{t('auth.backToLogin')}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
