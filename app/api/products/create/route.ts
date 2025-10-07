import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { name, price, imageUrl, description, tags } = await request.json()

    if (!name || !price) {
      return NextResponse.json({ error: "商品名称和价格为必填项" }, { status: 400 })
    }

    const priceNum = Number.parseFloat(price)
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: "价格格式不正确" }, { status: 400 })
    }

    await sql`
      INSERT INTO products (name, price, image_url, description, tags)
      VALUES (
        ${name},
        ${priceNum},
        ${imageUrl || null},
        ${description || null},
        ${tags || null}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 创建商品错误:", error)
    return NextResponse.json({ error: "创建商品失败" }, { status: 500 })
  }
}
