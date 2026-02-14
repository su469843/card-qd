import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, orderId, description } = await request.json()
    
    console.log('[v0] 余额充值:', { userId, amount, orderId })
    
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: '无效的充值参数' }, { status: 400 })
    }

    // 获取当前余额
    let balanceResult = await sql`
      SELECT balance FROM user_balances WHERE user_id = ${userId}
    `

    let currentBalance = 0
    if (balanceResult.length === 0) {
      // 创建新的余额记录
      await sql`
        INSERT INTO user_balances (user_id, balance) VALUES (${userId}, 0.00)
      `
    } else {
      currentBalance = Number.parseFloat(balanceResult[0].balance)
    }

    const newBalance = currentBalance + Number.parseFloat(amount)

    // 更新余额
    await sql`
      UPDATE user_balances SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}
    `

    // 记录交易
    await sql`
      INSERT INTO balance_transactions 
      (user_id, type, amount, balance_before, balance_after, order_id, description) 
      VALUES (${userId}, 'recharge', ${amount}, ${currentBalance}, ${newBalance}, ${orderId}, ${description || '购买消费卡充值'})
    `

    console.log('[v0] 充值成功:', { newBalance })

    return NextResponse.json({ 
      success: true, 
      balance: newBalance,
      amount: parseFloat(amount)
    })
  } catch (error) {
    console.error('[v0] 充值失败:', error)
    return NextResponse.json({ error: '充值失败' }, { status: 500 })
  }
}
