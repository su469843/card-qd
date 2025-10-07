import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const products = await sql`
      SELECT * FROM products 
      ORDER BY created_at DESC
    `

    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] 获取商品列表错误:", error)
    return NextResponse.json({ error: "获取商品列表失败" }, { status: 500 })
  }
}