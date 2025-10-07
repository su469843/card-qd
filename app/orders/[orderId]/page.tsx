"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  image_url: string | null
}

interface OrderDetail {
  id: number
  payment_code: string
  status: string
  created_at: string
  total_price: number
  final_price: number
  discount_amount: number
  card_codes?: string
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.orderId
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "获取订单详情失败")
        }
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取订单详情失败")
      } finally {
        setIsLoading(false)
      }
    }
    if (orderId) fetchOrder()
  }, [orderId])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">加载中...</div>
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-destructive mb-4">{error || "订单不存在"}</p>
        <Link href="/orders">
          <Button>返回订单列表</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/orders">
            <Button variant="ghost" size="sm">返回订单列表</Button>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>订单号: {order.payment_code}</CardTitle>
            <Badge variant={order.status === "paid" ? "default" : "secondary"}>{order.status === "paid" ? "已支付" : "待支付"}</Badge>
            <p className="text-sm text-muted-foreground mt-2">下单时间: {new Date(order.created_at).toLocaleString("zh-CN")}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={item.image_url || "/placeholder.svg?height=80&width=80&query=product"} alt={item.name} fill className="object-cover" />
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
                  <span>¥{Number(order.total_price).toFixed(2)}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>优惠:</span>
                    <span>-¥{Number(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-semibold text-foreground">实付金额:</span>
                  <span className="text-2xl font-bold text-primary">¥{Number(order.final_price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
