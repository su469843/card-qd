import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { cardId: string } }) {
  try {
    console.log("[v0] Fetching card:", params.cardId)

    const cards = await sql`
      SELECT * FROM product_cards 
      WHERE id = ${params.cardId}
    `

    if (cards.length === 0) {
      return NextResponse.json({ error: "卡密不存在" }, { status: 404 })
    }

    console.log("[v0] Found card:", cards[0])

    return NextResponse.json(cards[0])
  } catch (error) {
    console.error("[v0] Error fetching card:", error)
    return NextResponse.json({ error: "获取卡密失败" }, { status: 500 })
  }
}