-- 添加卡密发货系统

-- 1. 为商品表添加卡密发货字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS use_card_delivery BOOLEAN DEFAULT FALSE;

-- 2. 创建卡密表
CREATE TABLE IF NOT EXISTS product_cards (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  card_code TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'used')),
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP
);

-- 3. 为订单表添加卡密字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_codes TEXT;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_product_cards_product_id ON product_cards(product_id);
CREATE INDEX IF NOT EXISTS idx_product_cards_status ON product_cards(status);
CREATE INDEX IF NOT EXISTS idx_product_cards_order_id ON product_cards(order_id);
