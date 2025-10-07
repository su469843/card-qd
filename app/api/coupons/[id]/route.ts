import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { isActive } = await request.json()
    const id = Number.parseInt(params.id)

    await sql`
      UPDATE coupons
      SET is_active = ${isActive}
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 更新优惠码错误:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}
