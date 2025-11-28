import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ImageUpload from '@/components/upload/ImageUpload'
import ManualScheduleForm from '@/components/schedule/ManualScheduleForm'
import ScheduleImageViewer from '@/components/calendar/ScheduleImageViewer'
import { useUpload } from '@/hooks/useUpload'
import { DEMO_EMPLOYEE_ID } from '@/hooks/useSalary'
import { useAuthStore } from '@/store/authStore'
import type { ScheduleData } from '@/types/schedule'
import { upsertSchedule } from '@/services/supabase/database'
import { useScheduleStore } from '@/store/scheduleStore'
import Loading from '@/components/common/Loading'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useToast } from '@/components/common/Toast'

const getCurrentMonthId = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function ScheduleImportPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const employeeId = useAuthStore((state) => state.user?.id) ?? DEMO_EMPLOYEE_ID
  const [month, setMonth] = useState(searchParams.get('month') ?? getCurrentMonthId())
  const [viewerOpen, setViewerOpen] = useState(false)
  const [manualStatus, setManualStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const setSchedule = useScheduleStore((state) => state.setSchedule)
  const { isOnline } = useNetworkStatus()
  const { showToast } = useToast()

  const upload = useUpload({
    employeeId,
    month,
    onSuccess: () => {
      setStatusMessage(
        'Upload successful. Future versions will auto-populate this form via GPT-4 Vision.',
      )
      showToast({
        title: 'Upload complete',
        description: 'Roster photo stored in Supabase Storage.',
        variant: 'success',
      })
    },
  })

  const handleScheduleSubmit = async (data: ScheduleData) => {
    setManualStatus('saving')
    try {
      const saved = await upsertSchedule({
        employeeId,
        month,
        scheduleData: data,
        imageUrl: upload.uploadedImage?.publicUrl ?? null,
        imageFileName: upload.uploadedImage?.fileName ?? null,
        imageSize: upload.uploadedImage?.size ?? null,
      })
      setSchedule(saved)
      setManualStatus('success')
      setStatusMessage('Schedule saved to Supabase. Manual entry complete.')
      showToast({
        title: 'Schedule saved',
        description: `${month} roster is ready for calendar + timecards.`,
        variant: 'success',
      })
      navigate(`/calendar/${month}`)
    } catch (error) {
      setManualStatus('error')
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to save schedule. Please retry.',
      )
      showToast({
        title: 'Save failed',
        description:
          error instanceof Error ? error.message : 'Unable to persist schedule. Please retry.',
        variant: 'error',
      })
      throw error
    }
  }

  const canOpenViewer = upload.hasUploaded && Boolean(upload.previewUrl || upload.uploadedImage)

  const readableFileSize = useMemo(() => {
    if (!upload.uploadedImage?.size) {
      return null
    }
    const size = upload.uploadedImage.size
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }, [upload.uploadedImage])

  return (
    <section className="schedule-import">
      <header>
        <h1>Import Schedule</h1>
        <p className="text-muted">
          Step 1: Upload the roster photo. Step 2: Enter or confirm each day&apos;s details. Phase B
          will automate recognition via GPT-4 Vision.
        </p>
        <div className="form-control">
          <label htmlFor="month-input">Target Month</label>
          <input
            id="month-input"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </div>
      </header>

      {!isOnline && (
        <p className="offline-banner">
          You are offline. Uploading new rosters and saving manual edits are disabled until you
          reconnect.
        </p>
      )}

      <ImageUpload
        status={upload.status}
        progress={upload.progress}
        error={upload.error}
        previewUrl={upload.previewUrl ?? upload.uploadedImage?.publicUrl}
        onFileSelect={upload.selectFile}
        onRetry={upload.resetUpload}
        onRemove={upload.resetUpload}
        disabled={!isOnline}
      />

      {upload.status === 'uploading' && (
        <Loading label="Uploading roster" description="Please keep the app open" progress={upload.progress} />
      )}

      {statusMessage && (
        <p
          className={
            manualStatus === 'error' || upload.status === 'error' ? 'upload-error' : 'text-success'
          }
        >
          {statusMessage}
        </p>
      )}

      {upload.uploadedImage && (
        <div className="upload-summary">
          <div>
            <p>
              <strong>Stored File:</strong> {upload.uploadedImage.fileName}
            </p>
            {readableFileSize && (
              <p className="text-muted">
                Size: {readableFileSize} · Bucket: {upload.uploadedImage.bucket}
              </p>
            )}
          </div>
          <div className="upload-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setViewerOpen(true)}
              disabled={!canOpenViewer}
            >
              View full screen
            </button>
            <button type="button" className="ghost" onClick={upload.resetUpload}>
              Start over
            </button>
          </div>
        </div>
      )}

      <ScheduleImageViewer
        imageUrl={upload.previewUrl ?? upload.uploadedImage?.publicUrl}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fileName={upload.uploadedImage?.fileName}
      />

      <ManualScheduleForm
        month={month}
        isSaving={manualStatus === 'saving'}
        onSubmit={handleScheduleSubmit}
        disabled={!upload.hasUploaded || !isOnline}
        disabledReason={!isOnline ? 'Connect to the internet to edit and save schedule entries.' : null}
      />
    </section>
  )
}

export default ScheduleImportPage
