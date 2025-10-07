import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const orderId = Number.parseInt(params.orderId)

    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "无效的订单ID" }, { status: 400 })
    }

    const orders = await sql`
      SELECT status
      FROM orders
      WHERE id = ${orderId}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    return NextResponse.json({ status: orders[0].status })
  } catch (error) {
    console.error("[v0] 查询订单状态错误:", error)
    return NextResponse.json({ error: "查询失败" }, { status: 500 })
  }
}
