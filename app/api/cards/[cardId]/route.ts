import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { deleteCard } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { cardId: string } }) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(2, 15)
  
  try {
    console.log(JSON.stringify({
      level: "info",
      message: "获取单个卡密API开始处理",
      requestId,
      timestamp: new Date().toISOString(),
      method: "GET",
      endpoint: `/api/cards/${params.cardId}`,
      cardId: params.cardId
    }))

    const cards = await sql`
      SELECT * FROM product_cards 
      WHERE id = ${params.cardId}
    `

    if (cards.length === 0) {
      console.log(JSON.stringify({
        level: "warn",
        message: "卡密不存在",
        requestId,
        cardId: params.cardId,
        timestamp: new Date().toISOString()
      }))
      return NextResponse.json({ error: "卡密不存在" }, { status: 404 })
    }

    const duration = Date.now() - startTime
    console.log(JSON.stringify({
      level: "info",
      message: "成功获取卡密信息",
      requestId,
      cardId: params.cardId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }))

    return NextResponse.json(cards[0])
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(JSON.stringify({
      level: "error",
      message: "获取卡密失败",
      requestId,
      cardId: params.cardId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }))
    
    return NextResponse.json({ error: "获取卡密失败" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const cardId = Number(params.cardId)
  if (!cardId || isNaN(cardId)) {
    return Response.json({ error: "卡密ID无效" }, { status: 400 })
  }
  try {
    await deleteCard(cardId)
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: "删除失败" }, { status: 500 })
  }
}