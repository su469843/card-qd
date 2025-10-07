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
  const orderRows = await sql`SELECT id, payment_code, total_price, status FROM orders WHERE id = ${orderId} LIMIT 1`;
  if (!orderRows || orderRows.length === 0) return null;
  return orderRows[0];
}

export async function getProductDescription(productId: number) {
  const rows = await sql`SELECT description FROM products WHERE id = ${productId} LIMIT 1`;
  if (!rows || rows.length === 0) return null;
  return rows[0].description;
}
