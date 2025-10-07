// 数据库实体类型
export interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
  description: string | null
  tags: string | null
  use_card_delivery: boolean
  max_per_user: number | null
  total_stock: number | null
  sold_count: number
  sale_end_time: string | null
  is_presale: boolean
  presale_start_time: string | null
  created_at: string
}

export interface Order {
  id: number
  payment_code: string
  total_price: string
  final_price: string
  discount_amount: string
  status: 'pending' | 'paid' | 'cancelled'
  user_id: string
  email: string
  country: string
  address_line1: string
  address_line2: string | null
  notes: string | null
  coupon_code: string | null
  card_codes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: string
}

export interface ProductCard {
  id: number
  product_id: number
  card_code: string
  status: 'available' | 'used'
  order_id: number | null
  created_at: string
  used_at: string | null
}

export interface Coupon {
  id: number
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  created_at: string
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface OrderWithItems extends Omit<Order, 'total_price' | 'final_price' | 'discount_amount'> {
  total_price: number
  final_price: number
  discount_amount: number
  items: Array<{
    product_id: number
    quantity: number
    price: number
    name: string
    image_url: string | null
  }>
}

// 表单数据类型
export interface CheckoutFormData {
  email: string
  country: string
  addressLine1: string
  addressLine2?: string
  notes?: string
  couponCode?: string
}

// 组件属性类型
export interface CartItem {
  productId: number
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

// 工具类型
export type Nullable<T> = T | null | undefined