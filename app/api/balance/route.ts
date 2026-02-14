import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    console.log('[v0] 获取用户余额:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    // 获取或创建用户余额记录
    let result = await sql`
      SELECT * FROM user_balances WHERE user_id = ${userId}
    `

    if (result.length === 0) {
      // 创建新的余额记录
      result = await sql`
        INSERT INTO user_balances (user_id, balance) VALUES (${userId}, 0.00) RETURNING *
      `
    }

    const balance = Number.parseFloat(result[0].balance)

    console.log('[v0] 用户余额:', balance)

    return NextResponse.json({ balance })
  } catch (error) {
    console.error('[v0] 获取余额失败:', error)
    return NextResponse.json({ error: '获取余额失败' }, { status: 500 })
  }
}
