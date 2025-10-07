import Link from "next/link"
import { sql } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { ConfirmPaymentForm } from "@/components/admin/confirm-payment-form"
import { OrdersList } from "@/components/admin/orders-list"

interface Order {
  id: number
  payment_code: string
  total_price: string
  status: string
  created_at: string
}

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  const orders = await sql<Order[]>`
    SELECT id, payment_code, total_price, status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 50
  `

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">订单管理</h1>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="bg-transparent">
              返回后台
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ConfirmPaymentForm />
          </div>

          <div className="lg:col-span-2">
            <OrdersList orders={orders} />
          </div>
        </div>
      </main>
    </div>
  )
}
