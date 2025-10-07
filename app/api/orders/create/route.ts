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

    const totalPrice = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0,
    )

    console.log("[v0] 订单创建 API: 计算总价 =", totalPrice)
    console.log("[v0] 订单创建 API: 最终价格 =", finalPrice)
    console.log("[v0] 订单创建 API: 优惠金额 =", discountAmount)

    const paymentCode = generatePaymentCode()

    const orderStatus = finalPrice <= 0 ? "paid" : "pending"
    console.log("[v0] 订单创建 API: 订单状态 =", orderStatus)

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
        final_price
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
        ${finalPrice}
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
    }

    console.log("[v0] 订单创建 API: 订单商品已插入")
    console.log("[v0] 订单创建 API: 订单创建成功，返回数据")

    return NextResponse.json({
      orderId,
      paymentCode,
      status: orderStatus,
      isFree: finalPrice <= 0,
    })
  } catch (error) {
    console.error("[v0] 订单创建 API: 错误 =", error)
    console.error("[v0] 订单创建 API: 错误堆栈 =", error instanceof Error ? error.stack : String(error))
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 })
  }
}
