import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password, deviceId } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码为必填项" }, { status: 400 })
    }

    // 查找用户
    const userResult = await sql`
      SELECT id, email, password_hash, nickname FROM users WHERE email = ${email}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 })
    }

    const user = userResult[0]

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 })
    }

    // 创建新会话
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt})
    `

    // 更新设备ID
    if (deviceId) {
      await sql`
        UPDATE users SET device_id = ${deviceId}, updated_at = CURRENT_TIMESTAMP WHERE id = ${user.id}
      `

      // 合并设备余额到用户账户
      const deviceBalance = await sql`
        SELECT balance FROM user_balances WHERE user_id = ${deviceId} AND linked_user_id IS NULL
      `

      if (deviceBalance.length > 0) {
        const existingUserBalance = await sql`
          SELECT id, balance FROM user_balances WHERE linked_user_id = ${user.id}
        `

        if (existingUserBalance.length > 0) {
          // 合并余额
          const newBalance = Number.parseFloat(existingUserBalance[0].balance) + Number.parseFloat(deviceBalance[0].balance)
          await sql`
            UPDATE user_balances SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE linked_user_id = ${user.id}
          `
          await sql`DELETE FROM user_balances WHERE user_id = ${deviceId} AND linked_user_id IS NULL`
        } else {
          await sql`
            UPDATE user_balances SET linked_user_id = ${user.id} WHERE user_id = ${deviceId}
          `
        }
      }
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, nickname: user.nickname },
      sessionToken,
      expiresAt,
    })
  } catch (error) {
    console.error("[v0] 登录错误:", error)
    return NextResponse.json({ error: "登录失败" }, { status: 500 })
  }
}
