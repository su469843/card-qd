import { sql } from "./lib/db"

async function checkDatabaseStructure() {
  try {
    console.log("检查数据库结构...")
    
    // 检查orders表是否有card_codes字段
    const ordersResult = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'card_codes'`
    console.log('orders表card_codes字段:', ordersResult.length > 0 ? '存在' : '不存在')
    
    // 检查products表是否有use_card_delivery字段
    const productsResult = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'use_card_delivery'`
    console.log('products表use_card_delivery字段:', productsResult.length > 0 ? '存在' : '不存在')
    
    // 检查product_cards表是否存在
    const cardsTableResult = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'product_cards'`
    console.log('product_cards表:', cardsTableResult.length > 0 ? '存在' : '不存在')
    
  } catch (error) {
    console.error('数据库检查错误:', error)
  }
}

checkDatabaseStructure()