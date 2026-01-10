/**
 * Legal Protection System
 * Handles disclaimers, terms of service, and compliance
 */

class LegalProtection {
    constructor() {
        this.init();
    }

    init() {
        this.showInitialDisclaimer();
        this.addFooterLinks();
    }

    showInitialDisclaimer() {
        const hasAccepted = localStorage.getItem('legalDisclaimerAccepted');
        
        if (!hasAccepted) {
            this.displayDisclaimer();
        }
    }

    displayDisclaimer() {
        const disclaimerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="legalDisclaimer">
                <div class="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <div class="text-center mb-6">
                            <i class="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
                            <h2 class="text-2xl font-bold text-gray-900">Important Disclaimer</h2>
                        </div>
                        
                        <div class="space-y-4 text-sm text-gray-700">
                            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 class="font-bold text-red-800 mb-2">⚠️ Trading Risk Warning</h3>
                                <p>Trading cryptocurrencies, forex, and other financial instruments involves substantial risk of loss. You should only trade with money you can afford to lose.</p>
                            </div>

                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 class="font-bold text-blue-800 mb-2">📋 No Financial Advice</h3>
                                <p>This platform is for educational and simulation purposes only. Nothing on this platform constitutes financial advice, investment advice, trading advice, or any other type of advice.</p>
                            </div>

                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 class="font-bold text-yellow-800 mb-2">🔒 No Guarantees</h3>
                                <p>Past performance does not guarantee future results. Simulated results do not represent actual trading and may not reflect the impact of market factors.</p>
                            </div>

                            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h3 class="font-bold text-purple-800 mb-2">👨‍⚖️ Legal Compliance</h3>
                                <p>You are responsible for complying with all applicable laws and regulations in your jurisdiction. Consult with qualified professionals before making any trading decisions.</p>
                            </div>

                            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h3 class="font-bold text-gray-800 mb-2">🛡️ Terms of Use</h3>
                                <p>By using this platform, you agree to our Terms of Service and Privacy Policy. You acknowledge that you understand the risks involved in trading.</p>
                            </div>
                        </div>

                        <div class="mt-6 flex items-start">
                            <input type="checkbox" id="acceptTerms" class="mt-1 mr-3">
                            <label for="acceptTerms" class="text-sm text-gray-700">
                                I have read and understand the risks. I agree to the Terms of Service and acknowledge that this platform is for educational purposes only.
                            </label>
                        </div>

                        <div class="mt-6 flex space-x-3">
                            <button onclick="legalProtection.acceptDisclaimer()" id="acceptBtn" disabled
                                    class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                                I Accept & Continue
                            </button>
                            <button onclick="window.location.href='https://www.google.com'" 
                                    class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400">
                                I Do Not Accept
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', disclaimerHTML);

        // Enable accept button when checkbox is checked
        document.getElementById('acceptTerms').addEventListener('change', (e) => {
            document.getElementById('acceptBtn').disabled = !e.target.checked;
        });
    }

    acceptDisclaimer() {
        localStorage.setItem('legalDisclaimerAccepted', 'true');
        localStorage.setItem('disclaimerAcceptedDate', new Date().toISOString());
        document.getElementById('legalDisclaimer')?.remove();
    }

    addFooterLinks() {
        const footer = document.querySelector('footer');
        if (footer) {
            const linksHTML = `
                <div class="text-center text-sm text-gray-600 space-x-4">
                    <a href="#" onclick="legalProtection.showTerms(); return false;" class="hover:text-gray-900">Terms of Service</a>
                    <span>•</span>
                    <a href="#" onclick="legalProtection.showPrivacy(); return false;" class="hover:text-gray-900">Privacy Policy</a>
                    <span>•</span>
                    <a href="#" onclick="legalProtection.showRiskDisclosure(); return false;" class="hover:text-gray-900">Risk Disclosure</a>
                </div>
            `;
            footer.insertAdjacentHTML('beforeend', linksHTML);
        }
    }

    showTerms() {
        alert('Terms of Service would be displayed here in production.');
    }

    showPrivacy() {
        alert('Privacy Policy would be displayed here in production.');
    }

    showRiskDisclosure() {
        alert('Full Risk Disclosure would be displayed here in production.');
    }
}

// Global instance
const legalProtection = new LegalProtection();
