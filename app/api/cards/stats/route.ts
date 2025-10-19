import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
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

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] 获取卡密统计错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
