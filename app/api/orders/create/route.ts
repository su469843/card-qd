import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

function generatePaymentCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  try {
    console.log("[v0] 订单创建 API: 开始处理请求")

    const body = await request.json()
    console.log("[v0] 订单创建 API: 请求体 =", JSON.stringify(body, null, 2))

    const {
      items,
      userId,
      email,
      country,
      addressLine1,
      addressLine2,
      notes,
      couponCode,
      discountAmount,
      finalPrice,
      turnstileToken,
      useBalance,
      balanceAmount,
    } = body

    if (!items || items.length === 0) {
      console.error("[v0] 订单创建 API: 购物车为空")
      return NextResponse.json({ error: "购物车为空" }, { status: 400 })
    }

    if (!userId) {
      console.error("[v0] 订单创建 API: 用户标识缺失")
      return NextResponse.json({ error: "用户标识缺失" }, { status: 400 })
    }

    if (!email || !country || !addressLine1) {
      console.error("[v0] 订单创建 API: 必填字段缺失")
      return NextResponse.json({ error: "必填字段缺失" }, { status: 400 })
    }

    if (!turnstileToken) {
      console.error("[v0] 订单创建 API: 验证令牌缺失")
      return NextResponse.json({ error: "验证令牌缺失" }, { status: 400 })
    }

    for (const item of items) {
      const products = await sql`
        SELECT 
          id, name, max_per_user, total_stock, sold_count,
          sale_end_time, is_presale, presale_start_time
        FROM products
        WHERE id = ${item.productId}
      `

      if (products.length === 0) {
        return NextResponse.json({ error: `商品 ${item.productId} 不存在` }, { status: 400 })
      }

      const product = products[0]
      const now = new Date()

      // 检查销售截止时间
      if (product.sale_end_time && new Date(product.sale_end_time) < now) {
        return NextResponse.json({ error: `商品 ${product.name} 已停止销售` }, { status: 400 })
      }

      // 检查预售时间
      if (product.is_presale && product.presale_start_time && new Date(product.presale_start_time) > now) {
        return NextResponse.json({ error: `商品 ${product.name} 预售未开始` }, { status: 400 })
      }

      // 检查库存
      if (product.total_stock !== null && product.sold_count + item.quantity > product.total_stock) {
        return NextResponse.json({ error: `商品 ${product.name} 库存不足` }, { status: 400 })
      }

      // 检查每人限购
      if (product.max_per_user !== null) {
        const userOrders = await sql`
          SELECT COALESCE(SUM(oi.quantity), 0) as total_purchased
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.user_id = ${userId}
            AND oi.product_id = ${item.productId}
            AND o.status IN ('pending', 'paid')
        `

        const totalPurchased = Number(userOrders[0]?.total_purchased || 0)
        if (totalPurchased + item.quantity > product.max_per_user) {
          return NextResponse.json(
            {
              error: `商品 ${product.name} 每人限购 ${product.max_per_user} 件，您已购买 ${totalPurchased} 件`,
            },
            { status: 400 },
          )
        }
      }
    }

    const totalPrice = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0,
    )

    console.log("[v0] 订单创建 API: 计算总价 =", totalPrice)
    console.log("[v0] 订单创建 API: 最终价格 =", finalPrice)
    console.log("[v0] 订单创建 API: 优惠金额 =", discountAmount)

    // 处理余额支付
    let actualBalanceUsed = 0
    let remainingPrice = finalPrice
    let paymentMethod = "payment_code"

    if (useBalance && balanceAmount > 0) {
      const balanceResult = await sql`
        SELECT balance FROM user_balances WHERE user_id = ${userId}
      `

      if (balanceResult.length > 0) {
        const currentBalance = Number.parseFloat(balanceResult[0].balance)
        actualBalanceUsed = Math.min(balanceAmount, currentBalance, finalPrice)
        remainingPrice = finalPrice - actualBalanceUsed

        if (actualBalanceUsed > 0) {
          // 扣除余额
          const newBalance = currentBalance - actualBalanceUsed
          await sql`
            UPDATE user_balances 
            SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = ${userId}
          `

          paymentMethod = remainingPrice > 0 ? "mixed" : "balance"
          console.log("[v0] 订单创建 API: 使用余额 =", actualBalanceUsed, "剩余需支付 =", remainingPrice)
        }
      }
    }

    const paymentCode = generatePaymentCode()
    const orderStatus = remainingPrice <= 0 ? "paid" : "pending"
    console.log("[v0] 订单创建 API: 订单状态 =", orderStatus, "支付方式 =", paymentMethod)

    const orderResult = await sql`
      INSERT INTO orders (
        payment_code, 
        total_price, 
        status, 
        user_id,
        email,
        country,
        address_line1,
        address_line2,
        notes,
        coupon_code,
        discount_amount,
        final_price,
        balance_paid,
        payment_method
      )
      VALUES (
        ${paymentCode}, 
        ${totalPrice}, 
        ${orderStatus}, 
        ${userId},
        ${email},
        ${country},
        ${addressLine1},
        ${addressLine2 || null},
        ${notes || null},
        ${couponCode || null},
        ${discountAmount || 0},
        ${finalPrice},
        ${actualBalanceUsed},
        ${paymentMethod}
      )
      RETURNING id
    `

    const orderId = orderResult[0].id
    console.log("[v0] 订单创建 API: 订单已创建，ID =", orderId)

    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (${orderId}, ${item.productId}, ${item.quantity}, ${item.price})
      `

      await sql`
        UPDATE products
        SET sold_count = sold_count + ${item.quantity}
        WHERE id = ${item.productId}
      `

      // 如果是消费卡且订单已支付，立即充值余额
      if (orderStatus === "paid") {
        const productResult = await sql`
          SELECT is_balance_card, card_value FROM products WHERE id = ${item.productId}
        `

        if (productResult.length > 0 && productResult[0].is_balance_card && productResult[0].card_value) {
          const cardValue = Number.parseFloat(productResult[0].card_value)
          const totalRecharge = cardValue * item.quantity

          // 获取或创建用户余额记录
          let balanceResult = await sql`
            SELECT balance FROM user_balances WHERE user_id = ${userId}
          `

          let currentBalance = 0
          if (balanceResult.length === 0) {
            await sql`
              INSERT INTO user_balances (user_id, balance) VALUES (${userId}, 0.00)
            `
          } else {
            currentBalance = Number.parseFloat(balanceResult[0].balance)
          }

          const newBalance = currentBalance + totalRecharge

          // 更新余额
          await sql`
            UPDATE user_balances SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}
          `

          // 记录交易
          await sql`
            INSERT INTO balance_transactions 
            (user_id, type, amount, balance_before, balance_after, order_id, description) 
            VALUES (${userId}, 'recharge', ${totalRecharge}, ${currentBalance}, ${newBalance}, ${orderId}, ${`购买消费卡充值 (${item.quantity}张)`})
          `

          console.log("[v0] 订单创建 API: 消费卡充值成功，充值金额 =", totalRecharge)
        }
      }
    }

    console.log("[v0] 订单创建 API: 订单商品已插入，库存已更新")

    // 如果使用了余额，记录余额消费
    if (actualBalanceUsed > 0) {
      const balanceResult = await sql`
        SELECT balance FROM user_balances WHERE user_id = ${userId}
      `

      if (balanceResult.length > 0) {
        const currentBalance = Number.parseFloat(balanceResult[0].balance)

        await sql`
          INSERT INTO balance_transactions 
          (user_id, type, amount, balance_before, balance_after, order_id, description) 
          VALUES (${userId}, 'consume', ${actualBalanceUsed}, ${currentBalance + actualBalanceUsed}, ${currentBalance}, ${orderId}, '订单支付')
        `
      }
    }

    console.log("[v0] 订单创建 API: 订单创建成功，返回数据")

    return NextResponse.json({
      orderId,
      paymentCode,
      status: orderStatus,
      isFree: remainingPrice <= 0,
      balanceUsed: actualBalanceUsed,
      remainingPrice,
    })
  } catch (error) {
    console.error("[v0] 订单创建 API: 错误 =", error)
    console.error("[v0] 订单创建 API: 错误堆栈 =", error instanceof Error ? error.stack : String(error))
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 })
  }
}
