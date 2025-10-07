import { sql } from "@/lib/db"
import { ApiError, handleApiError, successResponse, validateRequestBody } from "@/lib/api-utils"
import { OrderWithItems } from "@/types"

export async function POST(request: Request) {
  try {
    const { userId } = await validateRequestBody(request, (body) => {
      if (!body.userId) {
        throw new ApiError(400, "用户标识缺失")
      }
      return body
    })

    const orders = await sql<OrderWithItems[]>`
      SELECT 
        o.id,
        o.payment_code,
        o.total_price::float as total_price,
        o.final_price::float as final_price,
        o.discount_amount::float as discount_amount,
        o.status,
        o.created_at,
        o.card_codes,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price::float,
              'name', p.name,
              'image_url', p.image_url
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ${userId}
      GROUP BY o.id, o.payment_code, o.total_price, o.final_price, o.discount_amount, o.status, o.created_at, o.card_codes
      ORDER BY o.created_at DESC
    `

    return successResponse({ orders })
  } catch (error) {
    return handleApiError(error)
  }
}