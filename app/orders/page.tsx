"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { getUserId } from "@/lib/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface OrderItem {
  product_id: number
  quantity: number
  price: number
  name: string
  image_url: string | null
}

interface Order {
  id: number
  payment_code: string
  total_price: number
  final_price: number
  discount_amount: number
  status: string
  created_at: string
  card_codes?: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get("success") === "true"

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log("[v0] 订单页面: 开始获取订单")
        const userId = getUserId()
        console.log("[v0] 订单页面: 用户ID =", userId)

        const response = await fetch("/api/orders/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })

        console.log("[v0] 订单页面: API 响应状态 =", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] 订单页面: API 错误响应 =", errorText)
          throw new Error("获取订单失败")
        }

        const data = await response.json()
        console.log("[v0] 订单页面: 获取到的订单数据 =", data)
        setOrders(data.orders)
      } catch (error) {
        console.error("[v0] 订单页面: 获取订单错误 =", error)
        console.error("[v0] 订单页面: 错误详情 =", error instanceof Error ? error.message : String(error))
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "待支付"
      case "paid":
        return "已支付"
      case "cancelled":
        return "已取消"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "pending":
        return "secondary"
      case "paid":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">我的订单</h1>

        {showSuccess && (
          <Alert className="mb-6 border-green-600 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">订单创建成功！您的订单已完成。</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">暂无订单</p>
            <Link href="/">
              <Button>去购物</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">订单号: {order.payment_code}</CardTitle>
                    <Badge variant={getStatusVariant(order.status)}>{getStatusText(order.status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    下单时间: {new Date(order.created_at).toLocaleString("zh-CN")}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image_url || "/placeholder.svg?height=80&width=80&query=product"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{item.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">数量: {item.quantity}</p>
                          <p className="text-sm text-primary font-semibold mt-1">¥{item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>原价:</span>
                        <span>¥{order.total_price.toFixed(2)}</span>
                      </div>
                      {order.discount_amount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>优惠:</span>
                          <span>-¥{order.discount_amount.toFixed(2)}</span>
                        </div>
                      )}
                      {order.status === "paid" && order.card_codes && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-foreground mb-2">兑换码:</h4>
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-mono break-all">{order.card_codes}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              请妥善保管您的兑换码，每个兑换码只能使用一次
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-lg font-semibold text-foreground">实付金额:</span>
                        <span className="text-2xl font-bold text-primary">¥{order.final_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
