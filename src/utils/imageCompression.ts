const MIN_COMPRESSION_BYTES = 1.5 * 1024 * 1024
const MAX_DIMENSION = 2400
const DEFAULT_QUALITY = 0.82

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = (error) => {
      URL.revokeObjectURL(url)
      reject(error)
    }
    image.src = url
  })

export const compressImageIfNeeded = async (file: File): Promise<File> => {
  if (typeof window === 'undefined') {
    return file
  }

  if (!file.type.startsWith('image/') || file.size < MIN_COMPRESSION_BYTES) {
    return file
  }

  try {
    const image = await loadImage(file)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) {
      return file
    }

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(image.width, image.height),
    )

    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const compressedBlob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        DEFAULT_QUALITY,
      ),
    )

    if (!compressedBlob) {
      return file
    }

    const nextFileName = file.name.replace(/\.\w+$/, '.jpg')
    return new File([compressedBlob], nextFileName, { type: 'image/jpeg' })
  } catch (error) {
    console.warn('[imageCompression] Unable to compress image', error)
    return file
  }
}

export default compressImageIfNeeded
