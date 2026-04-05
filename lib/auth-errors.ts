/**
 * 认证系统错误处理
 * 定义所有认证相关的错误类型和处理函数
 */

// 错误代码枚举
export const AuthErrorCodes = {
  // 输入验证错误 (400)
  INVALID_EMAIL: 'INVALID_EMAIL',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_PHONE: 'INVALID_PHONE',
  INCOMPLETE_ADDRESS: 'INCOMPLETE_ADDRESS',
  PASSWORDS_NOT_MATCH: 'PASSWORDS_NOT_MATCH',
  
  // 业务逻辑错误 (400/401/403)
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // 服务器错误 (500)
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
  SESSION_CREATE_ERROR: 'SESSION_CREATE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type AuthErrorCode = typeof AuthErrorCodes[keyof typeof AuthErrorCodes]

// 错误消息映射（中文）
export const AuthErrorMessages: Record<AuthErrorCode, string> = {
  [AuthErrorCodes.INVALID_EMAIL]: '请输入有效的邮箱地址',
  [AuthErrorCodes.WEAK_PASSWORD]: '密码需至少8位，包含大小写字母和数字',
  [AuthErrorCodes.MISSING_FIELD]: '请填写所有必填项',
  [AuthErrorCodes.INVALID_PHONE]: '请输入有效的手机号码',
  [AuthErrorCodes.INCOMPLETE_ADDRESS]: '请完善地址信息',
  [AuthErrorCodes.PASSWORDS_NOT_MATCH]: '两次输入的密码不一致',
  
  [AuthErrorCodes.EMAIL_EXISTS]: '该邮箱已被注册，请直接登录',
  [AuthErrorCodes.INVALID_CREDENTIALS]: '邮箱或密码错误',
  [AuthErrorCodes.SESSION_EXPIRED]: '登录已过期，请重新登录',
  [AuthErrorCodes.ACCOUNT_LOCKED]: '账户已被锁定，请15分钟后重试或联系客服',
  [AuthErrorCodes.ACCOUNT_SUSPENDED]: '账户已被暂停，请联系客服',
  [AuthErrorCodes.PERMISSION_DENIED]: '您没有权限执行此操作',
  [AuthErrorCodes.USER_NOT_FOUND]: '用户不存在',
  
  [AuthErrorCodes.DB_CONNECTION_ERROR]: '服务暂时不可用，请稍后重试',
  [AuthErrorCodes.ENCRYPTION_ERROR]: '系统错误，请稍后重试',
  [AuthErrorCodes.SESSION_CREATE_ERROR]: '登录失败，请稍后重试',
  [AuthErrorCodes.UNKNOWN_ERROR]: '未知错误，请稍后重试',
}

// 错误HTTP状态码映射
export const AuthErrorStatus: Record<AuthErrorCode, number> = {
  [AuthErrorCodes.INVALID_EMAIL]: 400,
  [AuthErrorCodes.WEAK_PASSWORD]: 400,
  [AuthErrorCodes.MISSING_FIELD]: 400,
  [AuthErrorCodes.INVALID_PHONE]: 400,
  [AuthErrorCodes.INCOMPLETE_ADDRESS]: 400,
  [AuthErrorCodes.PASSWORDS_NOT_MATCH]: 400,
  
  [AuthErrorCodes.EMAIL_EXISTS]: 400,
  [AuthErrorCodes.INVALID_CREDENTIALS]: 401,
  [AuthErrorCodes.SESSION_EXPIRED]: 401,
  [AuthErrorCodes.ACCOUNT_LOCKED]: 403,
  [AuthErrorCodes.ACCOUNT_SUSPENDED]: 403,
  [AuthErrorCodes.PERMISSION_DENIED]: 403,
  [AuthErrorCodes.USER_NOT_FOUND]: 404,
  
  [AuthErrorCodes.DB_CONNECTION_ERROR]: 500,
  [AuthErrorCodes.ENCRYPTION_ERROR]: 500,
  [AuthErrorCodes.SESSION_CREATE_ERROR]: 500,
  [AuthErrorCodes.UNKNOWN_ERROR]: 500,
}

// 自定义认证错误类
export class AuthError extends Error {
  code: AuthErrorCode
  statusCode: number
  
  constructor(code: AuthErrorCode, customMessage?: string) {
    super(customMessage || AuthErrorMessages[code])
    this.code = code
    this.statusCode = AuthErrorStatus[code]
    this.name = 'AuthError'
  }
  
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      }
    }
  }
}

// 验证函数
export const Validators = {
  // 邮箱验证
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  // 密码强度验证（至少8位，包含大小写字母和数字）
  isStrongPassword(password: string): boolean {
    if (password.length < 8) return false
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    return hasUppercase && hasLowercase && hasNumber
  },
  
  // 手机号验证（中国手机号）
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  },
  
  // 验证必填字段
  hasRequiredFields(obj: Record<string, unknown>, fields: string[]): string[] {
    const missing: string[] = []
    for (const field of fields) {
      if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
        missing.push(field)
      }
    }
    return missing
  },
}

// 密码强度检查（返回详细信息）
export function checkPasswordStrength(password: string): {
  score: number // 0-4
  feedback: string[]
  isValid: boolean
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) {
    score++
  } else {
    feedback.push('密码至少需要8个字符')
  }
  
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('需要包含大写字母')
  }
  
  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('需要包含小写字母')
  }
  
  if (/[0-9]/.test(password)) {
    score++
  } else {
    feedback.push('需要包含数字')
  }
  
  return {
    score,
    feedback,
    isValid: score >= 4,
  }
}

// 登录尝试限制配置
export const LOGIN_ATTEMPT_CONFIG = {
  maxAttempts: 5,
  lockDurationMinutes: 15,
}

/**
 * 生成错误响应
 */
export function getErrorResponse(
  error: AuthError | Error,
  statusCode?: number
): Response {
  const { NextResponse } = require('next/server')
  
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    )
  }
  
  // 处理其他错误类型
  const code = (error as any)?.code || 'UNKNOWN_ERROR'
  const message = error.message || '发生了一个错误'
  const status = statusCode || 500
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  )
}
