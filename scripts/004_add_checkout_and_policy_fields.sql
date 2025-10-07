-- 添加优惠码表
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' 或 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at DATE, -- 修复语法错误：expires; 改为 expires_at
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为订单表添加结账信息字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- 为商品表添加购买政策字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER; -- 库存数量
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_per_user INTEGER; -- 每人限购数量
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true; -- 是否可购买
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_start_time TIMESTAMP; -- 开始销售时间
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_end_time TIMESTAMP; -- 结束销售时间
