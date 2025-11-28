import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] captured error', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle ?? 'Something went wrong'
      return (
        <section className="error-fallback" role="alert">
          <div>
            <p className="error-fallback__eyebrow">System notice</p>
            <h1>{title}</h1>
            <p className="error-fallback__message">
              {this.state.error?.message ?? 'An unexpected error occurred. Please try again.'}
            </p>
          </div>
          <div className="error-fallback__actions">
            <button type="button" className="secondary" onClick={this.handleReset}>
              Retry
            </button>
            <button type="button" className="ghost" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </section>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
