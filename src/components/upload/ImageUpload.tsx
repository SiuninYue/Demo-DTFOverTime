import { ChangeEvent, DragEvent, useCallback, useRef, useState } from 'react'
import type { UploadStatus } from '@/hooks/useUpload'
import { ACCEPTED_IMAGE_TYPES } from '@/services/supabase/uploadImage'

interface ImageUploadProps {
  status: UploadStatus
  progress: number
  error?: string | null
  previewUrl?: string | null
  onFileSelect: (file: File) => void
  onRetry?: () => void
  onRemove?: () => void
  disabled?: boolean
}

const readableTypes = ACCEPTED_IMAGE_TYPES.map((type) => type.split('/').pop()?.toUpperCase())

function ImageUpload({
  status,
  progress,
  error,
  previewUrl,
  onFileSelect,
  onRetry,
  onRemove,
  disabled: forceDisabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const disabled = forceDisabled || status === 'uploading'

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) {
      return
    }
    const file = event.dataTransfer.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleBrowseClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const showProgress = status === 'uploading'
  const showPreview = Boolean(previewUrl)

  return (
    <section className="upload-panel">
      <header>
        <h2>Upload Schedule Image</h2>
        <p className="text-muted">
          Supported formats: {readableTypes.filter(Boolean).join(', ')} · Max size: 5MB
        </p>
      </header>

      <div
        className={['upload-dropzone', isDragging ? 'upload-dropzone--dragging' : '']
          .join(' ')
          .trim()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="presentation"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileInput}
          disabled={disabled}
        />

        <p className="upload-instruction">
          Drag & drop a roster photo here or
          <button
            type="button"
            className="link-button"
            onClick={handleBrowseClick}
            disabled={disabled}
          >
            browse files
          </button>
        </p>
        <p className="text-muted">Tip: Use the rear camera for sharper OCR results.</p>

        {showProgress && (
          <div className="upload-progress" aria-label="Upload progress">
            <div className="upload-progress__bar" style={{ width: `${progress}%` }} />
            <span>{progress}%</span>
          </div>
        )}
      </div>

      {error && <p className="upload-error">⚠️ {error}</p>}

      {showPreview && (
        <figure className="upload-preview">
          <img src={previewUrl ?? ''} alt="Schedule preview" />
          <figcaption>
            <span>Preview</span>
            <div className="upload-actions">
              {onRetry && (
                <button type="button" onClick={onRetry} className="secondary">
                  Re-upload
                </button>
              )}
              {onRemove && (
                <button type="button" onClick={onRemove} className="ghost">
                  Remove
                </button>
              )}
            </div>
          </figcaption>
        </figure>
      )}
    </section>
  )
}

export default ImageUpload
