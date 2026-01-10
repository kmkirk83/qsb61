/**
 * Database Connector - Abstraction Layer
 * Handles both LocalStorage (development) and Cloudflare D1 (production)
 */

class DatabaseConnector {
    constructor() {
        this.mode = this.detectEnvironment();
        this.initializeDatabase();
    }

    detectEnvironment() {
        // Check if we're running in production with D1 backend
        const isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
        return isProduction ? 'cloudflare' : 'local';
    }

    initializeDatabase() {
        if (this.mode === 'local') {
            this.initializeLocalStorage();
        }
    }

    initializeLocalStorage() {
        const requiredKeys = [
            'quantumSparkUsers',
            'quantumSparkBotConfigs',
            'quantumSparkApiConnections',
            'quantumSparkWallets',
            'quantumSparkTrades',
            'quantumSparkSubscriptions'
        ];

        requiredKeys.forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });
    }

    async query(sql, params = []) {
        if (this.mode === 'local') {
            return this.queryLocal(sql, params);
        } else {
            return this.queryCloudflare(sql, params);
        }
    }

    queryLocal(sql, params) {
        // Simple SQL-like operations for localStorage
        const operation = sql.trim().split(' ')[0].toUpperCase();
        
        try {
            switch (operation) {
                case 'SELECT':
                    return this.selectLocal(sql, params);
                case 'INSERT':
                    return this.insertLocal(sql, params);
                case 'UPDATE':
                    return this.updateLocal(sql, params);
                case 'DELETE':
                    return this.deleteLocal(sql, params);
                default:
                    throw new Error('Unsupported operation');
            }
        } catch (error) {
            console.error('Database query error:', error);
            return { success: false, error: error.message };
        }
    }

    selectLocal(sql, params) {
        // Parse table name from SQL
        const tableMatch = sql.match(/FROM\s+(\w+)/i);
        if (!tableMatch) return { success: false, error: 'Invalid SELECT query' };
        
        const table = tableMatch[1];
        const data = this.getTable(table);
        
        return { success: true, results: data };
    }

    insertLocal(sql, params) {
        const tableMatch = sql.match(/INTO\s+(\w+)/i);
        if (!tableMatch) return { success: false, error: 'Invalid INSERT query' };
        
        const table = tableMatch[1];
        const data = this.getTable(table);
        
        const newRecord = params[0] || {};
        newRecord.id = newRecord.id || this.generateId();
        newRecord.created_at = newRecord.created_at || new Date().toISOString();
        
        data.push(newRecord);
        this.saveTable(table, data);
        
        return { success: true, id: newRecord.id, record: newRecord };
    }

    updateLocal(sql, params) {
        const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
        if (!tableMatch) return { success: false, error: 'Invalid UPDATE query' };
        
        const table = tableMatch[1];
        const data = this.getTable(table);
        
        const updates = params[0] || {};
        const id = params[1];
        
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
            this.saveTable(table, data);
            return { success: true, record: data[index] };
        }
        
        return { success: false, error: 'Record not found' };
    }

    deleteLocal(sql, params) {
        const tableMatch = sql.match(/FROM\s+(\w+)/i);
        if (!tableMatch) return { success: false, error: 'Invalid DELETE query' };
        
        const table = tableMatch[1];
        const data = this.getTable(table);
        
        const id = params[0];
        const filteredData = data.filter(item => item.id !== id);
        
        if (filteredData.length < data.length) {
            this.saveTable(table, filteredData);
            return { success: true };
        }
        
        return { success: false, error: 'Record not found' };
    }

    async queryCloudflare(sql, params) {
        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ sql, params })
            });

            if (!response.ok) {
                throw new Error('Database query failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Cloudflare query error:', error);
            return { success: false, error: error.message };
        }
    }

    getTable(table) {
        const storageKey = `quantumSpark${table.charAt(0).toUpperCase() + table.slice(1)}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : [];
    }

    saveTable(table, data) {
        const storageKey = `quantumSpark${table.charAt(0).toUpperCase() + table.slice(1)}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getAuthToken() {
        const user = localStorage.getItem('quantumSparkUser');
        if (user) {
            const userData = JSON.parse(user);
            return userData.token || '';
        }
        return '';
    }

    // Convenience methods
    async getBotConfigs(userId) {
        const result = await this.query('SELECT * FROM BotConfigs');
        if (result.success && userId) {
            return result.results.filter(config => config.user_id === userId);
        }
        return result.results || [];
    }

    async saveBotConfig(config) {
        return await this.query('INSERT INTO BotConfigs', [config]);
    }

    async updateBotConfig(id, updates) {
        return await this.query('UPDATE BotConfigs', [updates, id]);
    }

    async deleteBotConfig(id) {
        return await this.query('DELETE FROM BotConfigs', [id]);
    }

    async getApiConnections(userId) {
        const result = await this.query('SELECT * FROM ApiConnections');
        if (result.success && userId) {
            return result.results.filter(conn => conn.user_id === userId);
        }
        return result.results || [];
    }

    async saveApiConnection(connection) {
        return await this.query('INSERT INTO ApiConnections', [connection]);
    }

    async getWallets(userId) {
        const result = await this.query('SELECT * FROM Wallets');
        if (result.success && userId) {
            return result.results.filter(wallet => wallet.user_id === userId);
        }
        return result.results || [];
    }

    async saveWallet(wallet) {
        return await this.query('INSERT INTO Wallets', [wallet]);
    }

    async getTrades(userId, limit = 100) {
        const result = await this.query('SELECT * FROM Trades');
        if (result.success && userId) {
            return result.results
                .filter(trade => trade.user_id === userId)
                .slice(-limit);
        }
        return result.results || [];
    }

    async saveTrade(trade) {
        return await this.query('INSERT INTO Trades', [trade]);
    }
}

// Global instance
const dbConnector = new DatabaseConnector();
