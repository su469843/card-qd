import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    console.log("[v0] 卡密添加 API: 开始处理")
    const { productId, cardCodes } = await request.json()

    if (!productId || !cardCodes || !Array.isArray(cardCodes)) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 })
    }

    let added = 0
    for (const code of cardCodes) {
      if (code && code.trim()) {
        await sql`
          INSERT INTO product_cards (product_id, card_code, status)
          VALUES (${productId}, ${code.trim()}, 'available')
        `
        added++
      }
    }

    console.log("[v0] 卡密添加 API: 成功添加", added, "个卡密")
    return NextResponse.json({ success: true, added })
  } catch (error) {
    console.error("[v0] 卡密添加 API: 错误 =", error)
    return NextResponse.json({ error: "添加失败" }, { status: 500 })
  }
}
