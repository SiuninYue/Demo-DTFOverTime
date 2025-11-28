import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScheduleImageInfo } from '@/services/supabase/storage'
import {
  uploadImageToSupabase,
  validateImageFile,
  UploadValidationError,
} from '@/services/supabase/uploadImage'

export type UploadStatus = 'idle' | 'ready' | 'uploading' | 'uploaded' | 'error'

interface UseUploadOptions {
  employeeId: string
  month: string
  autoStart?: boolean
  onSuccess?: (info: ScheduleImageInfo) => void
}

const createObjectPreview = (file: File) => URL.createObjectURL(file)

export const useUpload = ({
  employeeId,
  month,
  autoStart = true,
  onSuccess,
}: UseUploadOptions) => {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<ScheduleImageInfo | null>(null)
  const progressTimer = useRef<number | null>(null)

  const clearProgressTimer = useCallback(() => {
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current)
      progressTimer.current = null
    }
  }, [])

  const simulateProgress = useCallback(() => {
    clearProgressTimer()
    progressTimer.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          clearProgressTimer()
          return current
        }
        return Math.min(90, current + 5)
      })
    }, 250)
  }, [clearProgressTimer])

  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(
    () => () => {
      clearProgressTimer()
      revokePreview()
    },
    [clearProgressTimer, revokePreview],
  )

  const startUpload = useCallback(
    async (overrideFile?: File) => {
      const targetFile = overrideFile ?? file
      if (!targetFile) {
        setError('Please select an image before uploading.')
        setStatus('error')
        return
      }

      setStatus('uploading')
      setError(null)
      setProgress(5)
      simulateProgress()

      try {
        const uploaded = await uploadImageToSupabase({
          employeeId,
          month,
          file: targetFile,
        })

        clearProgressTimer()
        setProgress(100)
        setStatus('uploaded')
        setUploadedImage(uploaded)
        onSuccess?.(uploaded)
        return uploaded
      } catch (uploadError) {
        clearProgressTimer()
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : 'Unexpected error occurred during upload.'
        setError(message)
        setStatus('error')
        throw uploadError
      }
    },
    [employeeId, month, file, onSuccess, simulateProgress, clearProgressTimer],
  )

  const selectFile = useCallback(
    (nextFile: File) => {
      try {
        validateImageFile(nextFile)
      } catch (validationError) {
        if (validationError instanceof UploadValidationError) {
          setError(validationError.message)
        } else if (validationError instanceof Error) {
          setError(validationError.message)
        } else {
          setError('Failed to validate image.')
        }
        setStatus('error')
        return
      }

      revokePreview()
      setError(null)
      setStatus('ready')
      setProgress(0)
      setUploadedImage(null)
      setFile(nextFile)
      setPreviewUrl(createObjectPreview(nextFile))

      if (autoStart) {
        startUpload(nextFile).catch(() => {
          // Error is handled inside startUpload
        })
      }
    },
    [autoStart, revokePreview, startUpload],
  )

  const resetUpload = useCallback(() => {
    clearProgressTimer()
    revokePreview()
    setStatus('idle')
    setProgress(0)
    setError(null)
    setFile(null)
    setPreviewUrl(null)
    setUploadedImage(null)
  }, [clearProgressTimer, revokePreview])

  const canRetry = useMemo(() => status === 'error' || status === 'uploaded', [status])

  return {
    status,
    progress,
    error,
    previewUrl,
    uploadedImage,
    hasUploaded: status === 'uploaded' && Boolean(uploadedImage),
    selectFile,
    startUpload,
    resetUpload,
    canRetry,
  }
}
