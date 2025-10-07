import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { cardId: string } }) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(2, 15)
  
  try {
    console.log(JSON.stringify({
      level: "info",
      message: "删除卡密API开始处理",
      requestId,
      timestamp: new Date().toISOString(),
      method: "DELETE",
      endpoint: `/api/cards/delete/${params.cardId}`,
      cardId: params.cardId
    }))

    const result = await sql`
      DELETE FROM product_cards 
      WHERE id = ${params.cardId}
      RETURNING id
    `

    if (result.length === 0) {
      console.log(JSON.stringify({
        level: "warn",
        message: "要删除的卡密不存在",
        requestId,
        cardId: params.cardId,
        timestamp: new Date().toISOString()
      }))
      return NextResponse.json({ error: "卡密不存在" }, { status: 404 })
    }

    const duration = Date.now() - startTime
    console.log(JSON.stringify({
      level: "info",
      message: "卡密删除成功",
      requestId,
      cardId: params.cardId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }))

    return NextResponse.json({ success: true })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(JSON.stringify({
      level: "error",
      message: "删除卡密失败",
      requestId,
      cardId: params.cardId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }))
    
    return NextResponse.json({ error: "删除卡密失败" }, { status: 500 })
  }
}
