import { scheduleStorage, type UploadScheduleImageParams } from './storage'
import { compressImageIfNeeded } from '@/utils/imageCompression'

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
]

export class UploadValidationError extends Error {
  constructor(
    message: string,
    public readonly code: 'FILE_REQUIRED' | 'UNSUPPORTED_TYPE' | 'FILE_TOO_LARGE',
  ) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

export const validateImageFile = (file?: File) => {
  if (!file) {
    throw new UploadValidationError('上传前请选择文件。', 'FILE_REQUIRED')
  }

  if (file.size > scheduleStorage.maxFileSize) {
    throw new UploadValidationError('图片大小超过 5MB 上传限制。', 'FILE_TOO_LARGE')
  }

  if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadValidationError(
      `不支持的文件类型 "${file.type}"。请上传 JPEG、PNG、WebP、HEIC 或 AVIF 图片。`,
      'UNSUPPORTED_TYPE',
    )
  }

  return file
}

export interface UploadImageOptions extends UploadScheduleImageParams {
  file: File
}

export const uploadImageToSupabase = async (options: UploadImageOptions) => {
  const candidate = await compressImageIfNeeded(options.file)
  const file = validateImageFile(candidate)
  return scheduleStorage.upload({ ...options, file })
}
