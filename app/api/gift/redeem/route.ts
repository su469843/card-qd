import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { code, userId } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "请输入兑换码" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "请先登录或提供用户标识" }, { status: 400 })
    }

    // 查找兑换码
    const codeResult = await sql`
      SELECT id, card_value, status, creator_user_id FROM gift_codes WHERE code = ${code.toUpperCase().replace(/-/g, "")}
    `

    // 也支持带横线的格式
    if (codeResult.length === 0) {
      const codeWithDashes = await sql`
        SELECT id, card_value, status, creator_user_id FROM gift_codes WHERE code = ${code.toUpperCase()}
      `
      if (codeWithDashes.length === 0) {
        return NextResponse.json({ error: "无效的兑换码" }, { status: 400 })
      }
      codeResult.push(...codeWithDashes)
    }

    const giftCode = codeResult[0]

    if (giftCode.status === "redeemed") {
      return NextResponse.json({ error: "该兑换码已被使用" }, { status: 400 })
    }

    if (giftCode.status === "expired") {
      return NextResponse.json({ error: "该兑换码已过期" }, { status: 400 })
    }

    const cardValue = Number.parseFloat(giftCode.card_value)

    // 获取或创建用户余额
    let balanceResult = await sql`
      SELECT id, balance FROM user_balances WHERE user_id = ${userId}
    `

    if (balanceResult.length === 0) {
      await sql`INSERT INTO user_balances (user_id, balance) VALUES (${userId}, 0)`
      balanceResult = [{ balance: 0 }]
    }

    const currentBalance = Number.parseFloat(balanceResult[0].balance || "0")
    const newBalance = currentBalance + cardValue

    // 更新余额
    await sql`
      UPDATE user_balances SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}
    `

    // 获取登录用户ID
    let recipientUserId = null
    const authHeader = request.headers.get("Authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    if (sessionToken) {
      const userResult = await sql`
        SELECT u.id FROM users u
        JOIN user_sessions s ON u.id = s.user_id
        WHERE s.session_token = ${sessionToken} AND s.expires_at > CURRENT_TIMESTAMP
      `
      if (userResult.length > 0) {
        recipientUserId = userResult[0].id
      }
    }

    // 更新兑换码状态
    await sql`
      UPDATE gift_codes 
      SET status = 'redeemed', recipient_user_id = ${recipientUserId}, redeemed_at = CURRENT_TIMESTAMP 
      WHERE id = ${giftCode.id}
    `

    // 记录交易
    await sql`
      INSERT INTO balance_transactions (user_id, type, amount, balance_before, balance_after, description)
      VALUES (${userId}, 'recharge', ${cardValue}, ${currentBalance}, ${newBalance}, '兑换礼品卡')
    `

    return NextResponse.json({
      success: true,
      cardValue,
      newBalance,
      message: `成功兑换 ¥${cardValue.toFixed(2)}`,
    })
  } catch (error) {
    console.error("[v0] 兑换错误:", error)
    return NextResponse.json({ error: "兑换失败" }, { status: 500 })
  }
}
