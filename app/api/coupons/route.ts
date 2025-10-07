import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] 开始获取优惠码列表")
    const coupons = await sql`
      SELECT * FROM coupons
      ORDER BY created_at DESC
    `
    console.log("[v0] 成功获取优惠码，数量:", coupons.length)

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error("[v0] 获取优惠码错误 - 详细信息:", error)
    console.error("[v0] 错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息")
    return NextResponse.json(
      { error: "获取失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] 开始创建优惠码")
    const { code, discountType, discountValue } = await request.json()
    console.log("[v0] 优惠码数据:", { code, discountType, discountValue })

    await sql`
      INSERT INTO coupons (code, discount_type, discount_value)
      VALUES (${code}, ${discountType}, ${discountValue})
    `
    console.log("[v0] 成功创建优惠码")
    return NextResponse.json({ message: "优惠码创建成功" }, { status: 201 })
  } catch (error) {
    console.error("[v0] 创建优惠码错误 - 详细信息:", error)
    console.error("[v0] 错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息")
    return NextResponse.json(
      { error: "创建失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
