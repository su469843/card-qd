import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { PaymentDisplay } from "@/components/payment-display"
import type { Order } from "@/types"

export const dynamic = "force-dynamic"

export default async function PaymentPage({ params }: { params: { orderId: string } }) {
  const orderId = Number.parseInt(params.orderId)

  if (Number.isNaN(orderId)) {
    notFound()
  }

  const orders = await sql<Order[]>`
    SELECT 
      id, 
      payment_code, 
      total_price::float as total_price, 
      final_price::float as final_price, 
      discount_amount::float as discount_amount, 
      status
    FROM orders
    WHERE id = ${orderId}
  `

  if (orders.length === 0) {
    notFound()
  }

  const order = orders[0]

  return <PaymentDisplay order={order} />
}