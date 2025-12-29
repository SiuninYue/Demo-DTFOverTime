import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'

function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { requestPasswordReset, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // Countdown timer after successful submission
  useEffect(() => {
    if (isSubmitted && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isSubmitted && countdown === 0) {
      navigate('/login')
    }
  }, [isSubmitted, countdown, navigate])

  const resolveResetError = (resetError: Error) => {
    const message = resetError.message.toLowerCase()

    if (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('enotfound')
    ) {
      return t('auth.networkError')
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return t('auth.tooManyRequests')
    }

    return t('auth.resetPasswordError')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError(t('auth.emailRequired'))
      return
    }

    const { error: resetError } = await requestPasswordReset(email)

    if (resetError) {
      setError(resolveResetError(resetError))
    } else {
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('app.name')}</h1>
            <h2>{t('auth.resetLinkSent')}</h2>
          </div>

          <div className="auth-success">
            {t('auth.resetLinkSentDescription', { countdown })}
          </div>

          <Link to="/login" className="auth-button" style={{ textAlign: 'center', display: 'block', marginTop: '1rem', textDecoration: 'none' }}>
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('app.name')}</h1>
          <h2>{t('auth.forgotPasswordTitle')}</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            {t('auth.forgotPasswordDescription')}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
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

export default ForgotPasswordPage
