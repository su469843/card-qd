import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  try {
    const { cardValue, orderId, isGift, userId } = await request.json()

    if (!cardValue || cardValue <= 0) {
      return NextResponse.json({ error: "无效的卡面值" }, { status: 400 })
    }

    const code = generateGiftCode()

    // 获取用户ID（从会话或设备ID）
    let creatorUserId = null
    const authHeader = request.headers.get("Authorization")
    const sessionToken = authHeader?.replace("Bearer ", "")

    if (sessionToken) {
      const userResult = await sql`
        SELECT u.id FROM users u
        JOIN user_sessions s ON u.id = s.user_id
        WHERE s.session_token = ${sessionToken} AND s.expires_at > CURRENT_TIMESTAMP
      `
      if (userResult.length > 0) {
        creatorUserId = userResult[0].id
      }
    }

    const result = await sql`
      INSERT INTO gift_codes (code, card_value, creator_user_id, order_id, is_gift)
      VALUES (${code}, ${cardValue}, ${creatorUserId}, ${orderId || null}, ${isGift || false})
      RETURNING id, code, card_value, is_gift, created_at
    `

    const giftCode = result[0]

    // 如果不是礼品（自己使用），立即兑换
    if (!isGift && userId) {
      // 获取或创建余额记录
      let balanceResult = await sql`
        SELECT id, balance FROM user_balances WHERE user_id = ${userId}
      `

      if (balanceResult.length === 0) {
        await sql`INSERT INTO user_balances (user_id, balance) VALUES (${userId}, 0)`
        balanceResult = [{ balance: 0 }]
      }

      const currentBalance = Number.parseFloat(balanceResult[0].balance || "0")
      const newBalance = currentBalance + cardValue

      await sql`
        UPDATE user_balances SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}
      `

      await sql`
        UPDATE gift_codes SET status = 'redeemed', redeemed_at = CURRENT_TIMESTAMP WHERE id = ${giftCode.id}
      `

      await sql`
        INSERT INTO balance_transactions (user_id, type, amount, balance_before, balance_after, description)
        VALUES (${userId}, 'recharge', ${cardValue}, ${currentBalance}, ${newBalance}, '消费卡自用充值')
      `

      return NextResponse.json({
        success: true,
        redeemed: true,
        newBalance,
        message: "充值成功",
      })
    }

    // 返回礼品码
    const giftUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/redeem?code=${code}`

    return NextResponse.json({
      success: true,
      code: giftCode.code,
      cardValue: giftCode.card_value,
      giftUrl,
      message: "礼品卡创建成功",
    })
  } catch (error) {
    console.error("[v0] 创建礼品卡错误:", error)
    return NextResponse.json({ error: "创建失败" }, { status: 500 })
  }
}
