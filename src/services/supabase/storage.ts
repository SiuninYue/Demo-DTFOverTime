import { getSupabaseClient } from '@/config/supabase'

const SCHEDULE_BUCKET = 'schedule-images'
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const DEFAULT_CACHE_CONTROL = '3600'

export interface ScheduleImageInfo {
  bucket: string
  path: string
  publicUrl: string
  fileName: string
  size: number
  contentType?: string
}

export interface UploadScheduleImageParams {
  employeeId: string
  month: string
  file: Blob
  cacheControl?: string
}

const sanitizeSegment = (value: string, fallback: string): string => {
  const normalized = value.trim().replace(/[^a-zA-Z0-9/_-]/g, '')
  return normalized.length > 0 ? normalized : fallback
}

const ensureMonthFormat = (month: string): string => {
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return month
  }
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

const buildStoragePath = (employeeId: string, month: string, fileName: string) => {
  const safeEmployeeId = sanitizeSegment(employeeId, 'anonymous')
  const safeMonth = ensureMonthFormat(month)
  return `${safeEmployeeId}/${safeMonth}/${fileName}`
}

const deriveFileName = (file: Blob, month: string): string => {
  const randomSuffix =
    (globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 8)) ??
    Math.random().toString(36).slice(2, 10)

  if (file instanceof File && file.name) {
    const extension = file.name.includes('.') ? file.name.split('.').pop() : undefined
    if (extension) {
      return `${ensureMonthFormat(month)}-${randomSuffix}.${extension}`
    }
  }

  const fallbackExtension =
    (file instanceof File && file.type ? file.type.split('/').pop() : undefined) ?? 'jpg'
  return `${ensureMonthFormat(month)}-${randomSuffix}.${fallbackExtension}`
}

export const uploadScheduleImage = async ({
  employeeId,
  month,
  file,
  cacheControl = DEFAULT_CACHE_CONTROL,
}: UploadScheduleImageParams): Promise<ScheduleImageInfo> => {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('图片大小超过 5MB（Supabase Storage 限制）。')
  }

  const supabase = getSupabaseClient()
  const fileName = deriveFileName(file, month)
  const path = buildStoragePath(employeeId, month, fileName)

  const { error } = await supabase.storage.from(SCHEDULE_BUCKET).upload(path, file, {
    cacheControl,
    contentType: file instanceof File ? file.type : undefined,
    upsert: true,
  })

  if (error) {
    throw new Error(`上传排班图片失败：${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(SCHEDULE_BUCKET).getPublicUrl(path)

  return {
    bucket: SCHEDULE_BUCKET,
    path,
    publicUrl,
    fileName,
    size: file.size,
    contentType: file instanceof File ? file.type : undefined,
  }
}

export const downloadScheduleImage = async (path: string): Promise<Blob> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.storage.from(SCHEDULE_BUCKET).download(path)

  if (error || !data) {
    throw new Error(`下载图片失败（${path}）：${error?.message ?? '未知错误'}`)
  }

  return data
}

export const getScheduleImagePublicUrl = (path: string): string => {
  const supabase = getSupabaseClient()
  const {
    data: { publicUrl },
  } = supabase.storage.from(SCHEDULE_BUCKET).getPublicUrl(path)
  return publicUrl
}

export const scheduleStorage = {
  bucket: SCHEDULE_BUCKET,
  maxFileSize: MAX_IMAGE_SIZE_BYTES,
  upload: uploadScheduleImage,
  download: downloadScheduleImage,
  getPublicUrl: getScheduleImagePublicUrl,
}
