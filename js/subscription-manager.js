/**
 * Subscription Manager
 * Handles tier-based access control and feature limits
 */

class SubscriptionManager {
    constructor() {
        this.tiers = {
            guest: {
                name: 'Guest',
                price: 0,
                features: {
                    bots: 0,
                    apiConnections: 0,
                    wallets: 0,
                    strategies: ['momentum'],
                    analytics: false,
                    saveConfigs: false,
                    advancedRisk: false,
                    support: 'none'
                },
                duration: '2 hours',
                canSave: false
            },
            free: {
                name: 'Free',
                price: 0,
                features: {
                    bots: 1,
                    apiConnections: 1,
                    wallets: 2,
                    strategies: ['momentum', 'mean-reversion'],
                    analytics: false,
                    saveConfigs: true,
                    advancedRisk: false,
                    support: 'community'
                },
                canSave: true
            },
            pro: {
                name: 'Pro',
                price: 29.99,
                features: {
                    bots: 5,
                    apiConnections: 5,
                    wallets: 10,
                    strategies: ['momentum', 'mean-reversion', 'breakout', 'scalping'],
                    analytics: true,
                    saveConfigs: true,
                    advancedRisk: true,
                    support: 'email'
                },
                canSave: true
            },
            enterprise: {
                name: 'Enterprise',
                price: 99.99,
                features: {
                    bots: Infinity,
                    apiConnections: Infinity,
                    wallets: Infinity,
                    strategies: ['momentum', 'mean-reversion', 'breakout', 'scalping', 'arbitrage', 'grid'],
                    analytics: true,
                    saveConfigs: true,
                    advancedRisk: true,
                    support: 'priority'
                },
                canSave: true
            }
        };
    }

    getTierInfo(tierName) {
        return this.tiers[tierName] || this.tiers.guest;
    }

    getUserTier() {
        if (authManager.isAuthenticated()) {
            return authManager.getUserTier();
        }
        return 'guest';
    }

    canCreateBot() {
        const tier = this.getUserTier();
        const tierInfo = this.getTierInfo(tier);
        const currentUser = authManager.getCurrentUser();
        
        if (!currentUser) return false;
        
        const currentBots = currentUser.usage?.bots || 0;
        return currentBots < tierInfo.features.bots;
    }

    canAddApiConnection() {
        const tier = this.getUserTier();
        const tierInfo = this.getTierInfo(tier);
        const currentUser = authManager.getCurrentUser();
        
        if (!currentUser) return false;
        
        const currentConnections = currentUser.usage?.apiConnections || 0;
        return currentConnections < tierInfo.features.apiConnections;
    }

    canAddWallet() {
        const tier = this.getUserTier();
        const tierInfo = this.getTierInfo(tier);
        const currentUser = authManager.getCurrentUser();
        
        if (!currentUser) return false;
        
        const currentWallets = currentUser.usage?.wallets || 0;
        return currentWallets < tierInfo.features.wallets;
    }

    canUseStrategy(strategy) {
        const tier = this.getUserTier();
        const tierInfo = this.getTierInfo(tier);
        return tierInfo.features.strategies.includes(strategy.toLowerCase());
    }

    hasAnalyticsAccess() {
        const tier = this.getUserTier();
        const tierInfo = this.getTierInfo(tier);
        return tierInfo.features.analytics;
    }

    canSaveConfigs() {
        const tier = this.getUserTier();
        const tierInfo = this.getTierInfo(tier);
        return tierInfo.canSave;
    }

    getFeatureLimits() {
        const tier = this.getUserTier();
        return this.getTierInfo(tier).features;
    }

    getRemainingLimits() {
        const tier = this.getUserTier();
        const tierInfo = this.getTierInfo(tier);
        const currentUser = authManager.getCurrentUser();
        
        if (!currentUser) {
            return {
                bots: 0,
                apiConnections: 0,
                wallets: 0
            };
        }

        const usage = currentUser.usage || { bots: 0, apiConnections: 0, wallets: 0 };
        
        return {
            bots: Math.max(0, tierInfo.features.bots - usage.bots),
            apiConnections: Math.max(0, tierInfo.features.apiConnections - usage.apiConnections),
            wallets: Math.max(0, tierInfo.features.wallets - usage.wallets)
        };
    }

    incrementUsage(type) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return false;

        const usage = currentUser.usage || { bots: 0, apiConnections: 0, wallets: 0 };
        usage[type] = (usage[type] || 0) + 1;

        authManager.updateUser(currentUser.id, { usage });
        return true;
    }

    decrementUsage(type) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return false;

        const usage = currentUser.usage || { bots: 0, apiConnections: 0, wallets: 0 };
        usage[type] = Math.max(0, (usage[type] || 0) - 1);

        authManager.updateUser(currentUser.id, { usage });
        return true;
    }

    showUpgradePrompt(feature) {
        const tier = this.getUserTier();
        const nextTier = this.getNextTier(tier);
        
        if (!nextTier) return;

        const message = `Upgrade to ${nextTier.name} to unlock ${feature}!`;
        
        if (typeof showUpgradeModal === 'function') {
            showUpgradeModal(message, nextTier);
        } else {
            alert(message + ` Only $${nextTier.price}/month`);
        }
    }

    getNextTier(currentTier) {
        const tierOrder = ['guest', 'free', 'pro', 'enterprise'];
        const currentIndex = tierOrder.indexOf(currentTier);
        
        if (currentIndex < tierOrder.length - 1) {
            const nextTierName = tierOrder[currentIndex + 1];
            return this.getTierInfo(nextTierName);
        }
        
        return null;
    }

    getAllTiers() {
        return Object.entries(this.tiers).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    compareTiers(tier1, tier2) {
        const tierOrder = ['guest', 'free', 'pro', 'enterprise'];
        return tierOrder.indexOf(tier1) - tierOrder.indexOf(tier2);
    }

    isUpgrade(currentTier, newTier) {
        return this.compareTiers(newTier, currentTier) > 0;
    }
}

// Global instance
const subscriptionManager = new SubscriptionManager();
