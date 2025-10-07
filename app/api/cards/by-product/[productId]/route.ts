import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(2, 15)
  
  try {
    console.log(JSON.stringify({
      level: "info",
      message: "根据产品ID获取卡密API开始处理",
      requestId,
      timestamp: new Date().toISOString(),
      method: "GET",
      endpoint: `/api/cards/by-product/${params.productId}`,
      productId: params.productId
    }))

    const cards = await sql`
      SELECT * FROM product_cards 
      WHERE product_id = ${params.productId}
      ORDER BY created_at DESC
    `

    console.log(JSON.stringify({
      level: "info",
      message: "成功获取产品卡密列表",
      requestId,
      productId: params.productId,
      cardsCount: cards.length,
      timestamp: new Date().toISOString()
    }))

    return NextResponse.json(cards)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(JSON.stringify({
      level: "error",
      message: "获取产品卡密失败",
      requestId,
      productId: params.productId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }))
    
    return NextResponse.json({ error: "获取卡密失败" }, { status: 500 })
  }
}
