/**
 * Production Core System
 * Main production features and system initialization
 */

class ProductionCore {
    constructor() {
        this.version = '1.0.0';
        this.environment = this.detectEnvironment();
        this.init();
    }

    detectEnvironment() {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }
        return 'production';
    }

    init() {
        console.log(`Quantum Spark Bot v${this.version} - ${this.environment}`);
        this.initializeServices();
        this.setupGlobalHandlers();
        this.checkSystemHealth();
    }

    initializeServices() {
        // Initialize all core services
        if (typeof authManager !== 'undefined') {
            console.log('✓ Auth Manager initialized');
        }
        if (typeof dbConnector !== 'undefined') {
            console.log('✓ Database Connector initialized');
        }
        if (typeof subscriptionManager !== 'undefined') {
            console.log('✓ Subscription Manager initialized');
        }
        if (typeof paymentProcessor !== 'undefined') {
            console.log('✓ Payment Processor initialized');
        }
    }

    setupGlobalHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.logError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError(event.reason);
        });

        // Network status monitoring
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    handleOnline() {
        console.log('✓ Network connection restored');
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.innerHTML = '<span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Connected';
        }
    }

    handleOffline() {
        console.warn('⚠ Network connection lost');
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.innerHTML = '<span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>Offline';
        }
    }

    async checkSystemHealth() {
        const health = {
            auth: typeof authManager !== 'undefined',
            database: typeof dbConnector !== 'undefined',
            subscription: typeof subscriptionManager !== 'undefined',
            payment: typeof paymentProcessor !== 'undefined'
        };

        console.log('System Health Check:', health);
        return health;
    }

    logError(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: error.message || error,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Store in localStorage for debugging
        const errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
        errors.push(errorLog);
        // Keep only last 50 errors
        if (errors.length > 50) errors.shift();
        localStorage.setItem('errorLog', JSON.stringify(errors));
    }
}

// Initialize on load
const productionCore = new ProductionCore();
