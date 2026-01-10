/**
 * Mobile Optimization
 * Handles mobile-specific features and responsive behavior
 */

class MobileOptimization {
    constructor() {
        this.isMobile = this.detectMobile();
        this.init();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
        if (this.isMobile) {
            this.applyMobileOptimizations();
            this.setupTouchHandlers();
            this.optimizeViewport();
        }
    }

    applyMobileOptimizations() {
        document.body.classList.add('mobile-optimized');
        
        // Add mobile-specific styles
        const style = document.createElement('style');
        style.textContent = `
            .mobile-optimized {
                -webkit-tap-highlight-color: rgba(0,0,0,0);
                -webkit-touch-callout: none;
            }
            .mobile-optimized input,
            .mobile-optimized select,
            .mobile-optimized textarea {
                font-size: 16px !important; /* Prevent zoom on focus */
            }
        `;
        document.head.appendChild(style);
    }

    setupTouchHandlers() {
        // Add touch-friendly interactions
        document.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' || target.closest('button')) {
                target.style.opacity = '0.7';
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON' || target.closest('button')) {
                setTimeout(() => target.style.opacity = '1', 100);
            }
        }, { passive: true });
    }

    optimizeViewport() {
        // Ensure proper viewport settings
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
}

const mobileOptimization = new MobileOptimization();
