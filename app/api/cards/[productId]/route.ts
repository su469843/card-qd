import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { productId: string } }) {
  try {
    const productId = Number(params.productId)

    const cards = await sql`
      SELECT * FROM product_cards
      WHERE product_id = ${productId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(cards)
  } catch (error) {
    console.error("[v0] 获取卡密错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
