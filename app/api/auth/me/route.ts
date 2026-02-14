import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    if (!sessionToken) {
      return NextResponse.json({ user: null })
    }

    const result = await sql`
      SELECT u.id, u.email, u.nickname, u.device_id
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > CURRENT_TIMESTAMP
    `

    if (result.length === 0) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("[v0] 获取用户信息错误:", error)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    if (sessionToken) {
      await sql`DELETE FROM user_sessions WHERE session_token = ${sessionToken}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 登出错误:", error)
    return NextResponse.json({ error: "登出失败" }, { status: 500 })
  }
}
