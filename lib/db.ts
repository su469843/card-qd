import { neon } from "@neondatabase/serverless"

const createSql = () => {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    
    console.warn("DATABASE_URL environment variable is not set - using mock database")
    
    return async (strings: TemplateStringsArray, ...values: any[]) => {
      return []
    }
  }
  
  return neon(process.env.DATABASE_URL)
}

export const sql = createSql()

export async function getOrderById(orderId: number) {
  // 查询订单主表
  const orderRows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
  if (!orderRows || orderRows.length === 0) return null;
  const order = orderRows[0];

  // 查询订单商品明细
  const items = await sql`SELECT * FROM order_items WHERE order_id = ${orderId}`;

  // 查询卡密（如有）
  const cardRows = await sql`SELECT card_code FROM cards WHERE order_id = ${orderId}`;
  const card_codes = cardRows && cardRows.length > 0 ? cardRows.map(c => c.card_code).join(', ') : undefined;

  return {
    ...order,
    items,
    card_codes,
  };
}
