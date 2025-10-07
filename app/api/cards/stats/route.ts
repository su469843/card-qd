import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(2, 15)
  
  try {
    console.log(JSON.stringify({
      level: "info",
      message: "获取卡密统计API开始处理",
      requestId,
      timestamp: new Date().toISOString(),
      method: "GET",
      endpoint: "/api/cards/stats"
    }))

    const stats = await sql`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        COUNT(pc.id) as total,
        COUNT(CASE WHEN pc.status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN pc.status = 'used' THEN 1 END) as used
      FROM products p
      LEFT JOIN product_cards pc ON p.id = pc.product_id
      WHERE p.use_card_delivery = true
      GROUP BY p.id, p.name
      ORDER BY p.id
    `

    console.log(JSON.stringify({
      level: "info",
      message: "成功获取卡密统计信息",
      requestId,
      productsCount: stats.length,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    }))

    return NextResponse.json(stats)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(JSON.stringify({
      level: "error",
      message: "获取卡密统计失败",
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }))
    
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
