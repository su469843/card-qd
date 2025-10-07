"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, AlertTriangle } from "lucide-react"
import { Turnstile } from "@marsidev/react-turnstile"

interface AdminLoginProps {
  onLogin: (password: string) => void
}

const MAX_ATTEMPTS = 3
const FAILED_ATTEMPTS_KEY = "admin_failed_attempts"

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [requiresTurnstile, setRequiresTurnstile] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem(FAILED_ATTEMPTS_KEY)
    const attempts = stored ? Number.parseInt(stored, 10) : 0
    setFailedAttempts(attempts)
    setRequiresTurnstile(attempts >= MAX_ATTEMPTS)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      setError("请输入密码")
      return
    }

    if (requiresTurnstile && !turnstileToken) {
      setError("请完成安全验证")
      return
    }

    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

    if (password === correctPassword) {
      localStorage.removeItem(FAILED_ATTEMPTS_KEY)
      setFailedAttempts(0)
      onLogin(password)
    } else {
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      localStorage.setItem(FAILED_ATTEMPTS_KEY, newAttempts.toString())

      if (newAttempts >= MAX_ATTEMPTS) {
        setRequiresTurnstile(true)
        setError(`密码错误！已失败 ${newAttempts} 次，现在需要完成安全验证`)
        setTurnstileToken("") // 重置验证
      } else {
        setError(`密码错误！还剩 ${MAX_ATTEMPTS - newAttempts} 次尝试机会`)
      }
      setPassword("")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            {requiresTurnstile ? (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            ) : (
              <Lock className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">管理员登录</CardTitle>
          <CardDescription>
            {requiresTurnstile ? "多次登录失败，请完成安全验证" : "请输入管理员密码以继续"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="请输入管理员密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                autoFocus
              />
              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              {!requiresTurnstile && (
                <p className="text-xs text-muted-foreground">默认密码：admin123（可在环境变量中修改）</p>
              )}
              {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && (
                <p className="text-xs text-amber-600">
                  警告：已失败 {failedAttempts} 次，{MAX_ATTEMPTS - failedAttempts} 次后将启用安全验证
                </p>
              )}
            </div>

            {requiresTurnstile && (
              <div className="space-y-2">
                <Label>安全验证</Label>
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAB48K0IuWR_YyY9U"}
                    onSuccess={(token) => {
                      setTurnstileToken(token)
                      setError("")
                    }}
                    onError={() => {
                      setTurnstileToken("")
                      setError("验证失败，请重试")
                    }}
                    onExpire={() => {
                      setTurnstileToken("")
                      setError("验证已过期，请重新验证")
                    }}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={requiresTurnstile && !turnstileToken}>
              登录
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
