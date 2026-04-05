import { NextResponse } from 'next/server'

/**
 * 标准API错误响应格式
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

/**
 * API错误处理装饰器
 * 包装异步API路由处理器，统一处理错误
 */
export function apiErrorHandler<
  T extends (...args: any[]) => Promise<NextResponse | Response>
>(handler: T): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('[API Error]', error)

      // 验证错误
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_JSON',
              message: '请求格式无效，请检查JSON数据',
            },
          },
          { status: 400 }
        )
      }

      // 未知错误
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '服务器内部错误，请稍后重试',
            details:
              process.env.NODE_ENV === 'development'
                ? (error as Error).message
                : undefined,
          },
        },
        { status: 500 }
      )
    }
  }) as T
}

/**
 * 数据库错误处理
 */
export function handleDatabaseError(error: unknown): { code: string; message: string } {
  const err = error as any

  if (!err) {
    return {
      code: 'DATABASE_ERROR',
      message: '数据库错误，请稍后重试',
    }
  }

  // 唯一性约束违反
  if (err.code === '23505' || err.message?.includes('unique')) {
    return {
      code: 'DUPLICATE_ENTRY',
      message: '该数据已存在',
    }
  }

  // 外键约束违反
  if (err.code === '23503' || err.message?.includes('foreign key')) {
    return {
      code: 'FOREIGN_KEY_ERROR',
      message: '引用的数据不存在',
    }
  }

  // 连接错误
  if (err.code === 'ECONNREFUSED' || err.message?.includes('connect')) {
    return {
      code: 'DATABASE_CONNECTION_ERROR',
      message: '无法连接到数据库，请稍后重试',
    }
  }

  // 超时错误
  if (err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
    return {
      code: 'DATABASE_TIMEOUT',
      message: '数据库操作超时，请稍后重试',
    }
  }

  console.error('[Database Error Details]', err)

  return {
    code: 'DATABASE_ERROR',
    message: '数据库操作失败，请稍后重试',
  }
}

/**
 * 验证错误
 */
export interface ValidationError {
  field: string
  message: string
  code: string
}

export function createValidationErrorResponse(
  errors: ValidationError[]
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: '数据验证失败',
      details: {
        errors,
      },
    },
  }
}

/**
 * 认证错误
 */
export function createAuthErrorResponse(message: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: 'AUTHENTICATION_ERROR',
      message,
    },
  }
}

/**
 * 授权错误
 */
export function createAuthorizationErrorResponse(message: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: 'AUTHORIZATION_ERROR',
      message,
    },
  }
}

/**
 * 资源不存在错误
 */
export function createNotFoundErrorResponse(resource: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `${resource}不存在`,
    },
  }
}
