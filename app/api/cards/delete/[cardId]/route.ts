import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { cardId: string } }) {
  try {
    console.log("[v0] Deleting card:", params.cardId)

    await sql`
      DELETE FROM product_cards 
      WHERE id = ${params.cardId}
    `

    console.log("[v0] Card deleted successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting card:", error)
    return NextResponse.json({ error: "删除卡密失败" }, { status: 500 })
  }
}
