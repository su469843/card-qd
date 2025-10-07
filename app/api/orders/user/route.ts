import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    console.log("[v0] 开始获取用户订单")
    const { userId } = await request.json()
    console.log("[v0] 用户ID:", userId)

    if (!userId) {
      console.log("[v0] 错误: 用户标识缺失")
      return NextResponse.json({ error: "用户标识缺失" }, { status: 400 })
    }

    console.log("[v0] 查询数据库中的订单...")
    const orders = await sql`
      SELECT 
        o.id,
        o.payment_code,
        o.total_price,
        o.final_price,
        o.discount_amount,
        o.status,
        o.created_at,
        o.card_codes,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'name', p.name,
            'image_url', p.image_url
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ${userId}
      GROUP BY o.id, o.payment_code, o.total_price, o.final_price, o.discount_amount, o.status, o.created_at, o.card_codes
      ORDER BY o.created_at DESC
    `

    console.log("[v0] 查询成功，找到订单数量:", orders.length)

    const formattedOrders = orders.map((order) => ({
      ...order,
      total_price: Number.parseFloat(order.total_price || "0"),
      final_price: Number.parseFloat(order.final_price || "0"),
      discount_amount: Number.parseFloat(order.discount_amount || "0"),
      items: (order.items || []).map((item: any) => ({
        ...item,
        price: Number.parseFloat(item.price || "0"),
      })),
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error("[v0] 获取订单失败 - 详细错误:", error)
    console.error("[v0] 错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息")
    return NextResponse.json(
      { error: "获取订单失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
