import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "优惠码不能为空" }, { status: 400 })
    }

    const coupons = await sql`
      SELECT * FROM coupons
      WHERE code = ${code} AND is_active = true
    `

    if (coupons.length === 0) {
      return NextResponse.json({ error: "优惠码无效或已过期" }, { status: 404 })
    }

    const coupon = coupons[0]

    return NextResponse.json({
      valid: true,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
    })
  } catch (error) {
    console.error("[v0] 验证优惠码错误:", error)
    return NextResponse.json({ error: "验证失败" }, { status: 500 })
  }
}
