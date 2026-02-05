import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const result = await query(
      `SELECT * FROM balance_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    )

    const transactions = result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount),
      balance_before: parseFloat(row.balance_before),
      balance_after: parseFloat(row.balance_after)
    }))

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('[v0] 获取交易记录失败:', error)
    return NextResponse.json({ error: '获取交易记录失败' }, { status: 500 })
  }
}
