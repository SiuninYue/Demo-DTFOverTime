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
    throw new UploadValidationError('A file must be provided before uploading.', 'FILE_REQUIRED')
  }

  if (file.size > scheduleStorage.maxFileSize) {
    throw new UploadValidationError('Image exceeds the 5MB upload limit.', 'FILE_TOO_LARGE')
  }

  if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadValidationError(
      `Unsupported file type "${file.type}". Please upload JPEG, PNG, WebP, HEIC, or AVIF images.`,
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
