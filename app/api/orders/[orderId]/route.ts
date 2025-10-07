import { NextRequest, NextResponse } from "next/server"
import { getOrderById } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  const orderId = Number(params.orderId)
  if (!orderId || isNaN(orderId)) {
    return NextResponse.json({ error: "订单ID无效" }, { status: 400 })
  }

  try {
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }
    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: "获取订单失败" }, { status: 500 })
  }
}
