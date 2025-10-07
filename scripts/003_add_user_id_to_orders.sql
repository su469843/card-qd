-- 为订单表添加 user_id 字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- 为 user_id 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
