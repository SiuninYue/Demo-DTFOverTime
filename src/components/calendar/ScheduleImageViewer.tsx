import { useMemo, useRef, useState, type TouchEvent } from 'react'

interface ScheduleImageViewerProps {
  imageUrl?: string | null
  open: boolean
  onClose: () => void
  fileName?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function ScheduleImageViewer({ imageUrl, open, onClose, fileName }: ScheduleImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const pinchDistance = useRef<number | null>(null)

  const title = useMemo(() => fileName ?? 'Schedule preview', [fileName])

  if (!open || !imageUrl) {
    return null
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = fileName ?? 'schedule.jpg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="viewer-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="viewer-toolbar">
        <strong>{title}</strong>
        <div className="viewer-controls">
          <label>
            Zoom
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <button type="button" className="secondary" onClick={handleDownload}>
            Download
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div
        className="viewer-canvas"
        onWheel={(event) => {
          event.preventDefault()
          const delta = event.deltaY > 0 ? -0.1 : 0.1
          setZoom((value) => clamp(value + delta, 0.5, 2.5))
        }}
        onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
          if (event.touches.length === 2) {
            event.preventDefault()
            const [first, second] = event.touches
            const distance = Math.hypot(
              second.clientX - first.clientX,
              second.clientY - first.clientY,
            )
            pinchDistance.current = distance
          }
        }}
        onTouchMove={(event: TouchEvent<HTMLDivElement>) => {
          if (event.touches.length === 2 && pinchDistance.current) {
            event.preventDefault()
            const [first, second] = event.touches
            const distance = Math.hypot(
              second.clientX - first.clientX,
              second.clientY - first.clientY,
            )
            const ratio = distance / pinchDistance.current
            pinchDistance.current = distance
            setZoom((value) => clamp(value * ratio, 0.5, 2.5))
          }
        }}
        onTouchEnd={() => {
          pinchDistance.current = null
        }}
        onTouchCancel={() => {
          pinchDistance.current = null
        }}
      >
        <img src={imageUrl} alt="Schedule preview" style={{ transform: `scale(${zoom})` }} />
      </div>
    </div>
  )
}

export default ScheduleImageViewer
