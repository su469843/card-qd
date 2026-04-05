/**
 * 错误日志服务
 * 用于记录、追踪和报告错误
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorLog {
  id: string
  timestamp: Date
  severity: ErrorSeverity
  code: string
  message: string
  context?: {
    userId?: string
    endpoint?: string
    method?: string
    userAgent?: string
    ip?: string
    [key: string]: any
  }
  stack?: string
  isDevelopment: boolean
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []
  private maxLogs = 1000

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * 记录错误
   */
  log(
    error: Error | string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ): ErrorLog {
    const errorLog: ErrorLog = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity,
      code,
      message: error instanceof Error ? error.message : error,
      context,
      stack: error instanceof Error ? error.stack : undefined,
      isDevelopment: process.env.NODE_ENV === 'development',
    }

    // 保存到内存
    this.logs.push(errorLog)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // 开发环境输出详细信息
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${code}] ${error instanceof Error ? error.message : error}`)
      if (error instanceof Error && error.stack) {
        console.error(error.stack)
      }
    }

    // 关键错误立即报告
    if (severity === ErrorSeverity.CRITICAL) {
      this.reportError(errorLog)
    }

    return errorLog
  }

  /**
   * 记录认证错误
   */
  logAuthError(
    error: Error | string,
    code: string,
    userId?: string
  ): ErrorLog {
    return this.log(error, code, ErrorSeverity.MEDIUM, {
      userId,
      type: 'authentication',
    })
  }

  /**
   * 记录数据库错误
   */
  logDatabaseError(error: Error | string, code: string): ErrorLog {
    return this.log(error, code, ErrorSeverity.HIGH, {
      type: 'database',
    })
  }

  /**
   * 记录API错误
   */
  logApiError(
    error: Error | string,
    code: string,
    endpoint: string,
    method: string,
    userId?: string
  ): ErrorLog {
    return this.log(error, code, ErrorSeverity.MEDIUM, {
      type: 'api',
      endpoint,
      method,
      userId,
    })
  }

  /**
   * 获取最近的错误日志
   */
  getRecentLogs(limit: number = 100): ErrorLog[] {
    return this.logs.slice(-limit).reverse()
  }

  /**
   * 按严重程度获取日志
   */
  getLogsBySeverity(severity: ErrorSeverity, limit: number = 50): ErrorLog[] {
    return this.logs
      .filter((log) => log.severity === severity)
      .slice(-limit)
      .reverse()
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * 获取错误统计
   */
  getStatistics(): {
    total: number
    bySeverity: Record<ErrorSeverity, number>
    byCode: Record<string, number>
  } {
    return {
      total: this.logs.length,
      bySeverity: {
        [ErrorSeverity.LOW]: this.logs.filter((l) => l.severity === ErrorSeverity.LOW)
          .length,
        [ErrorSeverity.MEDIUM]: this.logs.filter(
          (l) => l.severity === ErrorSeverity.MEDIUM
        ).length,
        [ErrorSeverity.HIGH]: this.logs.filter((l) => l.severity === ErrorSeverity.HIGH)
          .length,
        [ErrorSeverity.CRITICAL]: this.logs.filter(
          (l) => l.severity === ErrorSeverity.CRITICAL
        ).length,
      },
      byCode: this.logs.reduce(
        (acc, log) => {
          acc[log.code] = (acc[log.code] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }
  }

  /**
   * 报告错误到外部服务
   * 这里可以集成Sentry、LogRocket等服务
   */
  private reportError(errorLog: ErrorLog): void {
    // TODO: 集成错误报告服务
    console.error(
      '[Error Report]',
      `Critical error: ${errorLog.code} - ${errorLog.message}`
    )
  }
}

export const errorLogger = ErrorLogger.getInstance()
