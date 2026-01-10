/**
 * API Integration Manager
 * Handles trading platform connections and wallet management
 */

class APIIntegrationManager {
    constructor() {
        this.platforms = {
            coinbase: {
                name: 'Coinbase Pro',
                fields: ['apiKey', 'apiSecret', 'passphrase'],
                testEndpoint: 'https://api.pro.coinbase.com',
                status: 'disconnected'
            },
            binance: {
                name: 'Binance',
                fields: ['apiKey', 'apiSecret'],
                testEndpoint: 'https://api.binance.com',
                status: 'disconnected'
            },
            kraken: {
                name: 'Kraken',
                fields: ['apiKey', 'privateKey'],
                testEndpoint: 'https://api.kraken.com',
                status: 'disconnected'
            },
            tradingview: {
                name: 'TradingView',
                fields: ['webhookUrl', 'secret'],
                testEndpoint: null,
                status: 'disconnected'
            },
            robinhood: {
                name: 'Robinhood',
                fields: ['username', 'password'],
                testEndpoint: null,
                status: 'disconnected',
                warning: 'Unofficial API - Use at your own risk'
            }
        };
        
        this.walletNetworks = {
            bitcoin: { name: 'Bitcoin', symbol: 'BTC', addressPattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/ },
            ethereum: { name: 'Ethereum', symbol: 'ETH', addressPattern: /^0x[a-fA-F0-9]{40}$/ },
            bnb: { name: 'Binance Smart Chain', symbol: 'BNB', addressPattern: /^0x[a-fA-F0-9]{40}$/ },
            cardano: { name: 'Cardano', symbol: 'ADA', addressPattern: /^addr1[a-z0-9]+$/ },
            solana: { name: 'Solana', symbol: 'SOL', addressPattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
            polygon: { name: 'Polygon', symbol: 'MATIC', addressPattern: /^0x[a-fA-F0-9]{40}$/ }
        };
        
        this.init();
    }

    init() {
        this.loadConnections();
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Platform connection buttons
        document.querySelectorAll('[data-platform]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.target.getAttribute('data-platform');
                this.showConnectionModal(platform);
            });
        });

        // Wallet addition
        document.getElementById('addWalletBtn')?.addEventListener('click', () => this.showAddWalletModal());
    }

    async connectPlatform(platform, credentials) {
        // Check subscription limits
        if (!subscriptionManager.canAddApiConnection()) {
            subscriptionManager.showUpgradePrompt('more API connections');
            return { success: false, error: 'Subscription limit reached' };
        }

        try {
            // Validate credentials
            const platformConfig = this.platforms[platform];
            const missingFields = platformConfig.fields.filter(field => !credentials[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Test connection (mock for now)
            const testResult = await this.testConnection(platform, credentials);
            
            if (!testResult.success) {
                throw new Error('Connection test failed');
            }

            // Save connection
            const connection = {
                id: 'conn_' + Date.now(),
                user_id: authManager.getCurrentUser()?.id,
                platform: platform,
                credentials: this.encryptCredentials(credentials),
                status: 'connected',
                created_at: new Date().toISOString()
            };

            await dbConnector.saveApiConnection(connection);
            subscriptionManager.incrementUsage('apiConnections');
            
            this.platforms[platform].status = 'connected';
            this.updateUI();
            
            return { success: true, message: 'Successfully connected to ' + platformConfig.name };
        } catch (error) {
            console.error('Connection error:', error);
            return { success: false, error: error.message };
        }
    }

    async testConnection(platform, credentials) {
        // Mock connection test - returns success after delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        accountId: 'mock_' + Math.random().toString(36).substr(2, 9),
                        balance: Math.random() * 10000,
                        currency: 'USD'
                    }
                });
            }, 1000);
        });
    }

    async loadConnections() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        try {
            const connections = await dbConnector.getApiConnections(user.id);
            
            connections.forEach(conn => {
                if (this.platforms[conn.platform]) {
                    this.platforms[conn.platform].status = conn.status;
                }
            });
            
            this.updateUI();
        } catch (error) {
            console.error('Load connections error:', error);
        }
    }

    async disconnectPlatform(platform) {
        if (!confirm(`Disconnect from ${this.platforms[platform].name}?`)) return;

        try {
            this.platforms[platform].status = 'disconnected';
            subscriptionManager.decrementUsage('apiConnections');
            this.updateUI();
            
            return { success: true };
        } catch (error) {
            console.error('Disconnect error:', error);
            return { success: false, error: error.message };
        }
    }

    async addWallet(network, address, label) {
        // Check subscription limits
        if (!subscriptionManager.canAddWallet()) {
            subscriptionManager.showUpgradePrompt('more wallet tracking');
            return { success: false, error: 'Subscription limit reached' };
        }

        try {
            // Validate address
            const networkConfig = this.walletNetworks[network];
            if (!networkConfig) {
                throw new Error('Unsupported network');
            }

            if (!networkConfig.addressPattern.test(address)) {
                throw new Error('Invalid wallet address format');
            }

            // Save wallet
            const wallet = {
                id: 'wallet_' + Date.now(),
                user_id: authManager.getCurrentUser()?.id,
                network: network,
                address: address,
                label: label || `${networkConfig.name} Wallet`,
                balance: 0,
                created_at: new Date().toISOString()
            };

            await dbConnector.saveWallet(wallet);
            subscriptionManager.incrementUsage('wallets');
            
            // Fetch balance (mock for now)
            this.updateWalletBalance(wallet.id, network, address);
            
            return { success: true, wallet };
        } catch (error) {
            console.error('Add wallet error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateWalletBalance(walletId, network, address) {
        // Mock balance fetching
        const mockBalance = Math.random() * 10;
        
        // In production, you would call actual blockchain APIs here
        // Example for Bitcoin: https://blockchain.info/q/addressbalance/{address}
        // Example for Ethereum: use Web3.js or Ethers.js
        
        return mockBalance;
    }

    async loadWallets() {
        const user = authManager.getCurrentUser();
        if (!user) return [];

        try {
            const wallets = await dbConnector.getWallets(user.id);
            this.displayWallets(wallets);
            return wallets;
        } catch (error) {
            console.error('Load wallets error:', error);
            return [];
        }
    }

    displayWallets(wallets) {
        const container = document.getElementById('walletsList');
        if (!container) return;

        if (wallets.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No wallets added yet</p>';
            return;
        }

        container.innerHTML = wallets.map(wallet => {
            const network = this.walletNetworks[wallet.network];
            return `
                <div class="bg-white p-4 rounded-lg shadow border">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <i class="fab fa-${wallet.network} text-2xl mr-3"></i>
                            <div>
                                <h4 class="font-medium">${wallet.label}</h4>
                                <p class="text-xs text-gray-500">${network.name}</p>
                            </div>
                        </div>
                        <button onclick="apiIntegration.removeWallet('${wallet.id}')" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                        ${wallet.address}
                    </div>
                    <div class="mt-2 flex justify-between items-center">
                        <span class="text-sm text-gray-600">Balance:</span>
                        <span class="font-bold">${wallet.balance || 0} ${network.symbol}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async removeWallet(walletId) {
        if (!confirm('Remove this wallet?')) return;

        try {
            await dbConnector.query('DELETE FROM Wallets', [walletId]);
            subscriptionManager.decrementUsage('wallets');
            await this.loadWallets();
        } catch (error) {
            console.error('Remove wallet error:', error);
        }
    }

    updateUI() {
        // Update platform connection status
        Object.keys(this.platforms).forEach(platform => {
            const statusElement = document.getElementById(`${platform}Status`);
            if (statusElement) {
                const isConnected = this.platforms[platform].status === 'connected';
                statusElement.className = `px-3 py-1 rounded-full text-xs font-medium ${
                    isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`;
                statusElement.textContent = isConnected ? 'Connected' : 'Not Connected';
            }
        });

        // Update connection counts
        const limits = subscriptionManager.getRemainingLimits();
        document.getElementById('apiConnectionsCount')?.textContent = 
            `${limits.apiConnections === Infinity ? '∞' : limits.apiConnections} remaining`;
    }

    showConnectionModal(platform) {
        const platformConfig = this.platforms[platform];
        
        // Create modal HTML
        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="connectionModal">
                <div class="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 class="text-xl font-bold mb-4">Connect to ${platformConfig.name}</h3>
                    ${platformConfig.warning ? `<div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4"><i class="fas fa-exclamation-triangle mr-2"></i>${platformConfig.warning}</div>` : ''}
                    <form id="connectionForm">
                        ${platformConfig.fields.map(field => `
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">${field}</label>
                                <input type="${field.includes('password') || field.includes('secret') ? 'password' : 'text'}" 
                                       name="${field}" 
                                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                                       required>
                            </div>
                        `).join('')}
                        <div class="flex space-x-3">
                            <button type="submit" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                Connect
                            </button>
                            <button type="button" onclick="document.getElementById('connectionModal').remove()" 
                                    class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Handle form submission
        document.getElementById('connectionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const credentials = {};
            formData.forEach((value, key) => credentials[key] = value);
            
            const result = await this.connectPlatform(platform, credentials);
            
            if (result.success) {
                alert(result.message);
                document.getElementById('connectionModal').remove();
            } else {
                alert('Connection failed: ' + result.error);
            }
        });
    }

    showAddWalletModal() {
        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="walletModal">
                <div class="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 class="text-xl font-bold mb-4">Add Wallet</h3>
                    <form id="walletForm">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Network</label>
                            <select name="network" class="w-full px-3 py-2 border rounded-lg" required>
                                ${Object.entries(this.walletNetworks).map(([key, net]) => 
                                    `<option value="${key}">${net.name} (${net.symbol})</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                            <input type="text" name="address" class="w-full px-3 py-2 border rounded-lg" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
                            <input type="text" name="label" class="w-full px-3 py-2 border rounded-lg">
                        </div>
                        <div class="flex space-x-3">
                            <button type="submit" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                Add Wallet
                            </button>
                            <button type="button" onclick="document.getElementById('walletModal').remove()" 
                                    class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('walletForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const result = await this.addWallet(
                formData.get('network'),
                formData.get('address'),
                formData.get('label')
            );
            
            if (result.success) {
                alert('Wallet added successfully!');
                document.getElementById('walletModal').remove();
                this.loadWallets();
            } else {
                alert('Failed to add wallet: ' + result.error);
            }
        });
    }

    encryptCredentials(credentials) {
        // In production, use proper encryption
        // For now, just store as JSON
        return JSON.stringify(credentials);
    }

    decryptCredentials(encrypted) {
        return JSON.parse(encrypted);
    }
}

// Global instance
const apiIntegration = new APIIntegrationManager();
