import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signIn, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resolveSignInError = (signInError: Error) => {
    const message = signInError.message.toLowerCase()

    if (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('enotfound')
    ) {
      return t('auth.networkError')
    }
    if (message.includes('email') && message.includes('confirm')) {
      return t('auth.emailNotConfirmed')
    }
    if (message.includes('invalid') && message.includes('credential')) {
      return t('auth.invalidCredentials')
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return t('auth.tooManyRequests')
    }

    return t('auth.loginError')
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

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(resolveSignInError(signInError))
    } else {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('app.name')}</h1>
          <h2>{t('auth.login')}</h2>
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
              autoComplete="current-password"
            />
          </div>

          <div className="auth-form-link">
            <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
          </button>

          <div className="auth-footer">
            <p>
              {t('auth.noAccount')}{' '}
              <Link to="/register">{t('auth.register')}</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
