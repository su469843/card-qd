"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Order {
  id: number
  payment_code: string
  total_price: string
  status: string
  created_at: string
}

export function OrdersList({ orders }: { orders: Order[] }) {
  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return <Badge className="bg-green-500 hover:bg-green-600">已付款</Badge>
    }
    return <Badge variant="secondary">待付款</Badge>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">暂无订单</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>订单列表</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold text-lg">{order.payment_code}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>订单 #{order.id}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">¥{Number.parseFloat(order.total_price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
