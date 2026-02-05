"use client"

import { useEffect, useState } from "react"
import { Wallet, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getUserId } from "@/lib/user"

export function BalanceDisplay() {
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const userId = getUserId()
      const response = await fetch(`/api/balance?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 1000)
      }
    } catch (error) {
      console.error("获取余额失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border-purple-500/20 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-md opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">账户余额</p>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="h-8 w-24 bg-muted/50 animate-pulse rounded" />
                ) : (
                  <>
                    <span
                      className={`text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent transition-all duration-500 ${
                        isAnimating ? "scale-110" : "scale-100"
                      }`}
                    >
                      ¥{balance.toFixed(2)}
                    </span>
                    {isAnimating && (
                      <TrendingUp className="h-5 w-5 text-green-500 animate-bounce" />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
