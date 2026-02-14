/**
 * Image compression and optimization utilities
 */

const MAX_PROFILE_PICTURE_SIZE = 10 * 1024 * 1024 // 10MB
const TARGET_SIZE = 500 * 1024 // 500KB target for compressed images
const MAX_DIMENSION = 1024 // Max width/height for profile pictures

export interface CompressionResult {
  success: boolean
  originalSize: number
  compressedSize: number
  compressionRatio: number
  dataUrl?: string
  error?: string
}

/**
 * Check if image needs compression based on size
 */
export function needsCompression(sizeInBytes: number): boolean {
  return sizeInBytes > TARGET_SIZE
}

/**
 * Validate image size
 */
export function isValidImageSize(sizeInBytes: number): boolean {
  return sizeInBytes <= MAX_PROFILE_PICTURE_SIZE
}

/**
 * Compress image on the client side using Canvas API
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 10,
  targetSizeKB: number = 500
): Promise<CompressionResult> {
  return new Promise((resolve) => {
    if (!isValidImageSize(file.size)) {
      resolve({
        success: false,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        error: `Image size exceeds maximum allowed size of ${maxSizeMB}MB`,
      })
      return
    }

    const reader = new FileReader()
    
    reader.onerror = () => {
      resolve({
        success: false,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        error: 'Failed to read file',
      })
    }

    reader.onload = (e) => {
      const img = new Image()
      
      img.onerror = () => {
        resolve({
          success: false,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          error: 'Failed to load image',
        })
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img
          
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION
              width = MAX_DIMENSION
            } else {
              width = (width / height) * MAX_DIMENSION
              height = MAX_DIMENSION
            }
          }

          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            throw new Error('Failed to get canvas context')
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height)

          // Try different quality levels to reach target size
          let quality = 0.9
          let dataUrl = canvas.toDataURL('image/jpeg', quality)
          let currentSize = Math.round((dataUrl.length * 3) / 4) // Approximate size

          // Binary search for optimal quality
          while (currentSize > targetSizeKB * 1024 && quality > 0.1) {
            quality -= 0.1
            dataUrl = canvas.toDataURL('image/jpeg', quality)
            currentSize = Math.round((dataUrl.length * 3) / 4)
          }

          const compressionRatio = file.size / currentSize

          resolve({
            success: true,
            originalSize: file.size,
            compressedSize: currentSize,
            compressionRatio,
            dataUrl,
          })
        } catch (error) {
          resolve({
            success: false,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 1,
            error: error instanceof Error ? error.message : 'Compression failed',
          })
        }
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Server-side function to queue image for optimization
 */
export async function queueImageOptimization(
  sql: any,
  userId: string,
  imagePath: string,
  originalSize: number
): Promise<void> {
  await sql`
    INSERT INTO image_optimization_queue (
      user_id, image_path, original_size, current_size, optimization_status, priority
    ) VALUES (
      ${userId}, ${imagePath}, ${originalSize}, ${originalSize}, 'pending', 0
    )
    ON CONFLICT (user_id, image_path) 
    DO UPDATE SET 
      original_size = ${originalSize},
      current_size = ${originalSize},
      optimization_status = 'pending',
      updated_at = CURRENT_TIMESTAMP
  `
}
