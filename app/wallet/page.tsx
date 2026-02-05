"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getUserId } from "@/lib/user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Gift, Loader2 } from "lucide-react"

interface Transaction {
  id: number
  type: string
  amount: string
  balance_before: string
  balance_after: string
  description: string
  created_at: string
}

export default function WalletPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const userId = getUserId()
      
      // 获取余额
      const balanceRes = await fetch(`/api/balance?userId=${userId}`)
      const balanceData = await balanceRes.json()
      setBalance(balanceData.balance || 0)

      // 获取交易记录
      const transRes = await fetch(`/api/balance/transactions?userId=${userId}`)
      const transData = await transRes.json()
      setTransactions(transData || [])
    } catch (error) {
      console.error("获取数据失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "recharge":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "consume":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      default:
        return <Gift className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "recharge":
        return "充值"
      case "consume":
        return "消费"
      case "refund":
        return "退款"
      default:
        return type
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

        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-6 text-white">
              <p className="text-sm opacity-80">账户余额</p>
              <p className="text-4xl font-bold">¥{balance.toFixed(2)}</p>
            </div>
            <Wallet className="absolute right-6 bottom-4 h-16 w-16 text-white/20" />
          </div>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Link href="/redeem" className="flex-1">
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <Gift className="h-4 w-4" />
                  兑换礼品卡
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full gap-2">
                  <Wallet className="h-4 w-4" />
                  购买消费卡
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>交易记录</CardTitle>
            <CardDescription>您的余额变动历史</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>暂无交易记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((trans) => (
                  <div
                    key={trans.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                        {getTypeIcon(trans.type)}
                      </div>
                      <div>
                        <p className="font-medium">{trans.description || getTypeLabel(trans.type)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(trans.created_at).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${trans.type === "consume" ? "text-red-500" : "text-green-500"}`}>
                        {trans.type === "consume" ? "-" : "+"}¥{Number.parseFloat(trans.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        余额: ¥{Number.parseFloat(trans.balance_after).toFixed(2)}
                      </p>
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
