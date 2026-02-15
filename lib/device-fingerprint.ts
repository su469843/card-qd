import crypto from 'crypto'

export interface DeviceInfo {
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
  colorDepth?: string
  deviceMemory?: string
  hardwareConcurrency?: string
}

/**
 * Generate a device fingerprint hash from device information
 */
export function generateFingerprint(deviceInfo: DeviceInfo): string {
  const components = [
    deviceInfo.userAgent,
    deviceInfo.screenResolution,
    deviceInfo.timezone,
    deviceInfo.language,
    deviceInfo.platform,
    deviceInfo.colorDepth || '',
    deviceInfo.deviceMemory || '',
    deviceInfo.hardwareConcurrency || '',
  ]

  const fingerprintString = components.join('|')
  return crypto.createHash('sha256').update(fingerprintString).digest('hex')
}

/**
 * Client-side function to collect device information
 * This should be called from the browser
 */
export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    throw new Error('collectDeviceInfo must be called from browser environment')
  }

  return {
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    colorDepth: String(window.screen.colorDepth),
    deviceMemory: (navigator as any).deviceMemory ? String((navigator as any).deviceMemory) : undefined,
    hardwareConcurrency: String(navigator.hardwareConcurrency),
  }
}

/**
 * Verify if a device fingerprint matches the expected one for a user
 */
export async function verifyDeviceFingerprint(
  sql: any,
  userId: string,
  currentFingerprint: string
): Promise<{ isValid: boolean; isTrusted: boolean; isNew: boolean }> {
  const result = await sql`
    SELECT * FROM device_fingerprints 
    WHERE user_id = ${userId} AND fingerprint_hash = ${currentFingerprint}
  `

  if (result.length === 0) {
    return { isValid: false, isTrusted: false, isNew: true }
  }

  const device = result[0]
  
  // Update last seen
  await sql`
    UPDATE device_fingerprints 
    SET last_seen_at = CURRENT_TIMESTAMP 
    WHERE id = ${device.id}
  `

  return {
    isValid: true,
    isTrusted: device.is_trusted,
    isNew: false,
  }
}

/**
 * Register a new device fingerprint for a user
 */
export async function registerDeviceFingerprint(
  sql: any,
  userId: string,
  fingerprintHash: string,
  deviceInfo: DeviceInfo
): Promise<void> {
  await sql`
    INSERT INTO device_fingerprints (
      user_id, fingerprint_hash, user_agent, screen_resolution,
      timezone, language, platform
    ) VALUES (
      ${userId}, ${fingerprintHash}, ${deviceInfo.userAgent},
      ${deviceInfo.screenResolution}, ${deviceInfo.timezone},
      ${deviceInfo.language}, ${deviceInfo.platform}
    )
    ON CONFLICT (user_id, fingerprint_hash) 
    DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP
  `
}

/**
 * Get IP address from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}
