import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { cardId: string } }) {
  try {
    const cardId = Number(params.cardId)

    await sql`
      DELETE FROM product_cards
      WHERE id = ${cardId} AND status = 'available'
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 删除卡密错误:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
