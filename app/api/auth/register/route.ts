import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password, nickname, deviceId } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码为必填项" }, { status: 400 })
    }

    // 检查邮箱是否已存在
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 })
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 12)

    // 创建用户
    const result = await sql`
      INSERT INTO users (email, password_hash, nickname, device_id)
      VALUES (${email}, ${passwordHash}, ${nickname || null}, ${deviceId || null})
      RETURNING id, email, nickname
    `

    const user = result[0]

    // 创建会话
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天

    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt})
    `

    // 如果有设备ID，迁移余额
    if (deviceId) {
      const balanceResult = await sql`
        SELECT id, balance FROM user_balances WHERE user_id = ${deviceId} AND linked_user_id IS NULL
      `

      if (balanceResult.length > 0) {
        await sql`
          UPDATE user_balances SET linked_user_id = ${user.id} WHERE user_id = ${deviceId}
        `
      }
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, nickname: user.nickname },
      sessionToken,
      expiresAt,
    })
  } catch (error) {
    console.error("[v0] 注册错误:", error)
    return NextResponse.json({ error: "注册失败" }, { status: 500 })
  }
}
