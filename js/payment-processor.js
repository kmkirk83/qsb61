/**
 * Payment Processor
 * Handles Stripe and PayPal payment integration
 */

class PaymentProcessor {
    constructor() {
        this.stripe = null;
        this.paypal = null;
        this.init();
    }

    async init() {
        await this.initializeStripe();
        await this.initializePayPal();
    }

    async initializeStripe() {
        if (typeof Stripe !== 'undefined') {
            // Replace with your actual Stripe publishable key
            const stripeKey = 'pk_test_YOUR_STRIPE_KEY';
            this.stripe = Stripe(stripeKey);
        } else {
            console.warn('Stripe.js not loaded');
        }
    }

    async initializePayPal() {
        if (typeof paypal !== 'undefined') {
            this.paypal = paypal;
        } else {
            console.warn('PayPal SDK not loaded');
        }
    }

    async createSubscription(tier, paymentMethod = 'stripe') {
        const tierInfo = subscriptionManager.getTierInfo(tier);
        
        if (tierInfo.price === 0) {
            return this.activateFreeTier(tier);
        }

        if (paymentMethod === 'stripe') {
            return await this.createStripeSubscription(tier, tierInfo);
        } else if (paymentMethod === 'paypal') {
            return await this.createPayPalSubscription(tier, tierInfo);
        }

        return { success: false, error: 'Invalid payment method' };
    }

    async createStripeSubscription(tier, tierInfo) {
        try {
            if (!this.stripe) {
                throw new Error('Stripe not initialized');
            }

            // In production, create a checkout session on your backend
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    tier: tier,
                    price: tierInfo.price,
                    userId: authManager.getCurrentUser()?.id
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const session = await response.json();

            // Redirect to Stripe Checkout
            const result = await this.stripe.redirectToCheckout({
                sessionId: session.id
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            return { success: true };
        } catch (error) {
            console.error('Stripe subscription error:', error);
            
            // For demo purposes, simulate successful upgrade
            if (confirm(`This is a demo. Simulate successful upgrade to ${tierInfo.name}?`)) {
                return this.simulateSuccessfulUpgrade(tier);
            }
            
            return { success: false, error: error.message };
        }
    }

    async createPayPalSubscription(tier, tierInfo) {
        try {
            if (!this.paypal) {
                throw new Error('PayPal not initialized');
            }

            // Render PayPal subscription button
            this.renderPayPalButton(tier, tierInfo);
            
            return { success: true, message: 'PayPal button rendered' };
        } catch (error) {
            console.error('PayPal subscription error:', error);
            
            // For demo purposes
            if (confirm(`This is a demo. Simulate successful upgrade to ${tierInfo.name}?`)) {
                return this.simulateSuccessfulUpgrade(tier);
            }
            
            return { success: false, error: error.message };
        }
    }

    renderPayPalButton(tier, tierInfo) {
        const container = document.getElementById('paypal-button-container');
        if (!container) return;

        paypal.Buttons({
            createSubscription: (data, actions) => {
                return actions.subscription.create({
                    plan_id: this.getPayPalPlanId(tier)
                });
            },
            onApprove: async (data, actions) => {
                await this.handlePayPalApproval(data.subscriptionID, tier);
            },
            onError: (err) => {
                console.error('PayPal error:', err);
                alert('Payment failed. Please try again.');
            }
        }).render(container);
    }

    getPayPalPlanId(tier) {
        // Map tiers to PayPal plan IDs
        const planIds = {
            pro: 'P-XXXXXXXXXXXXX',
            enterprise: 'P-YYYYYYYYYYY'
        };
        return planIds[tier] || '';
    }

    async handlePayPalApproval(subscriptionId, tier) {
        try {
            // Save subscription info
            const subscription = {
                id: 'sub_' + Date.now(),
                user_id: authManager.getCurrentUser()?.id,
                tier: tier,
                payment_method: 'paypal',
                subscription_id: subscriptionId,
                status: 'active',
                started_at: new Date().toISOString()
            };

            await dbConnector.query('INSERT INTO Subscriptions', [subscription]);
            
            // Update user tier
            await authManager.upgradeTier(tier);
            
            alert('Subscription activated successfully!');
            window.location.reload();
            
            return { success: true };
        } catch (error) {
            console.error('Subscription activation error:', error);
            return { success: false, error: error.message };
        }
    }

    async activateFreeTier(tier) {
        try {
            await authManager.upgradeTier(tier);
            return { success: true, message: `${tier} tier activated` };
        } catch (error) {
            console.error('Free tier activation error:', error);
            return { success: false, error: error.message };
        }
    }

    async simulateSuccessfulUpgrade(tier) {
        try {
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update user tier
            await authManager.upgradeTier(tier);
            
            // Save mock subscription
            const subscription = {
                id: 'sub_demo_' + Date.now(),
                user_id: authManager.getCurrentUser()?.id,
                tier: tier,
                payment_method: 'demo',
                status: 'active',
                started_at: new Date().toISOString()
            };

            await dbConnector.query('INSERT INTO Subscriptions', [subscription]);
            
            alert('Demo: Subscription activated successfully!');
            window.location.reload();
            
            return { success: true };
        } catch (error) {
            console.error('Simulation error:', error);
            return { success: false, error: error.message };
        }
    }

    async cancelSubscription() {
        if (!confirm('Are you sure you want to cancel your subscription?')) {
            return { success: false, error: 'Cancelled by user' };
        }

        try {
            const user = authManager.getCurrentUser();
            
            // In production, cancel via API
            // await fetch('/api/cancel-subscription', {...})
            
            // Downgrade to free tier
            await authManager.upgradeTier('free');
            
            alert('Subscription cancelled. You have been downgraded to the Free tier.');
            window.location.reload();
            
            return { success: true };
        } catch (error) {
            console.error('Cancel subscription error:', error);
            return { success: false, error: error.message };
        }
    }

    showUpgradeModal(recommendedTier = 'pro') {
        const tiers = subscriptionManager.getAllTiers().filter(t => t.id !== 'guest');
        
        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" id="upgradeModal">
                <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <h2 class="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
                        
                        <div class="grid md:grid-cols-3 gap-6 mb-6">
                            ${tiers.map(tier => `
                                <div class="border rounded-lg p-6 ${tier.id === recommendedTier ? 'border-blue-500 shadow-lg transform scale-105' : 'border-gray-200'}">
                                    ${tier.id === recommendedTier ? '<div class="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">RECOMMENDED</div>' : ''}
                                    <h3 class="text-2xl font-bold mb-2">${tier.name}</h3>
                                    <div class="text-4xl font-bold mb-4">
                                        ${tier.price === 0 ? 'Free' : `$${tier.price}`}
                                        ${tier.price > 0 ? '<span class="text-lg font-normal text-gray-600">/month</span>' : ''}
                                    </div>
                                    
                                    <ul class="space-y-2 mb-6 text-sm">
                                        <li><i class="fas fa-check text-green-500 mr-2"></i>${tier.features.bots === Infinity ? 'Unlimited' : tier.features.bots} Bot${tier.features.bots !== 1 ? 's' : ''}</li>
                                        <li><i class="fas fa-check text-green-500 mr-2"></i>${tier.features.apiConnections === Infinity ? 'Unlimited' : tier.features.apiConnections} API Connection${tier.features.apiConnections !== 1 ? 's' : ''}</li>
                                        <li><i class="fas fa-check text-green-500 mr-2"></i>${tier.features.wallets === Infinity ? 'Unlimited' : tier.features.wallets} Wallet${tier.features.wallets !== 1 ? 's' : ''}</li>
                                        <li><i class="fas fa-${tier.features.analytics ? 'check text-green-500' : 'times text-gray-300'} mr-2"></i>Advanced Analytics</li>
                                        <li><i class="fas fa-${tier.features.advancedRisk ? 'check text-green-500' : 'times text-gray-300'} mr-2"></i>Advanced Risk Management</li>
                                        <li><i class="fas fa-check text-green-500 mr-2"></i>${tier.features.support === 'priority' ? 'Priority' : tier.features.support === 'email' ? 'Email' : 'Community'} Support</li>
                                    </ul>
                                    
                                    <button onclick="paymentProcessor.selectTierForUpgrade('${tier.id}')" 
                                            class="w-full ${tier.id === recommendedTier ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-4 py-2 rounded-lg font-medium">
                                        ${tier.price === 0 ? 'Select Plan' : 'Upgrade Now'}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        
                        <button onclick="document.getElementById('upgradeModal').remove()" 
                                class="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async selectTierForUpgrade(tier) {
        document.getElementById('upgradeModal')?.remove();
        
        if (tier === 'free') {
            await this.activateFreeTier(tier);
            window.location.reload();
            return;
        }

        // Show payment method selection
        this.showPaymentMethodModal(tier);
    }

    showPaymentMethodModal(tier) {
        const tierInfo = subscriptionManager.getTierInfo(tier);
        
        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" id="paymentMethodModal">
                <div class="bg-white rounded-lg max-w-md w-full p-6">
                    <h3 class="text-2xl font-bold mb-4">Select Payment Method</h3>
                    <p class="text-gray-600 mb-6">Upgrading to ${tierInfo.name} - $${tierInfo.price}/month</p>
                    
                    <div class="space-y-3">
                        <button onclick="paymentProcessor.processUpgrade('${tier}', 'stripe')" 
                                class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center">
                            <i class="fab fa-stripe text-2xl mr-3"></i>
                            Pay with Stripe
                        </button>
                        
                        <button onclick="paymentProcessor.processUpgrade('${tier}', 'paypal')" 
                                class="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg flex items-center justify-center">
                            <i class="fab fa-paypal text-2xl mr-3"></i>
                            Pay with PayPal
                        </button>
                    </div>
                    
                    <button onclick="document.getElementById('paymentMethodModal').remove()" 
                            class="w-full mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async processUpgrade(tier, paymentMethod) {
        document.getElementById('paymentMethodModal')?.remove();
        
        const result = await this.createSubscription(tier, paymentMethod);
        
        if (!result.success && result.error) {
            alert('Upgrade failed: ' + result.error);
        }
    }

    getAuthToken() {
        const user = authManager.getCurrentUser();
        return user?.token || '';
    }
}

// Global instance
const paymentProcessor = new PaymentProcessor();

// Helper function for showing upgrade modal
function showUpgradeModal(message, tier) {
    if (confirm(message)) {
        paymentProcessor.showUpgradeModal(tier?.id || 'pro');
    }
}

function triggerUpgrade(source) {
    paymentProcessor.showUpgradeModal('pro');
}
