import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyOrderAccess, logOrderAccess, getClientIp } from '@/lib/order-security'

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId, deviceFingerprint } = await request.json()

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[v0] Order verification request:', { orderId, userId })

    // Verify order access
    const verification = await verifyOrderAccess(orderId, userId, deviceFingerprint)

    // Log the access attempt
    await logOrderAccess({
      orderId,
      userId,
      deviceFingerprint,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      accessType: 'view',
    })

    if (!verification.authorized) {
      console.log('[v0] Unauthorized order access attempt:', {
        orderId,
        userId,
        reason: verification.reason,
      })

      return NextResponse.json(
        {
          authorized: false,
          suspicious: verification.suspicious,
          reason: verification.reason,
        },
        { status: 403 }
      )
    }

    if (verification.suspicious) {
      console.log('[v0] Suspicious order access:', {
        orderId,
        userId,
        reason: verification.reason,
      })
    }

    return NextResponse.json({
      authorized: true,
      suspicious: verification.suspicious,
      reason: verification.reason,
    })
  } catch (error) {
    console.error('[v0] Order verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
