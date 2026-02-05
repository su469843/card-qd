import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    if (!sessionToken) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const userResult = await sql`
      SELECT u.id FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > CURRENT_TIMESTAMP
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const userId = userResult[0].id

    // 获取用户创建的礼品卡
    const codes = await sql`
      SELECT id, code, card_value, status, is_gift, created_at, redeemed_at
      FROM gift_codes 
      WHERE creator_user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(codes)
  } catch (error) {
    console.error("[v0] 获取礼品卡列表错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
