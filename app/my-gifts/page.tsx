"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Gift, Loader2, Copy, Check, ExternalLink } from "lucide-react"

interface GiftCode {
  id: number
  code: string
  card_value: string
  status: string
  is_gift: boolean
  created_at: string
  redeemed_at: string | null
}

export default function MyGiftsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [codes, setCodes] = useState<GiftCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [newCode, setNewCode] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/my-gifts")
      return
    }
    if (user) {
      fetchCodes()
      
      // 检查是否有新创建的兑换码
      const urlParams = new URLSearchParams(window.location.search)
      const newCodeParam = urlParams.get('new')
      if (newCodeParam) {
        setNewCode(newCodeParam)
        // 自动复制到剪贴板
        navigator.clipboard.writeText(newCodeParam).catch(console.error)
      }
    }
  }, [user, authLoading, router])

  const fetchCodes = async () => {
    try {
      const token = localStorage.getItem("sessionToken")
      const res = await fetch("/api/gift/my-codes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setCodes(data)
      }
    } catch (error) {
      console.error("获取礼品卡失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyCode = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">可用</span>
      case "redeemed":
        return <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">已兑换</span>
      case "expired":
        return <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500">已过期</span>
      default:
        return null
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              我的礼品卡
            </CardTitle>
            <CardDescription>您购买并赠送的礼品卡</CardDescription>
          </CardHeader>
          <CardContent>
            {codes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">您还没有购买过礼品卡</p>
                <Link href="/">
                  <Button>去购买</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {newCode && (
                  <div className="p-4 rounded-xl border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-primary">新创建的礼品卡</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background font-mono text-lg font-bold">
                      <span className="flex-1">{newCode}</span>
                      <button
                        onClick={() => copyCode(newCode, -1)}
                        className="p-2 rounded hover:bg-muted transition-colors"
                      >
                        {copiedId === -1 ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      兑换码已自动复制到剪贴板，请妥善保管并分享给收件人
                    </p>
                  </div>
                )}
                
                {codes.map((code) => (
                  <div
                    key={code.id}
                    className="p-4 rounded-xl border border-border bg-gradient-to-r from-purple-500/5 to-pink-500/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">¥{Number.parseFloat(code.card_value).toFixed(0)}</span>
                        {getStatusBadge(code.status)}
                      </div>
                      {code.is_gift && (
                        <span className="text-xs text-muted-foreground">赠送礼品</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 font-mono text-sm">
                      <span className="flex-1 truncate">{code.code}</span>
                      {code.status === "active" && (
                        <button
                          onClick={() => copyCode(code.code, code.id)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          {copiedId === code.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>创建于 {new Date(code.created_at).toLocaleDateString("zh-CN")}</span>
                      {code.status === "active" && code.is_gift && (
                        <Link
                          href={`/redeem?code=${code.code}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          分享链接
                        </Link>
                      )}
                      {code.redeemed_at && (
                        <span>已于 {new Date(code.redeemed_at).toLocaleDateString("zh-CN")} 兑换</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
