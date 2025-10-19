import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    console.log("[v0] Fetching cards for product:", params.productId)

    const cards = await sql`
      SELECT * FROM product_cards 
      WHERE product_id = ${params.productId}
      ORDER BY created_at DESC
    `

    console.log("[v0] Found cards:", cards.length)

    return NextResponse.json(cards)
  } catch (error) {
    console.error("[v0] Error fetching cards:", error)
    return NextResponse.json({ error: "获取卡密失败" }, { status: 500 })
  }
}
