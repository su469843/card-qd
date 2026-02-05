"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getUserId } from "@/lib/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Gift, Loader2, CheckCircle, Sparkles, Wallet } from "lucide-react"

export default function RedeemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code") || ""
  const { user, isLoading: authLoading } = useAuth()

  const [code, setCode] = useState(codeFromUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; cardValue?: number; newBalance?: number } | null>(null)

  useEffect(() => {
    if (codeFromUrl) {
      setCode(codeFromUrl)
    }
  }, [codeFromUrl])

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const sessionToken = localStorage.getItem("sessionToken")
      const res = await fetch("/api/gift/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ code, userId: getUserId() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error })
      } else {
        setResult({
          success: true,
          message: data.message,
          cardValue: data.cardValue,
          newBalance: data.newBalance,
        })
      }
    } catch (error) {
      setResult({ success: false, message: "兑换失败，请重试" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
          
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">兑换礼品卡</CardTitle>
            <CardDescription>输入兑换码，将余额充值到您的账户</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!result?.success ? (
              <form onSubmit={handleRedeem} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="请输入兑换码（例如：XXXX-XXXX-XXXX-XXXX）"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="text-center text-lg tracking-wider font-mono h-14"
                    required
                  />
                </div>

                {result && !result.success && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                    {result.message}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || !code}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      兑换中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      立即兑换
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-300">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-green-500">兑换成功</p>
                  <p className="text-3xl font-bold">+¥{result.cardValue?.toFixed(2)}</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                  <p className="text-sm text-muted-foreground">当前余额</p>
                  <div className="flex items-center justify-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">¥{result.newBalance?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => {
                    setCode("")
                    setResult(null)
                  }}>
                    继续兑换
                  </Button>
                  <Button className="flex-1" onClick={() => router.push("/")}>
                    去购物
                  </Button>
                </div>
              </div>
            )}

            {!user && !authLoading && !result?.success && (
              <p className="text-center text-sm text-muted-foreground">
                <Link href={`/login?redirect=/redeem${code ? `?code=${code}` : ""}`} className="text-primary hover:underline">
                  登录账户
                </Link>
                {" "}可以在多设备间同步余额
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
