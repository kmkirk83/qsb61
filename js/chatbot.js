/**
 * AI Chatbot System
 * Provides customer support and FAQ assistance
 */

class AIChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createChatWidget();
        this.loadFAQData();
    }

    loadFAQData() {
        this.faqData = [
            { q: 'how to start', a: 'Click "Start Bot" after configuring your parameters. For guest users, limited features are available. Upgrade for full access!' },
            { q: 'upgrade', a: 'To upgrade, click on your tier badge or visit the subscription page. We offer Pro ($29.99/mo) and Enterprise ($99.99/mo) plans.' },
            { q: 'payment', a: 'We accept Stripe and PayPal for subscriptions. All payments are secure and encrypted.' },
            { q: 'api', a: 'To connect APIs, go to the API Integrations tab and enter your credentials. Supported platforms: Coinbase, Binance, Kraken, TradingView.' },
            { q: 'wallet', a: 'Add wallets in the Wallets & Accounts tab. We support Bitcoin, Ethereum, BNB, Cardano, Solana, and Polygon.' },
            { q: 'risk', a: 'Risk management settings help protect your capital. We recommend: Stop Loss 2-3%, Take Profit 4-6%, Max Daily Loss under 5%.' },
            { q: 'cancel', a: 'You can cancel your subscription anytime from your account settings. You\'ll be downgraded to the Free tier.' },
            { q: 'support', a: 'Free users get community support. Pro users get email support. Enterprise users get priority support with dedicated account managers.' }
        ];
    }

    createChatWidget() {
        const widgetHTML = `
            <div id="chatWidget" class="fixed bottom-4 right-4 z-50">
                <div id="chatBox" class="hidden bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                        <div class="flex items-center">
                            <i class="fas fa-robot mr-2"></i>
                            <span class="font-medium">Support Assistant</span>
                        </div>
                        <button onclick="chatbot.closeChat()" class="text-white hover:text-gray-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-3">
                        <div class="bg-gray-100 rounded-lg p-3 text-sm">
                            Hi! I'm your AI assistant. How can I help you today?
                        </div>
                    </div>
                    <div class="p-4 border-t">
                        <div class="flex space-x-2">
                            <input type="text" id="chatInput" placeholder="Type your question..." 
                                   class="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                   onkeypress="if(event.key==='Enter') chatbot.sendMessage()">
                            <button onclick="chatbot.sendMessage()" 
                                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <button onclick="chatbot.toggleChat()" 
                        class="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center">
                    <i class="fas fa-comments text-xl"></i>
                </button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatBox = document.getElementById('chatBox');
        if (chatBox) {
            chatBox.classList.toggle('hidden');
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('chatBox')?.classList.add('hidden');
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        // Simulate AI response
        setTimeout(() => {
            const response = this.getAIResponse(message);
            this.addMessage(response, 'bot');
        }, 500);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageHTML = `
            <div class="${sender === 'user' ? 'text-right' : ''}">
                <div class="inline-block ${sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg p-3 text-sm max-w-xs">
                    ${text}
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ text, sender, timestamp: new Date() });
    }

    getAIResponse(message) {
        const lowerMessage = message.toLowerCase();

        // Find matching FAQ
        for (const faq of this.faqData) {
            if (lowerMessage.includes(faq.q)) {
                return faq.a;
            }
        }

        // Default responses
        const defaultResponses = [
            'I\'m here to help! Could you please provide more details?',
            'For detailed assistance, please contact our support team at support@quantumsparkbot.com',
            'You can also check our documentation for more information.'
        ];

        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
}

// Initialize chatbot
let chatbot;
window.addEventListener('DOMContentLoaded', () => {
    chatbot = new AIChatbot();
});
