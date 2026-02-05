import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, orderId, description } = await request.json()
    
    console.log('[v0] 余额充值:', { userId, amount, orderId })
    
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: '无效的充值参数' }, { status: 400 })
    }

    // 获取当前余额
    let balanceResult = await query(
      'SELECT balance FROM user_balances WHERE user_id = $1',
      [userId]
    )

    let currentBalance = 0
    if (balanceResult.rows.length === 0) {
      // 创建新的余额记录
      await query(
        'INSERT INTO user_balances (user_id, balance) VALUES ($1, 0.00)',
        [userId]
      )
    } else {
      currentBalance = parseFloat(balanceResult.rows[0].balance)
    }

    const newBalance = currentBalance + parseFloat(amount)

    // 更新余额
    await query(
      'UPDATE user_balances SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [newBalance, userId]
    )

    // 记录交易
    await query(
      `INSERT INTO balance_transactions 
       (user_id, type, amount, balance_before, balance_after, order_id, description) 
       VALUES ($1, 'recharge', $2, $3, $4, $5, $6)`,
      [userId, amount, currentBalance, newBalance, orderId, description || '购买消费卡充值']
    )

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
