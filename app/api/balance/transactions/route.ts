import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const result = await sql`
      SELECT * FROM balance_transactions 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 50
    `

    const transactions = result.map(row => ({
      ...row,
      amount: Number.parseFloat(row.amount),
      balance_before: Number.parseFloat(row.balance_before),
      balance_after: Number.parseFloat(row.balance_after)
    }))

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('[v0] 获取交易记录失败:', error)
    return NextResponse.json({ error: '获取交易记录失败' }, { status: 500 })
  }
}
