"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { clearCart } from "@/lib/cart"

interface Order {
  id: number
  payment_code: string
  total_price: string
  status: string
}

export function PaymentDisplay({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (status === "paid") {
      clearCart()
      setIsChecking(false)
      return
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${order.id}/status`)
        const data = await response.json()

        if (data.status === "paid") {
          setStatus("paid")
          clearCart()
          setIsChecking(false)
        }
      } catch (error) {
        console.error("[v0] 检查订单状态错误:", error)
      }
    }

    const interval = setInterval(checkStatus, 2000)

    return () => clearInterval(interval)
  }, [order.id, status])

  const copyPaymentCode = () => {
    navigator.clipboard.writeText(order.payment_code)
    toast({
      title: "已复制",
      description: "付款码已复制到剪贴板",
    })
  }

  if (status === "paid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">付款成功！</h1>
            <p className="text-muted-foreground mb-6">您的订单已确认，感谢您的购买</p>
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full" size="lg">
                  返回首页
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">等待付款确认</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">请将以下付款码提供给商家</p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-4xl font-bold text-primary tracking-wider mb-4">{order.payment_code}</p>
              <Button variant="outline" size="sm" onClick={copyPaymentCode} className="gap-2 bg-transparent">
                <Copy className="h-4 w-4" />
                复制付款码
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">订单金额</span>
              <span className="text-2xl font-bold text-primary">
                ¥{Number.parseFloat(order.total_price).toFixed(2)}
              </span>
            </div>
          </div>

          {isChecking && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">等待商家确认付款...</span>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>商家确认付款后，页面将自动更新</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
