/**
 * Authentication & Session Management System
 * Handles user login, registration, guest mode, and session tracking
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours for guest
        this.initializeSession();
    }

    initializeSession() {
        const storedUser = localStorage.getItem('quantumSparkUser');
        const sessionExpiry = localStorage.getItem('sessionExpiry');
        
        if (storedUser && sessionExpiry) {
            const now = Date.now();
            if (now < parseInt(sessionExpiry)) {
                this.currentUser = JSON.parse(storedUser);
                this.startSessionTimer();
                return true;
            } else {
                this.logout();
            }
        }
        return false;
    }

    async register(email, password, name) {
        try {
            // Validate input
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }
            if (password.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }

            // Check if user exists
            const users = this.getUsers();
            if (users.find(u => u.email === email)) {
                throw new Error('Email already registered');
            }

            // Create new user
            const newUser = {
                id: this.generateUserId(),
                email,
                password: this.hashPassword(password),
                name,
                tier: 'free',
                createdAt: new Date().toISOString(),
                isActive: true,
                isAdmin: false,
                settings: {
                    notifications: true,
                    theme: 'light'
                },
                usage: {
                    bots: 0,
                    apiConnections: 0,
                    wallets: 0
                }
            };

            users.push(newUser);
            localStorage.setItem('quantumSparkUsers', JSON.stringify(users));

            // Log in the user
            await this.login(email, password);
            
            return { success: true, user: newUser };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    async login(email, password) {
        try {
            const users = this.getUsers();
            const user = users.find(u => u.email === email);

            if (!user) {
                throw new Error('User not found');
            }

            if (!user.isActive) {
                throw new Error('Account is deactivated. Please contact support.');
            }

            const hashedPassword = this.hashPassword(password);
            if (user.password !== hashedPassword) {
                throw new Error('Invalid password');
            }

            // Set current user
            this.currentUser = user;
            const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
            
            localStorage.setItem('quantumSparkUser', JSON.stringify(user));
            localStorage.setItem('sessionExpiry', expiry.toString());
            localStorage.setItem('loginTimestamp', Date.now().toString());

            this.startSessionTimer();
            this.trackLogin();

            return { success: true, user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    startGuestSession() {
        const guestUser = {
            id: 'guest_' + Date.now(),
            email: 'guest@temporary.com',
            name: 'Guest User',
            tier: 'guest',
            isGuest: true,
            createdAt: new Date().toISOString(),
            isActive: true,
            isAdmin: false,
            usage: {
                bots: 0,
                apiConnections: 0,
                wallets: 0
            }
        };

        this.currentUser = guestUser;
        const expiry = Date.now() + this.sessionTimeout;
        
        localStorage.setItem('quantumSparkUser', JSON.stringify(guestUser));
        localStorage.setItem('sessionExpiry', expiry.toString());
        localStorage.setItem('isGuestSession', 'true');

        this.startSessionTimer();
        return { success: true, user: guestUser };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('quantumSparkUser');
        localStorage.removeItem('sessionExpiry');
        localStorage.removeItem('isGuestSession');
        localStorage.removeItem('loginTimestamp');
        
        if (typeof window !== 'undefined') {
            window.location.href = '/index.html';
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    isGuest() {
        return this.currentUser && this.currentUser.tier === 'guest';
    }

    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin === true;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserTier() {
        return this.currentUser ? this.currentUser.tier : 'guest';
    }

    startSessionTimer() {
        const sessionExpiry = localStorage.getItem('sessionExpiry');
        if (sessionExpiry) {
            const timeRemaining = parseInt(sessionExpiry) - Date.now();
            if (timeRemaining > 0) {
                setTimeout(() => {
                    alert('Your session has expired. Please log in again.');
                    this.logout();
                }, timeRemaining);
            }
        }
    }

    trackLogin() {
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        loginHistory.push({
            userId: this.currentUser.id,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    hashPassword(password) {
        // Simple hash for demo - use bcrypt in production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    generateUserId() {
        return 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUsers() {
        const users = localStorage.getItem('quantumSparkUsers');
        return users ? JSON.parse(users) : this.initializeDefaultUsers();
    }

    initializeDefaultUsers() {
        const defaultUsers = [
            {
                id: 'usr_admin_001',
                email: 'admin@quantumsparkbot.com',
                password: this.hashPassword('admin123'),
                name: 'Admin User',
                tier: 'enterprise',
                createdAt: new Date().toISOString(),
                isActive: true,
                isAdmin: true,
                usage: { bots: 0, apiConnections: 0, wallets: 0 }
            }
        ];
        localStorage.setItem('quantumSparkUsers', JSON.stringify(defaultUsers));
        return defaultUsers;
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            localStorage.setItem('quantumSparkUsers', JSON.stringify(users));
            
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = users[userIndex];
                localStorage.setItem('quantumSparkUser', JSON.stringify(this.currentUser));
            }
            
            return { success: true, user: users[userIndex] };
        }
        
        return { success: false, error: 'User not found' };
    }

    upgradeTier(tier) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        const validTiers = ['free', 'pro', 'enterprise'];
        if (!validTiers.includes(tier)) {
            return { success: false, error: 'Invalid tier' };
        }

        return this.updateUser(this.currentUser.id, { tier });
    }
}

// Global instance
const authManager = new AuthManager();
