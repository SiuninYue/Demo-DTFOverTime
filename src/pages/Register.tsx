import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'

function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signUp, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resolveSignUpError = (signUpError: Error) => {
    const message = signUpError.message.toLowerCase()

    if (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('enotfound')
    ) {
      return t('auth.networkError')
    }
    if (message.includes('signup') && message.includes('allow')) {
      return t('auth.signupDisabled')
    }
    if (message.includes('email') && message.includes('invalid')) {
      return t('auth.invalidEmail')
    }
    if (message.includes('email') && message.includes('registered')) {
      return t('auth.emailExists')
    }
    if (message.includes('password')) {
      return t('auth.passwordWeak')
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return t('auth.tooManyRequests')
    }

    return t('auth.registerError')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError(t('auth.emailRequired'))
      return
    }
    if (!password) {
      setError(t('auth.passwordRequired'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    const normalizedEmail = email.trim()
    if (normalizedEmail !== email) {
      setEmail(normalizedEmail)
    }

    const { error: signUpError } = await signUp(normalizedEmail, password)

    if (signUpError) {
      setError(resolveSignUpError(signUpError))
    } else {
      navigate('/settings')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('app.name')}</h1>
          <h2>{t('auth.register')}</h2>
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.registering') : t('auth.registerButton')}
          </button>

          <div className="auth-footer">
            <p>
              {t('auth.hasAccount')}{' '}
              <Link to="/login">{t('auth.login')}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
