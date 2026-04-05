'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 记录错误详情
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-8 text-center space-y-6">
          {/* 错误图标 */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-red-500/10">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>

          {/* 错误信息 */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">出错了</h1>
            <p className="text-muted-foreground">
              页面加载时遇到了问题。我们已经记录了这个错误。
            </p>
          </div>

          {/* 错误详情 (仅开发环境) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 max-h-32 overflow-auto">
              <p className="text-xs font-mono text-slate-400 text-left break-words">
                {error.message}
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3 pt-4">
            <Button onClick={reset} className="w-full" size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>

            <Link href="/" className="block">
              <Button variant="outline" className="w-full" size="lg">
                <Home className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </Link>
          </div>

          {/* 支持信息 */}
          <p className="text-xs text-muted-foreground">
            如果问题继续出现，请{' '}
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              联系客服
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
