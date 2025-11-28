interface LoadingProps {
  label?: string
  description?: string
  progress?: number
  variant?: 'inline' | 'full'
}

function Loading({
  label = 'Loading',
  description,
  progress,
  variant = 'inline',
}: LoadingProps) {
  const clampedProgress =
    typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress))) : undefined

  return (
    <div className={['loading', `loading--${variant}`].join(' ')} role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden />
      <div className="loading__content">
        <p className="loading__label">{label}</p>
        {description && <p className="loading__description">{description}</p>}
      </div>
      {typeof clampedProgress === 'number' && (
        <div className="loading__progress" aria-label="Progress">
          <div className="loading__progress-bar" style={{ width: `${clampedProgress}%` }} />
        </div>
      )}
    </div>
  )
}

export default Loading
