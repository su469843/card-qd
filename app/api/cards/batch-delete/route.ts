import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 批量删除卡密 API 调用")

    const body = await request.json()
    const { cardIds } = body

    console.log("[v0] 要删除的卡密 IDs:", cardIds)

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json({ error: "无效的卡密ID列表" }, { status: 400 })
    }

    // 只删除状态为 available 的卡密
    const result = await sql`
      DELETE FROM product_cards
      WHERE id = ANY(${cardIds}::int[])
      AND status = 'available'
      RETURNING id
    `

    console.log("[v0] 删除结果:", result)

    return NextResponse.json({
      success: true,
      deleted: result.length,
    })
  } catch (error) {
    console.error("[v0] 批量删除卡密错误:", error)
    return NextResponse.json({ error: "批量删除失败" }, { status: 500 })
  }
}
