/**
 * Security Manager
 * Handles security features and threat detection
 */

class SecurityManager {
    constructor() {
        this.threatLevel = 'low';
        this.init();
    }

    init() {
        this.setupSecurityMonitoring();
        this.validateBrowser();
        this.setupCSRFProtection();
    }

    setupSecurityMonitoring() {
        // Monitor for suspicious activity
        this.monitorConsoleAccess();
        this.monitorLocalStorageAccess();
    }

    monitorConsoleAccess() {
        // Log console access attempts (basic detection)
        const originalConsole = window.console;
        let consoleAccessCount = 0;

        setInterval(() => {
            if (consoleAccessCount > 100) {
                console.warn('High console activity detected');
                this.threatLevel = 'medium';
            }
            consoleAccessCount = 0;
        }, 60000);
    }

    monitorLocalStorageAccess() {
        // Basic monitoring
        const storedItems = localStorage.length;
        setInterval(() => {
            if (localStorage.length < storedItems - 5) {
                console.warn('Unusual localStorage activity detected');
            }
        }, 5000);
    }

    validateBrowser() {
        const ua = navigator.userAgent;
        const isSupported = 
            /Chrome/.test(ua) || 
            /Firefox/.test(ua) || 
            /Safari/.test(ua) || 
            /Edge/.test(ua);

        if (!isSupported) {
            console.warn('Browser may not be fully supported');
        }
    }

    setupCSRFProtection() {
        // Generate CSRF token
        if (!localStorage.getItem('csrfToken')) {
            const token = this.generateToken();
            localStorage.setItem('csrfToken', token);
        }
    }

    generateToken() {
        return 'csrf_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    getCSRFToken() {
        return localStorage.getItem('csrfToken') || this.generateToken();
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    validateApiKey(key) {
        // Basic validation
        return key && key.length > 10 && !/[<>"']/.test(key);
    }
}

const securityManager = new SecurityManager();
