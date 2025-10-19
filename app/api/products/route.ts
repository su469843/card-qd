import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] 获取商品列表 API: 开始")

    const products = await sql`
      SELECT * FROM products ORDER BY created_at DESC
    `

    console.log("[v0] 获取商品列表 API: 成功，共", products.length, "个商品")
    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] 获取商品列表错误:", error)
    return NextResponse.json({ error: "获取商品列表失败" }, { status: 500 })
  }
}
