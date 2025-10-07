import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(2, 15)
  
  try {
    console.log(JSON.stringify({
      level: "info",
      message: "卡密添加API开始处理",
      requestId,
      timestamp: new Date().toISOString(),
      method: "POST",
      endpoint: "/api/cards"
    }))
    
    const { productId, cardCodes } = await request.json()

    console.log(JSON.stringify({
      level: "info",
      message: "接收到卡密添加请求",
      requestId,
      productId,
      cardCodesCount: cardCodes?.length || 0,
      timestamp: new Date().toISOString()
    }))

    if (!productId || !cardCodes || !Array.isArray(cardCodes)) {
      console.log(JSON.stringify({
        level: "warn",
        message: "参数错误",
        requestId,
        error: "缺少productId或cardCodes参数",
        timestamp: new Date().toISOString()
      }))
      return NextResponse.json({ error: "参数错误" }, { status: 400 })
    }

    let added = 0
    const validCodes = cardCodes.filter(code => code && code.trim())
    
    console.log(JSON.stringify({
      level: "info",
      message: "开始添加卡密到数据库",
      requestId,
      totalCodes: cardCodes.length,
      validCodes: validCodes.length,
      timestamp: new Date().toISOString()
    }))

    for (const code of validCodes) {
      await sql`
        INSERT INTO product_cards (product_id, card_code, status)
        VALUES (${productId}, ${code.trim()}, 'available')
      `
      added++
    }

    const duration = Date.now() - startTime
    console.log(JSON.stringify({
      level: "info",
      message: "卡密添加成功",
      requestId,
      addedCount: added,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }))
    
    return NextResponse.json({ success: true, added })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(JSON.stringify({
      level: "error",
      message: "卡密添加失败",
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }))
    
    return NextResponse.json({ error: "添加失败" }, { status: 500 })
  }
}