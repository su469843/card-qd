-- 添加优惠码表
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' 或 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为订单表添加用户信息字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2);

-- 插入示例优惠码
INSERT INTO coupons (code, discount_type, discount_value, is_active)
VALUES 
  ('WELCOME10', 'percentage', 10, true),
  ('SAVE20', 'fixed', 20, true)
ON CONFLICT (code) DO NOTHING;
