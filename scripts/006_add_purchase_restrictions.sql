-- 添加商品购买限制字段
ALTER TABLE products
ADD COLUMN IF NOT EXISTS max_per_user INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_stock INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_end_time TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_presale BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS presale_start_time TIMESTAMP DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN products.max_per_user IS '每人限购数量，NULL表示不限制';
COMMENT ON COLUMN products.total_stock IS '总库存数量，NULL表示不限制';
COMMENT ON COLUMN products.sold_count IS '已售出数量';
COMMENT ON COLUMN products.sale_end_time IS '销售截止时间，NULL表示不限制';
COMMENT ON COLUMN products.is_presale IS '是否为预售商品';
COMMENT ON COLUMN products.presale_start_time IS '预售开始时间（可购买时间）';
