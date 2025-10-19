import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { paymentCode } = await request.json()

    if (!paymentCode) {
      return NextResponse.json({ error: "付款码不能为空" }, { status: 400 })
    }

    const orders = await sql`
      SELECT id, status
      FROM orders
      WHERE payment_code = ${paymentCode.toUpperCase()}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "付款码不存在" }, { status: 404 })
    }

    const order = orders[0]

    if (order.status === "paid") {
      return NextResponse.json({ error: "该订单已确认付款" }, { status: 400 })
    }

    await sql`
      UPDATE orders
      SET status = 'paid', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${order.id}
    `

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error("[v0] 确认付款错误:", error)
    return NextResponse.json({ error: "确认付款失败" }, { status: 500 })
  }
}
