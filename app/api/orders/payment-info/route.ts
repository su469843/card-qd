import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { logOrderAccess, getClientIp } from '@/lib/order-security'

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId, paymentInfo, deviceFingerprint } = await request.json()

    if (!orderId || !userId || !paymentInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[v0] Payment info submission:', { orderId, userId })

    // Verify order ownership
    const orders = await sql`
      SELECT user_id FROM orders WHERE order_id = ${orderId}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (orders[0].user_id !== userId) {
      console.log('[v0] Unauthorized payment info access:', { orderId, userId })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update order with payment info
    await sql`
      UPDATE orders
      SET 
        payment_additional_info = ${JSON.stringify(paymentInfo)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ${orderId}
    `

    // Log the payment info submission
    await logOrderAccess({
      orderId,
      userId,
      deviceFingerprint,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      accessType: 'payment',
    })

    console.log('[v0] Payment info saved successfully:', { orderId })

    return NextResponse.json({
      success: true,
      message: 'Payment information saved successfully',
    })
  } catch (error) {
    console.error('[v0] Payment info error:', error)
    return NextResponse.json({ error: 'Failed to save payment information' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Verify order ownership
    const orders = await sql`
      SELECT user_id, payment_additional_info 
      FROM orders 
      WHERE order_id = ${orderId}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (orders[0].user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      paymentInfo: orders[0].payment_additional_info || {},
    })
  } catch (error) {
    console.error('[v0] Payment info fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment information' }, { status: 500 })
  }
}
