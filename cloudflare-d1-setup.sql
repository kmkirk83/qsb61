-- Quantum Spark Bot™ - Cloudflare D1 Database Schema
-- © 2024 All Rights Reserved. Proprietary Database Design.

-- ================================
-- USERS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('guest', 'free', 'pro', 'enterprise')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'expired')),
    subscription_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    subscription_end DATETIME NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_guest BOOLEAN DEFAULT FALSE,
    features_used TEXT DEFAULT '{}', -- JSON object
    last_login DATETIME,
    login_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_data TEXT DEFAULT '{}' -- JSON for additional profile info
);

-- ================================
-- SUBSCRIPTION PLANS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
    features TEXT NOT NULL DEFAULT '{}', -- JSON object with feature limits
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- BOT CONFIGURATIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS bot_configurations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    configuration TEXT NOT NULL, -- JSON object with bot settings
    is_active BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT DEFAULT '[]', -- JSON array of tags
    performance_data TEXT DEFAULT '{}', -- JSON object with performance metrics
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    use_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- API CREDENTIALS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS api_credentials (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL, -- coinbase, binance, kraken, etc.
    display_name TEXT,
    credentials TEXT NOT NULL, -- Encrypted JSON object
    is_active BOOLEAN DEFAULT TRUE,
    last_tested DATETIME,
    test_status TEXT DEFAULT 'untested' CHECK (test_status IN ('untested', 'success', 'failed', 'expired')),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, platform)
);

-- ================================
-- WALLET ADDRESSES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS wallet_addresses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    blockchain TEXT NOT NULL, -- bitcoin, ethereum, etc.
    address TEXT NOT NULL,
    label TEXT,
    balance DECIMAL(20,8) DEFAULT 0,
    balance_usd DECIMAL(12,2) DEFAULT 0,
    last_balance_update DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TRADING SESSIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS trading_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    bot_config_id TEXT NOT NULL,
    session_name TEXT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'completed')),
    initial_balance DECIMAL(12,2),
    current_balance DECIMAL(12,2),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(12,2) DEFAULT 0,
    max_drawdown DECIMAL(5,2) DEFAULT 0,
    session_data TEXT DEFAULT '{}', -- JSON object with detailed session info
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bot_config_id) REFERENCES bot_configurations(id) ON DELETE CASCADE
);

-- ================================
-- TRADE HISTORY TABLE
-- ================================
CREATE TABLE IF NOT EXISTS trade_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL, -- BTC/USD, ETH/USD, etc.
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20,8) NOT NULL,
    entry_price DECIMAL(12,4) NOT NULL,
    exit_price DECIMAL(12,4),
    stop_loss DECIMAL(12,4),
    take_profit DECIMAL(12,4),
    pnl DECIMAL(12,2) DEFAULT 0,
    pnl_percentage DECIMAL(5,2) DEFAULT 0,
    fees DECIMAL(12,4) DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    open_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    close_time DATETIME,
    trade_data TEXT DEFAULT '{}', -- JSON object with additional trade info
    FOREIGN KEY (session_id) REFERENCES trading_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- USER SESSIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_guest BOOLEAN DEFAULT FALSE,
    expires_at DATETIME NOT NULL,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- AUDIT LOGS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_values TEXT, -- JSON object
    new_values TEXT, -- JSON object
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- SYSTEM SETTINGS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);

-- ================================
-- NOTIFICATIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    type TEXT NOT NULL, -- system, subscription, trade, security
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT DEFAULT '{}', -- JSON object
    is_read BOOLEAN DEFAULT FALSE,
    is_global BOOLEAN DEFAULT FALSE, -- For system-wide notifications
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_bot_configs_user ON bot_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_configs_active ON bot_configurations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bot_configs_created ON bot_configurations(created_at);

CREATE INDEX IF NOT EXISTS idx_api_creds_user ON api_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_api_creds_platform ON api_credentials(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallet_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_blockchain ON wallet_addresses(blockchain);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_bot ON trading_sessions(bot_config_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON trading_sessions(status);

CREATE INDEX IF NOT EXISTS idx_trades_session ON trade_history(session_id);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trade_history(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_time ON trade_history(open_time);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_global ON notifications(is_global, created_at);

-- ================================
-- INSERT DEFAULT DATA
-- ================================

-- Insert default subscription plans
INSERT OR IGNORE INTO subscription_plans (name, display_name, description, price, features, sort_order) VALUES
('guest', 'Guest Access', 'Temporary demo access with limited features', 0.00, 
'{"max_bots": 0, "api_connections": 0, "wallets": 0, "strategies": 1, "advanced_analytics": false, "save_configurations": false, "session_duration": 7200}', 0),

('free', 'Free Plan', 'Basic features for individual traders', 0.00,
'{"max_bots": 1, "api_connections": 1, "wallets": 2, "strategies": 2, "advanced_analytics": false, "support": "community"}', 1),

('pro', 'Pro Plan', 'Advanced features for serious traders', 29.99,
'{"max_bots": 5, "api_connections": 5, "wallets": 10, "strategies": 10, "advanced_analytics": true, "support": "email"}', 2),

('enterprise', 'Enterprise Plan', 'Unlimited access for professional teams', 99.99,
'{"max_bots": -1, "api_connections": -1, "wallets": -1, "strategies": -1, "advanced_analytics": true, "support": "priority"}', 3);

-- Insert system admin user
INSERT OR IGNORE INTO users (
    id, username, email, password_hash, subscription_tier, subscription_status,
    subscription_start, subscription_end, is_admin, features_used, created_at
) VALUES (
    'admin-user-id', 'admin', 'admin@tradingbotmanager.com', 
    'admin_lollipop123_hash', 'enterprise', 'active',
    datetime('now'), datetime('now', '+10 years'), 1, '{}', datetime('now')
);

-- Insert demo users
INSERT OR IGNORE INTO users (
    username, email, password_hash, subscription_tier, subscription_status,
    subscription_start, subscription_end, is_admin, features_used
) VALUES 
('john_trader', 'john@example.com', 'demo123_hash', 'pro', 'trial',
 datetime('now'), datetime('now', '+30 days'), 0, '{"bots_created": 3, "api_connections": 2}'),

('sarah_crypto', 'sarah@example.com', 'demo123_hash', 'free', 'active',
 datetime('now'), datetime('now', '+1 year'), 0, '{"bots_created": 1, "api_connections": 1}'),

('mike_investor', 'mike@example.com', 'demo123_hash', 'enterprise', 'trial',
 datetime('now'), datetime('now', '+14 days'), 0, '{"bots_created": 2, "api_connections": 3}');

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (key, value, description, is_public) VALUES
('app_name', 'Quantum Spark Bot™', 'Application name', 1),
('app_version', '1.0.0', 'Current application version', 1),
('maintenance_mode', 'false', 'Enable maintenance mode', 0),
('registration_enabled', 'true', 'Allow new user registrations', 0),
('guest_access_enabled', 'true', 'Allow guest access', 0),
('max_guest_session_duration', '7200', 'Guest session duration in seconds', 0),
('email_verification_required', 'false', 'Require email verification for new accounts', 0),
('copyright_year', '2024', 'Copyright year', 1),
('copyright_owner', 'Trading Bot Manager Platform', 'Copyright owner', 1);

-- ================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================

-- Update timestamp trigger for users
CREATE TRIGGER IF NOT EXISTS users_updated_at 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for bot_configurations
CREATE TRIGGER IF NOT EXISTS bot_configs_updated_at 
    AFTER UPDATE ON bot_configurations
BEGIN
    UPDATE bot_configurations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for api_credentials
CREATE TRIGGER IF NOT EXISTS api_creds_updated_at 
    AFTER UPDATE ON api_credentials
BEGIN
    UPDATE api_credentials SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for wallet_addresses
CREATE TRIGGER IF NOT EXISTS wallets_updated_at 
    AFTER UPDATE ON wallet_addresses
BEGIN
    UPDATE wallet_addresses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for trading_sessions
CREATE TRIGGER IF NOT EXISTS sessions_updated_at 
    AFTER UPDATE ON trading_sessions
BEGIN
    UPDATE trading_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Audit log trigger for user changes
CREATE TRIGGER IF NOT EXISTS audit_users_update 
    AFTER UPDATE ON users
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
    VALUES (NEW.id, 'UPDATE', 'user', NEW.id, 
            json_object('subscription_tier', OLD.subscription_tier, 'subscription_status', OLD.subscription_status),
            json_object('subscription_tier', NEW.subscription_tier, 'subscription_status', NEW.subscription_status));
END;

-- ================================
-- VIEWS FOR COMMON QUERIES
-- ================================

-- User subscription details view
CREATE VIEW IF NOT EXISTS user_subscription_details AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.subscription_tier,
    u.subscription_status,
    u.subscription_start,
    u.subscription_end,
    sp.display_name as plan_name,
    sp.price as plan_price,
    sp.features as plan_features,
    u.is_admin,
    u.created_at,
    u.last_login,
    CASE 
        WHEN u.subscription_end < datetime('now') THEN 1 
        ELSE 0 
    END as is_expired
FROM users u
LEFT JOIN subscription_plans sp ON u.subscription_tier = sp.name;

-- Active trading sessions view
CREATE VIEW IF NOT EXISTS active_trading_sessions AS
SELECT 
    ts.*,
    u.username,
    bc.name as bot_name,
    bc.configuration as bot_config
FROM trading_sessions ts
JOIN users u ON ts.user_id = u.id
JOIN bot_configurations bc ON ts.bot_config_id = bc.id
WHERE ts.status = 'active';

-- User analytics view
CREATE VIEW IF NOT EXISTS user_analytics AS
SELECT 
    u.id,
    u.username,
    u.subscription_tier,
    COUNT(DISTINCT bc.id) as total_bots,
    COUNT(DISTINCT ac.id) as total_api_connections,
    COUNT(DISTINCT wa.id) as total_wallets,
    COUNT(DISTINCT ts.id) as total_sessions,
    COALESCE(SUM(ts.total_pnl), 0) as lifetime_pnl,
    u.created_at,
    u.last_login
FROM users u
LEFT JOIN bot_configurations bc ON u.id = bc.user_id AND bc.is_active = 1
LEFT JOIN api_credentials ac ON u.id = ac.user_id AND ac.is_active = 1
LEFT JOIN wallet_addresses wa ON u.id = wa.user_id AND wa.is_active = 1
LEFT JOIN trading_sessions ts ON u.id = ts.user_id
GROUP BY u.id, u.username, u.subscription_tier, u.created_at, u.last_login;

-- ================================
-- SECURITY & CLEANUP PROCEDURES
-- ================================

-- Note: These would be implemented as Cloudflare Workers scheduled tasks

-- Clean up expired guest sessions
-- DELETE FROM user_sessions WHERE is_guest = 1 AND expires_at < datetime('now');

-- Clean up expired notifications
-- DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < datetime('now');

-- Clean up old audit logs (keep 1 year)
-- DELETE FROM audit_logs WHERE timestamp < datetime('now', '-1 year');

-- Archive old trading sessions
-- UPDATE trading_sessions SET status = 'archived' WHERE end_time < datetime('now', '-6 months') AND status != 'archived';

-- ================================
-- END OF SCHEMA
-- ================================