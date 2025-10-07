import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { paymentCode } = await request.json()

    if (!paymentCode) {
      return NextResponse.json({ error: "付款码不能为空" }, { status: 400 })
    }

    const orders = await sql`
      SELECT id, status
      FROM orders
      WHERE payment_code = ${paymentCode.toUpperCase()}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "付款码不存在" }, { status: 404 })
    }

    const order = orders[0]

    if (order.status === "paid") {
      return NextResponse.json({ error: "该订单已确认付款" }, { status: 400 })
    }

    await sql`
      UPDATE orders
      SET status = 'paid', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${order.id}
    `

    // 分配卡密给订单
    const orderItems = await sql`
      SELECT oi.product_id, oi.quantity, p.use_card_delivery
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${order.id}
    `

    let cardCodes: string[] = []
    
    for (const item of orderItems) {
      if (item.use_card_delivery) {
        // 获取可用的卡密
        const availableCards = await sql`
          SELECT id, card_code
          FROM product_cards
          WHERE product_id = ${item.product_id}
            AND status = 'available'
          LIMIT ${item.quantity}
        `

        if (availableCards.length < item.quantity) {
          console.error(`[v0] 卡密不足: 商品 ${item.product_id} 需要 ${item.quantity} 个卡密，但只有 ${availableCards.length} 个可用`)
          continue
        }

        // 更新卡密状态
        for (const card of availableCards) {
          await sql`
            UPDATE product_cards
            SET status = 'used', order_id = ${order.id}, used_at = CURRENT_TIMESTAMP
            WHERE id = ${card.id}
          `
          cardCodes.push(card.card_code)
        }
      }
    }

    // 保存卡密到订单
    if (cardCodes.length > 0) {
      await sql`
        UPDATE orders
        SET card_codes = ${cardCodes.join(",")}
        WHERE id = ${order.id}
      `
    }

    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      cardCodes: cardCodes.length > 0 ? cardCodes : null
    })
  } catch (error) {
    console.error("[v0] 确认付款错误:", error)
    return NextResponse.json({ error: "确认付款失败" }, { status: 500 })
  }
}
