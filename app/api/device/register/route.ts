import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { generateFingerprint, registerDeviceFingerprint, type DeviceInfo } from '@/lib/device-fingerprint'

export async function POST(request: NextRequest) {
  try {
    const { userId, deviceInfo }: { userId: string; deviceInfo: DeviceInfo } = await request.json()

    if (!userId || !deviceInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[v0] Device registration request:', { userId })

    // Generate fingerprint
    const fingerprintHash = generateFingerprint(deviceInfo)

    // Check if device already exists
    const existing = await sql`
      SELECT id, is_trusted FROM device_fingerprints
      WHERE user_id = ${userId} AND fingerprint_hash = ${fingerprintHash}
    `

    if (existing.length > 0) {
      // Update last seen
      await sql`
        UPDATE device_fingerprints
        SET last_seen_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
      `

      return NextResponse.json({
        success: true,
        fingerprint: fingerprintHash,
        isNew: false,
        isTrusted: existing[0].is_trusted,
      })
    }

    // Register new device
    await registerDeviceFingerprint(sql, userId, fingerprintHash, deviceInfo)

    console.log('[v0] New device registered:', { userId, fingerprint: fingerprintHash.substring(0, 8) })

    return NextResponse.json({
      success: true,
      fingerprint: fingerprintHash,
      isNew: true,
      isTrusted: false,
    })
  } catch (error) {
    console.error('[v0] Device registration error:', error)
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const devices = await sql`
      SELECT id, fingerprint_hash, user_agent, platform, is_trusted,
             first_seen_at, last_seen_at
      FROM device_fingerprints
      WHERE user_id = ${userId}
      ORDER BY last_seen_at DESC
    `

    return NextResponse.json({ devices })
  } catch (error) {
    console.error('[v0] Device fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }
}
