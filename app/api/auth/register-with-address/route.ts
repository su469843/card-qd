import { NextRequest, NextResponse } from 'next/server'
import * as bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { validateEmail, validatePassword, validateUsername } from '@/lib/auth-validation'
import { validateAddress, normalizeAddress, AddressValidationError } from '@/lib/address-validation'
import { AuthError, getErrorResponse } from '@/lib/auth-errors'
import crypto from 'crypto'

interface RegisterWithAddressRequest {
  email: string
  password: string
  username: string
  phone?: string
  address?: {
    recipientName: string
    phone: string
    country: string
    province: string
    city: string
    district: string
    addressLine1: string
    addressLine2?: string
    postalCode: string
  }
}

/**
 * POST /api/auth/register-with-address
 * 用户注册（包含地址信息）
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegisterWithAddressRequest = await request.json()

    // 1. 验证基本信息
    const emailValidation = validateEmail(body.email)
    if (!emailValidation.valid) {
      return getErrorResponse(
        new AuthError('INVALID_EMAIL', emailValidation.error || '邮箱格式无效'),
        400
      )
    }

    const usernameValidation = validateUsername(body.username)
    if (!usernameValidation.valid) {
      return getErrorResponse(
        new AuthError('INVALID_USERNAME', usernameValidation.error || '用户名格式无效'),
        400
      )
    }

    const passwordValidation = validatePassword(body.password)
    if (!passwordValidation.valid) {
      return getErrorResponse(
        new AuthError('WEAK_PASSWORD', passwordValidation.error || '密码强度不足'),
        400
      )
    }

    // 2. 验证地址信息（如果提供）
    let addressErrors: AddressValidationError[] = []
    let normalizedAddress = null

    if (body.address) {
      addressErrors = validateAddress(body.address)
      if (addressErrors.length > 0) {
        return getErrorResponse(
          new AuthError('INVALID_ADDRESS', '地址信息不完整或格式有误', { errors: addressErrors }),
          400
        )
      }
      normalizedAddress = normalizeAddress(body.address)
    }

    // 3. 检查邮箱是否已存在
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${body.email.toLowerCase()}
    `

    if (existingUser.length > 0) {
      return getErrorResponse(
        new AuthError('EMAIL_EXISTS', '该邮箱已被注册'),
        400
      )
    }

    // 4. 检查用户名是否已存在
    const existingUsername = await sql`
      SELECT id FROM users WHERE username = ${body.username}
    `

    if (existingUsername.length > 0) {
      return getErrorResponse(
        new AuthError('USERNAME_EXISTS', '该用户名已被注册'),
        400
      )
    }

    // 5. 加密密码
    const hashedPassword = await bcrypt.hash(body.password, 12)

    // 6. 创建用户和地址（事务）
    try {
      // 插入用户
      const userResult = await sql`
        INSERT INTO users (email, password_hash, username, phone, status, created_at, updated_at)
        VALUES (
          ${body.email.toLowerCase()},
          ${hashedPassword},
          ${body.username},
          ${body.phone || null},
          'active',
          NOW(),
          NOW()
        )
        RETURNING id, email, username
      `

      const userId = userResult[0].id

      // 插入地址（如果有）
      if (normalizedAddress) {
        await sql`
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
            ${normalizedAddress.label},
            ${normalizedAddress.recipientName},
            ${normalizedAddress.phone},
            ${normalizedAddress.country},
            ${normalizedAddress.province},
            ${normalizedAddress.city},
            ${normalizedAddress.district},
            ${normalizedAddress.addressLine1},
            ${normalizedAddress.addressLine2 || null},
            ${normalizedAddress.postalCode},
            true,
            NOW()
          )
        `
      }

      // 7. 创建会话
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天

      await sql`
        INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
        VALUES (${userId}, ${sessionToken}, ${expiresAt}, NOW())
      `

      return NextResponse.json(
        {
          success: true,
          data: {
            user: {
              id: userId,
              email: userResult[0].email,
              username: userResult[0].username,
            },
            sessionToken,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('[Auth] 注册失败:', error)
      return getErrorResponse(
        new AuthError('REGISTRATION_FAILED', '注册过程中出现错误，请稍后重试'),
        500
      )
    }
  } catch (error) {
    console.error('[Auth] 请求处理失败:', error)

    if (error instanceof SyntaxError) {
      return getErrorResponse(
        new AuthError('INVALID_REQUEST', '请求格式无效'),
        400
      )
    }

    return getErrorResponse(
      new AuthError('SERVER_ERROR', '服务器错误，请稍后重试'),
      500
    )
  }
}
