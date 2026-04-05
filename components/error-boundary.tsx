'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // 记录错误到日志服务
    console.error('[ErrorBoundary] 捕获到错误:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">出现错误</h1>
            <p className="text-muted-foreground">
              应用程序遇到了一个意外错误，我们已经记录了此问题。
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 max-h-32 overflow-auto">
            <p className="text-xs font-mono text-muted-foreground text-left break-words">
              {error.message || '未知错误'}
            </p>
          </div>

          <Button onClick={reset} className="w-full" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>

          <p className="text-xs text-muted-foreground">
            如果问题持续，请{' '}
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              联系支持
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
