/**
 * Core Trading Bot Application Logic
 * Handles bot configuration, risk management, and trading simulation
 */

class TradingBotApp {
    constructor() {
        this.currentConfig = {
            name: '',
            pair: 'BTC/USD',
            balance: 10000,
            tradeAmount: 100,
            stopLoss: 2,
            takeProfit: 4,
            maxDailyLoss: 500,
            maxPositions: 3,
            riskPerTrade: 2,
            riskRewardRatio: 2,
            strategy: 'momentum',
            timeframe: '1h',
            indicators: []
        };
        
        this.isRunning = false;
        this.trades = [];
        this.performance = {
            totalPnL: 0,
            winRate: 0,
            totalTrades: 0,
            wins: 0,
            losses: 0
        };
        
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedConfigs();
        this.updateUI();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('botConfigForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveConfiguration();
            });
        }

        // Save/Load buttons
        document.getElementById('saveConfigBtn')?.addEventListener('click', () => this.saveConfiguration());
        document.getElementById('loadConfigBtn')?.addEventListener('click', () => this.showLoadModal());
        
        // Bot control buttons
        document.getElementById('startBotBtn')?.addEventListener('click', () => this.startBot());
        document.getElementById('stopBotBtn')?.addEventListener('click', () => this.stopBot());
        
        // Risk calculation on input change
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', () => this.calculateRisk());
        });
    }

    loadConfiguration(config) {
        this.currentConfig = { ...this.currentConfig, ...config };
        this.populateForm();
        this.calculateRisk();
    }

    populateForm() {
        Object.keys(this.currentConfig).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = this.currentConfig[key];
            }
        });
    }

    async saveConfiguration() {
        const config = this.getFormData();
        
        // Check subscription limits
        if (!subscriptionManager.canSaveConfigs()) {
            subscriptionManager.showUpgradePrompt('configuration saving');
            return;
        }

        const configData = {
            id: 'cfg_' + Date.now(),
            user_id: authManager.getCurrentUser()?.id,
            name: config.name || 'Untitled Configuration',
            config: config,
            created_at: new Date().toISOString()
        };

        try {
            const result = await dbConnector.saveBotConfig(configData);
            
            if (result.success) {
                this.showNotification('Configuration saved successfully!', 'success');
                subscriptionManager.incrementUsage('bots');
                this.loadSavedConfigs();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Failed to save configuration', 'error');
        }
    }

    async loadSavedConfigs() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        try {
            const configs = await dbConnector.getBotConfigs(user.id);
            this.displaySavedConfigs(configs);
        } catch (error) {
            console.error('Load configs error:', error);
        }
    }

    displaySavedConfigs(configs) {
        const container = document.getElementById('savedConfigsList');
        if (!container) return;

        if (configs.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No saved configurations yet.</p>';
            return;
        }

        container.innerHTML = configs.map(cfg => `
            <div class="bg-gray-50 p-3 rounded border hover:bg-gray-100 cursor-pointer" onclick="app.loadConfiguration(${JSON.stringify(cfg.config).replace(/"/g, '&quot;')})">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-medium text-sm">${cfg.name}</h4>
                        <p class="text-xs text-gray-500">${new Date(cfg.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onclick="event.stopPropagation(); app.deleteConfig('${cfg.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteConfig(id) {
        if (!confirm('Delete this configuration?')) return;

        try {
            await dbConnector.deleteBotConfig(id);
            subscriptionManager.decrementUsage('bots');
            this.showNotification('Configuration deleted', 'success');
            this.loadSavedConfigs();
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Failed to delete configuration', 'error');
        }
    }

    getFormData() {
        const formElements = document.querySelectorAll('[id]');
        const data = {};
        
        formElements.forEach(element => {
            if (element.id && element.value !== undefined) {
                const key = element.id;
                let value = element.value;
                
                // Convert to appropriate type
                if (element.type === 'number') {
                    value = parseFloat(value) || 0;
                } else if (element.type === 'checkbox') {
                    value = element.checked;
                } else if (element.tagName === 'SELECT' && element.multiple) {
                    value = Array.from(element.selectedOptions).map(opt => opt.value);
                }
                
                data[key] = value;
            }
        });
        
        return data;
    }

    calculateRisk() {
        const config = this.getFormData();
        
        // Calculate risk metrics
        const riskAmount = (config.tradeAmount * config.stopLoss) / 100;
        const rewardAmount = (config.tradeAmount * config.takeProfit) / 100;
        const riskRewardRatio = rewardAmount / riskAmount;
        const riskPercentage = (riskAmount / config.balance) * 100;
        
        // Update UI
        this.updateRiskDisplay({
            riskAmount,
            rewardAmount,
            riskRewardRatio,
            riskPercentage
        });
        
        // Show warnings
        this.showRiskWarnings(riskPercentage, riskRewardRatio);
    }

    updateRiskDisplay(metrics) {
        document.getElementById('riskAmount')?.textContent = `$${metrics.riskAmount.toFixed(2)}`;
        document.getElementById('rewardAmount')?.textContent = `$${metrics.rewardAmount.toFixed(2)}`;
        document.getElementById('riskRewardRatio')?.textContent = metrics.riskRewardRatio.toFixed(2);
        document.getElementById('riskPercentage')?.textContent = `${metrics.riskPercentage.toFixed(2)}%`;
    }

    showRiskWarnings(riskPercentage, riskRewardRatio) {
        const warningContainer = document.getElementById('riskWarnings');
        if (!warningContainer) return;

        const warnings = [];
        
        if (riskPercentage > 5) {
            warnings.push({
                level: 'danger',
                message: `High risk: ${riskPercentage.toFixed(2)}% of account per trade`
            });
        }
        
        if (riskRewardRatio < 1.5) {
            warnings.push({
                level: 'warning',
                message: `Poor risk/reward ratio: ${riskRewardRatio.toFixed(2)}:1`
            });
        }
        
        if (warnings.length > 0) {
            warningContainer.innerHTML = warnings.map(w => `
                <div class="bg-${w.level === 'danger' ? 'red' : 'yellow'}-50 border border-${w.level === 'danger' ? 'red' : 'yellow'}-200 text-${w.level === 'danger' ? 'red' : 'yellow'}-800 px-4 py-3 rounded mb-2">
                    <i class="fas fa-exclamation-triangle mr-2"></i>${w.message}
                </div>
            `).join('');
        } else {
            warningContainer.innerHTML = '<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded"><i class="fas fa-check-circle mr-2"></i>Risk parameters look good!</div>';
        }
    }

    startBot() {
        if (this.isRunning) {
            this.showNotification('Bot is already running', 'warning');
            return;
        }

        // Check strategy access
        const strategy = this.currentConfig.strategy;
        if (!subscriptionManager.canUseStrategy(strategy)) {
            subscriptionManager.showUpgradePrompt(`${strategy} strategy`);
            return;
        }

        this.isRunning = true;
        this.showNotification('Bot started (simulation mode)', 'success');
        this.updateBotStatus('running');
        
        // Start simulation
        this.runSimulation();
    }

    stopBot() {
        this.isRunning = false;
        this.showNotification('Bot stopped', 'info');
        this.updateBotStatus('stopped');
    }

    updateBotStatus(status) {
        const statusElement = document.getElementById('botStatus');
        if (!statusElement) return;

        const statusConfig = {
            running: { text: 'Running', color: 'green', icon: 'play-circle' },
            stopped: { text: 'Stopped', color: 'red', icon: 'stop-circle' },
            paused: { text: 'Paused', color: 'yellow', icon: 'pause-circle' }
        };

        const config = statusConfig[status];
        statusElement.innerHTML = `
            <span class="flex items-center">
                <span class="w-2 h-2 bg-${config.color}-500 rounded-full mr-2 animate-pulse"></span>
                <i class="fas fa-${config.icon} mr-1"></i>
                ${config.text}
            </span>
        `;
    }

    runSimulation() {
        if (!this.isRunning) return;

        // Simulate a trade every 5 seconds
        setTimeout(() => {
            this.simulateTrade();
            this.runSimulation();
        }, 5000);
    }

    simulateTrade() {
        const isWin = Math.random() > 0.4; // 60% win rate
        const config = this.getFormData();
        
        const pnl = isWin 
            ? (config.tradeAmount * config.takeProfit) / 100
            : -(config.tradeAmount * config.stopLoss) / 100;

        const trade = {
            id: 'trade_' + Date.now(),
            timestamp: new Date().toISOString(),
            pair: config.pair,
            type: Math.random() > 0.5 ? 'BUY' : 'SELL',
            amount: config.tradeAmount,
            price: this.getSimulatedPrice(config.pair),
            pnl: pnl,
            status: isWin ? 'WIN' : 'LOSS'
        };

        this.trades.push(trade);
        this.updatePerformance();
        this.updateTradesLog();
        this.updateChart();
        
        // Save trade to database
        const user = authManager.getCurrentUser();
        if (user) {
            dbConnector.saveTrade({ ...trade, user_id: user.id });
        }
    }

    getSimulatedPrice(pair) {
        const prices = {
            'BTC/USD': 45000 + (Math.random() * 5000),
            'ETH/USD': 3000 + (Math.random() * 500),
            'EUR/USD': 1.10 + (Math.random() * 0.05),
            'GBP/USD': 1.25 + (Math.random() * 0.05)
        };
        return prices[pair] || 100;
    }

    updatePerformance() {
        this.performance.totalTrades = this.trades.length;
        this.performance.wins = this.trades.filter(t => t.status === 'WIN').length;
        this.performance.losses = this.trades.filter(t => t.status === 'LOSS').length;
        this.performance.totalPnL = this.trades.reduce((sum, t) => sum + t.pnl, 0);
        this.performance.winRate = this.performance.totalTrades > 0 
            ? (this.performance.wins / this.performance.totalTrades) * 100 
            : 0;

        // Update UI
        document.getElementById('totalPnL')?.textContent = `$${this.performance.totalPnL.toFixed(2)}`;
        document.getElementById('winRate')?.textContent = `${this.performance.winRate.toFixed(1)}%`;
        document.getElementById('totalTrades')?.textContent = this.performance.totalTrades;
    }

    updateTradesLog() {
        const container = document.getElementById('tradesLog');
        if (!container) return;

        const recentTrades = this.trades.slice(-10).reverse();
        
        container.innerHTML = recentTrades.map(trade => `
            <tr class="${trade.status === 'WIN' ? 'bg-green-50' : 'bg-red-50'}">
                <td class="px-4 py-2 text-sm">${new Date(trade.timestamp).toLocaleTimeString()}</td>
                <td class="px-4 py-2 text-sm">${trade.pair}</td>
                <td class="px-4 py-2 text-sm">${trade.type}</td>
                <td class="px-4 py-2 text-sm">$${trade.amount}</td>
                <td class="px-4 py-2 text-sm ${trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}">
                    ${trade.pnl > 0 ? '+' : ''}$${trade.pnl.toFixed(2)}
                </td>
                <td class="px-4 py-2 text-sm">
                    <span class="px-2 py-1 rounded text-xs ${trade.status === 'WIN' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">
                        ${trade.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    initializeCharts() {
        const chartCanvas = document.getElementById('performanceChart');
        if (!chartCanvas) return;

        this.charts.performance = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cumulative P&L',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    updateChart() {
        if (!this.charts.performance) return;

        const cumulativePnL = [];
        let sum = 0;
        
        this.trades.forEach(trade => {
            sum += trade.pnl;
            cumulativePnL.push(sum);
        });

        this.charts.performance.data.labels = this.trades.map((_, i) => i + 1);
        this.charts.performance.data.datasets[0].data = cumulativePnL;
        this.charts.performance.update();
    }

    showNotification(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white bg-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-500 z-50 animate-fade-in`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    updateUI() {
        // Update subscription info
        const tier = subscriptionManager.getUserTier();
        const tierInfo = subscriptionManager.getTierInfo(tier);
        const limits = subscriptionManager.getRemainingLimits();
        
        document.getElementById('currentTier')?.textContent = tierInfo.name;
        document.getElementById('remainingBots')?.textContent = limits.bots === Infinity ? '∞' : limits.bots;
        document.getElementById('remainingConnections')?.textContent = limits.apiConnections === Infinity ? '∞' : limits.apiConnections;
        document.getElementById('remainingWallets')?.textContent = limits.wallets === Infinity ? '∞' : limits.wallets;
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TradingBotApp();
});
