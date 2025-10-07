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
  const orderRows = await sql`SELECT id, payment_code, total_price, status, discount_amount, product_id FROM orders WHERE id = ${orderId} LIMIT 1`;
  if (!orderRows || orderRows.length === 0) return null;
  const order = orderRows[0];
  // 查询兑换码（通过 product_id）
  const cardRows = await sql`SELECT card_code FROM product_cards WHERE product_id = ${order.product_id}`;
  const card_codes = cardRows && cardRows.length > 0 ? cardRows.map(c => c.card_code).join(', ') : undefined;
  return {
    ...order,
    card_codes,
    final_price: Number(order.total_price) - Number(order.discount_amount || 0),
  };
}

export async function getProductDescription(productId: number) {
  const rows = await sql`SELECT description FROM products WHERE id = ${productId} LIMIT 1`;
  if (!rows || rows.length === 0) return null;
  return rows[0].description;
}

// 优惠码相关
export async function deleteCoupon(couponId: number) {
  await sql`DELETE FROM coupons WHERE id = ${couponId}`;
}

export async function updateCoupon(couponId: number, fields: { code?: string; discount?: number; expires_at?: string }) {
  const updates = [];
  if (fields.code !== undefined) updates.push(sql`code = ${fields.code}`);
  if (fields.discount !== undefined) updates.push(sql`discount = ${fields.discount}`);
  if (fields.expires_at !== undefined) updates.push(sql`expires_at = ${fields.expires_at}`);
  if (updates.length === 0) return;
  await sql`UPDATE coupons SET ${sql.join(updates, ', ')} WHERE id = ${couponId}`;
}

// 兑换码相关
export async function deleteCard(cardId: number) {
  await sql`DELETE FROM product_cards WHERE id = ${cardId}`;
}

export async function updateCard(cardId: number, fields: { card_code?: string; status?: string; product_id?: number }) {
  const updates = [];
  if (fields.card_code !== undefined) updates.push(sql`card_code = ${fields.card_code}`);
  if (fields.status !== undefined) updates.push(sql`status = ${fields.status}`);
  if (fields.product_id !== undefined) updates.push(sql`product_id = ${fields.product_id}`);
  if (updates.length === 0) return;
  await sql`UPDATE product_cards SET ${sql.join(updates, ', ')} WHERE id = ${cardId}`;
}
