import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { validateAddress, normalizeAddress } from '@/lib/address-validation'
import { AuthError, getErrorResponse } from '@/lib/auth-errors'

/**
 * GET /api/addresses
 * 获取当前用户的所有地址
 */
export async function GET(request: NextRequest) {
  try {
    // 获取用户ID（从session或auth header）
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return getErrorResponse(
        new AuthError('UNAUTHORIZED', '未授权的请求'),
        401
      )
    }

    const addresses = await sql`
      SELECT 
        id,
        label,
        recipient_name as "recipientName",
        phone,
        country,
        province,
        city,
        district,
        address_line1 as "addressLine1",
        address_line2 as "addressLine2",
        postal_code as "postalCode",
        is_default as "isDefault",
        created_at as "createdAt"
      FROM user_addresses
      WHERE user_id = ${userId}
      ORDER BY is_default DESC, created_at DESC
    `

    return NextResponse.json(
      {
        success: true,
        data: addresses,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Addresses] 获取地址列表失败:', error)
    return getErrorResponse(
      new AuthError('SERVER_ERROR', '获取地址列表失败'),
      500
    )
  }
}

/**
 * POST /api/addresses
 * 创建新地址
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return getErrorResponse(
        new AuthError('UNAUTHORIZED', '未授权的请求'),
        401
      )
    }

    const body = await request.json()

    // 验证地址数据
    const errors = validateAddress(body)
    if (errors.length > 0) {
      return getErrorResponse(
        new AuthError('INVALID_ADDRESS', '地址信息不完整或格式有误', { errors }),
        400
      )
    }

    const address = normalizeAddress(body)

    // 如果这是默认地址，取消其他默认地址的标记
    if (body.isDefault) {
      await sql`
        UPDATE user_addresses
        SET is_default = false
        WHERE user_id = ${userId}
      `
    }

    const result = await sql`
      INSERT INTO user_addresses (
        user_id,
        label,
        recipient_name,
        phone,
        country,
        province,
        city,
        district,
        address_line1,
        address_line2,
        postal_code,
        is_default,
        created_at
      )
      VALUES (
        ${userId},
        ${address.label},
        ${address.recipientName},
        ${address.phone},
        ${address.country},
        ${address.province},
        ${address.city},
        ${address.district},
        ${address.addressLine1},
        ${address.addressLine2 || null},
        ${address.postalCode},
        ${body.isDefault || false},
        NOW()
      )
      RETURNING id, created_at as "createdAt"
    `

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result[0].id,
          ...address,
          createdAt: result[0].createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Addresses] 创建地址失败:', error)
    return getErrorResponse(
      new AuthError('SERVER_ERROR', '创建地址失败'),
      500
    )
  }
}

/**
 * PUT /api/addresses/[id]
 * 更新地址
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return getErrorResponse(
        new AuthError('UNAUTHORIZED', '未授权的请求'),
        401
      )
    }

    const url = new URL(request.url)
    const addressId = url.pathname.split('/').pop()

    const body = await request.json()

    // 验证地址数据
    const errors = validateAddress(body)
    if (errors.length > 0) {
      return getErrorResponse(
        new AuthError('INVALID_ADDRESS', '地址信息不完整或格式有误', { errors }),
        400
      )
    }

    const address = normalizeAddress(body)

    // 检查地址是否存在且属于该用户
    const existingAddress = await sql`
      SELECT id FROM user_addresses
      WHERE id = ${addressId} AND user_id = ${userId}
    `

    if (existingAddress.length === 0) {
      return getErrorResponse(
        new AuthError('ADDRESS_NOT_FOUND', '地址不存在'),
        404
      )
    }

    // 如果设为默认地址，取消其他默认地址
    if (body.isDefault) {
      await sql`
        UPDATE user_addresses
        SET is_default = false
        WHERE user_id = ${userId} AND id != ${addressId}
      `
    }

    await sql`
      UPDATE user_addresses
      SET
        label = ${address.label},
        recipient_name = ${address.recipientName},
        phone = ${address.phone},
        country = ${address.country},
        province = ${address.province},
        city = ${address.city},
        district = ${address.district},
        address_line1 = ${address.addressLine1},
        address_line2 = ${address.addressLine2 || null},
        postal_code = ${address.postalCode},
        is_default = ${body.isDefault || false}
      WHERE id = ${addressId}
    `

    return NextResponse.json(
      {
        success: true,
        message: '地址已更新',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Addresses] 更新地址失败:', error)
    return getErrorResponse(
      new AuthError('SERVER_ERROR', '更新地址失败'),
      500
    )
  }
}

/**
 * DELETE /api/addresses/[id]
 * 删除地址
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return getErrorResponse(
        new AuthError('UNAUTHORIZED', '未授权的请求'),
        401
      )
    }

    const url = new URL(request.url)
    const addressId = url.pathname.split('/').pop()

    // 检查地址是否存在且属于该用户
    const existingAddress = await sql`
      SELECT id FROM user_addresses
      WHERE id = ${addressId} AND user_id = ${userId}
    `

    if (existingAddress.length === 0) {
      return getErrorResponse(
        new AuthError('ADDRESS_NOT_FOUND', '地址不存在'),
        404
      )
    }

    await sql`
      DELETE FROM user_addresses
      WHERE id = ${addressId}
    `

    return NextResponse.json(
      {
        success: true,
        message: '地址已删除',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Addresses] 删除地址失败:', error)
    return getErrorResponse(
      new AuthError('SERVER_ERROR', '删除地址失败'),
      500
    )
  }
}
