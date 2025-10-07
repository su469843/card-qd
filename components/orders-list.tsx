"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: number
  payment_code: string
  total_price: string
  status: string
  created_at: string
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: string
  product_name: string
  product_image_url: string | null
}

export function OrdersList({ orders, orderItems }: { orders: Order[]; orderItems: OrderItem[] }) {
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">暂无订单</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const items = orderItems.filter((item) => item.order_id === order.id)

        return (
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
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product_image_url || "/placeholder.svg?height=80&width=80&query=product"}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{item.product_name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">数量: {item.quantity}</p>
                      <p className="text-sm text-primary font-semibold mt-1">
                        ¥{Number.parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">订单总额:</span>
                  <span className="text-2xl font-bold text-primary">
                    ¥{Number.parseFloat(order.total_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
