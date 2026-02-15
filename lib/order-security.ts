import crypto from 'crypto'
import { sql } from './db'

export interface OrderAccessAttempt {
  orderId: string
  userId: string
  deviceFingerprint?: string
  ip: string
  userAgent: string
  accessType: 'view' | 'payment' | 'update'
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

/**
 * Generate a secure verification token for an order
 */
export function generateOrderVerificationToken(orderId: string, userId: string): string {
  const data = `${orderId}:${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Verify if a user has authorized access to an order
 */
export async function verifyOrderAccess(
  orderId: string,
  userId: string,
  deviceFingerprint?: string
): Promise<{ authorized: boolean; suspicious: boolean; reason?: string }> {
  try {
    // Get order details
    const orders = await sql`
      SELECT user_id, device_fingerprint, created_at 
      FROM orders 
      WHERE order_id = ${orderId}
    `

    if (orders.length === 0) {
      return {
        authorized: false,
        suspicious: true,
        reason: 'Order not found',
      }
    }

    const order = orders[0]

    // Check if user owns the order
    if (order.user_id !== userId) {
      return {
        authorized: false,
        suspicious: true,
        reason: 'User does not own this order',
      }
    }

    // Check device fingerprint if available
    if (order.device_fingerprint && deviceFingerprint) {
      if (order.device_fingerprint !== deviceFingerprint) {
        // Different device - might be suspicious but allow with warning
        return {
          authorized: true,
          suspicious: true,
          reason: 'Different device than order creation',
        }
      }
    }

    return {
      authorized: true,
      suspicious: false,
    }
  } catch (error) {
    console.error('[v0] Order access verification error:', error)
    return {
      authorized: false,
      suspicious: true,
      reason: 'Verification failed',
    }
  }
}

/**
 * Log order access attempt for audit purposes
 */
export async function logOrderAccess(attempt: OrderAccessAttempt): Promise<void> {
  try {
    const verification = await verifyOrderAccess(
      attempt.orderId,
      attempt.userId,
      attempt.deviceFingerprint
    )

    await sql`
      INSERT INTO order_security_audit (
        order_id, user_id, device_fingerprint, access_ip,
        access_user_agent, access_type, is_authorized, 
        suspicious_activity, audit_notes
      ) VALUES (
        ${attempt.orderId}, ${attempt.userId}, ${attempt.deviceFingerprint || null},
        ${attempt.ip}, ${attempt.userAgent}, ${attempt.accessType},
        ${verification.authorized}, ${verification.suspicious},
        ${verification.reason || null}
      )
    `

    console.log('[v0] Order access logged:', {
      orderId: attempt.orderId,
      userId: attempt.userId,
      authorized: verification.authorized,
      suspicious: verification.suspicious,
    })
  } catch (error) {
    console.error('[v0] Failed to log order access:', error)
  }
}

/**
 * Detect potential order manipulation attempts
 */
export async function detectOrderManipulation(
  userId: string,
  requestedOrderIds: string[]
): Promise<string[]> {
  try {
    // Get all orders owned by this user
    const userOrders = await sql`
      SELECT order_id FROM orders WHERE user_id = ${userId}
    `

    const ownedOrderIds = new Set(userOrders.map((o: any) => o.order_id))
    
    // Find orders that don't belong to the user
    const suspiciousOrders = requestedOrderIds.filter(
      (orderId) => !ownedOrderIds.has(orderId)
    )

    if (suspiciousOrders.length > 0) {
      console.log('[v0] Potential order manipulation detected:', {
        userId,
        suspiciousOrders,
      })

      // Log suspicious activity
      for (const orderId of suspiciousOrders) {
        await sql`
          INSERT INTO order_security_audit (
            order_id, user_id, access_type, is_authorized,
            suspicious_activity, audit_notes
          ) VALUES (
            ${orderId}, ${userId}, 'view', false, true,
            'Attempted to access order not owned by user'
          )
        `
      }
    }

    return suspiciousOrders
  } catch (error) {
    console.error('[v0] Order manipulation detection error:', error)
    return []
  }
}

/**
 * Get suspicious activity report for admin review
 */
export async function getSuspiciousActivityReport(limit: number = 100) {
  try {
    const activities = await sql`
      SELECT 
        osa.*,
        o.total_amount,
        o.status as order_status,
        u.email as user_email
      FROM order_security_audit osa
      LEFT JOIN orders o ON osa.order_id = o.order_id
      LEFT JOIN users u ON osa.user_id = u.id
      WHERE osa.suspicious_activity = true
      ORDER BY osa.created_at DESC
      LIMIT ${limit}
    `

    return activities
  } catch (error) {
    console.error('[v0] Failed to get suspicious activity report:', error)
    return []
  }
}
