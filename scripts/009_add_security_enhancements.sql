-- Enhanced Security System Migration
-- Adds device fingerprinting, order security, payment info, and profile management

-- Add device fingerprinting fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_size INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_updated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_device TEXT;

-- Create device fingerprints table for tracking user devices
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    fingerprint_hash TEXT NOT NULL,
    user_agent TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    language TEXT,
    platform TEXT,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_trusted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);

-- Add payment additional info to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_additional_info JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_verification_token TEXT;

-- Create order security audit table
CREATE TABLE IF NOT EXISTS order_security_audit (
    id SERIAL PRIMARY KEY,
    order_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    device_fingerprint TEXT,
    access_ip TEXT,
    access_user_agent TEXT,
    access_type TEXT, -- 'view', 'payment', 'update'
    is_authorized BOOLEAN DEFAULT true,
    suspicious_activity BOOLEAN DEFAULT false,
    audit_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_audit_order_id ON order_security_audit(order_id);
CREATE INDEX idx_order_audit_user_id ON order_security_audit(user_id);
CREATE INDEX idx_order_audit_suspicious ON order_security_audit(suspicious_activity);

-- Create image optimization queue
CREATE TABLE IF NOT EXISTS image_optimization_queue (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_path TEXT NOT NULL,
    original_size INTEGER NOT NULL,
    current_size INTEGER,
    last_optimized_at TIMESTAMP,
    optimization_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_image_queue_status ON image_optimization_queue(optimization_status);
CREATE INDEX idx_image_queue_user_id ON image_optimization_queue(user_id);

-- Add constraints for order security
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_verification_token ON orders(order_verification_token) WHERE order_verification_token IS NOT NULL;

-- Update existing orders to have verification tokens
UPDATE orders 
SET order_verification_token = md5(random()::text || clock_timestamp()::text)
WHERE order_verification_token IS NULL;
