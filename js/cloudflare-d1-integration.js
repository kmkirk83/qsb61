/**
 * Cloudflare D1 Integration Layer
 * Provides abstraction for D1 database operations
 */

class CloudflareD1Integration {
    constructor() {
        this.apiBase = this.getApiBase();
        this.initialized = false;
    }

    getApiBase() {
        // In production, this would point to your Cloudflare Workers endpoint
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return '/api'; // Local fallback
        }
        return 'https://your-worker.workers.dev/api'; // Replace with actual worker URL
    }

    async initialize() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            this.initialized = response.ok;
            return this.initialized;
        } catch (error) {
            console.warn('D1 backend not available, using local storage');
            this.initialized = false;
            return false;
        }
    }

    async executeQuery(query, params = []) {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!this.initialized) {
            // Fallback to local database connector
            return dbConnector.query(query, params);
        }

        try {
            const response = await fetch(`${this.apiBase}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader()
                },
                body: JSON.stringify({ query, params })
            });

            if (!response.ok) {
                throw new Error(`Query failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('D1 query error:', error);
            // Fallback to local storage
            return dbConnector.query(query, params);
        }
    }

    async authenticate(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('d1AuthToken', data.token);
            }
            return data;
        } catch (error) {
            console.error('D1 authentication error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('D1 registration error:', error);
            throw error;
        }
    }

    getAuthHeader() {
        const token = localStorage.getItem('d1AuthToken');
        return token ? `Bearer ${token}` : '';
    }

    async getUserData(userId) {
        return this.executeQuery(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
    }

    async updateUserData(userId, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        
        return this.executeQuery(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            [...values, userId]
        );
    }

    async saveBotConfig(config) {
        return this.executeQuery(
            `INSERT INTO bot_configs (id, user_id, name, config, created_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                config.id || this.generateId(),
                config.user_id,
                config.name,
                JSON.stringify(config.config),
                new Date().toISOString()
            ]
        );
    }

    async getBotConfigs(userId) {
        const result = await this.executeQuery(
            'SELECT * FROM bot_configs WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        if (result.success && result.results) {
            return result.results.map(config => ({
                ...config,
                config: typeof config.config === 'string' ? JSON.parse(config.config) : config.config
            }));
        }
        return [];
    }

    async getAnalytics() {
        return this.executeQuery(
            `SELECT 
                COUNT(DISTINCT user_id) as total_users,
                COUNT(*) as total_configs,
                SUM(CASE WHEN tier = 'free' THEN 1 ELSE 0 END) as free_users,
                SUM(CASE WHEN tier = 'pro' THEN 1 ELSE 0 END) as pro_users,
                SUM(CASE WHEN tier = 'enterprise' THEN 1 ELSE 0 END) as enterprise_users
             FROM users`
        );
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Global instance
const d1Integration = new CloudflareD1Integration();
