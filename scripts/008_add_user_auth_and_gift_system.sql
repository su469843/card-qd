-- 用户认证系统
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  device_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 礼品卡/兑换码表
CREATE TABLE IF NOT EXISTS gift_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  card_value DECIMAL(10, 2) NOT NULL,
  creator_user_id INTEGER REFERENCES users(id),
  recipient_user_id INTEGER REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'redeemed', 'expired'
  is_gift BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 更新 user_balances 表关联用户
ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS linked_user_id INTEGER REFERENCES users(id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_codes_creator ON gift_codes(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_codes_recipient ON gift_codes(recipient_user_id);
