# Quantum Spark Bot

Freemium AI trading platform that allows users to configure trading bots with zero friction. Instant access is available without registration; conversion to paid tiers is driven by behavioral triggers.

## Overview

Quantum Spark Bot provides a browser-based interface for:

- Configuring trading bot parameters with real-time validation
- Connecting major exchanges (Coinbase, Binance, Kraken, TradingView, Robinhood)
- Managing cryptocurrency wallets and portfolio tracking
- Subscription-based feature gating (Free, Pro, Enterprise)
- Admin user management and analytics

The platform also ships dual Android APK builds (main trading app and admin panel) via PWA packaging.

## Key Features

- Multi-strategy bot configuration (Momentum, Mean Reversion, Breakout, Scalping)
- Risk management controls (stop-loss, take-profit, position limits)
- Real-time P&L monitoring and interactive charts
- Secure local credential storage and connection testing
- Multi-tier subscription system with usage limits
- Cloudflare Workers + D1 backend for production
- Offline-capable Progressive Web Apps packaged as Android APKs

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Frontend         | HTML5, Tailwind CSS, Chart.js, JS ES6+ |
| Backend          | Cloudflare Workers, D1 (SQLite)     |
| Mobile           | PWA + Bubblewrap / Android packaging |
| Payments         | Stripe                              |

## Quick Start

1. Open `index.html` in a modern browser for immediate freemium access (no login required).
2. For production deployment, follow the Cloudflare guides in the repository.
3. Android APKs can be built with the provided shell scripts:

   ```bash
   chmod +x *.sh
   ./build-main-apk.sh
   ./build-admin-apk.sh
   # or
   ./build-both-apks.sh
   ```

## Documentation

Extensive guides are included in the repository root, covering:

- API integration
- Cloudflare deployment
- Stripe and subscription setup
- Freemium strategy
- Android APK build process

## Important Disclaimers

Trading involves substantial risk of loss. This software is provided for educational and simulation purposes. Past performance does not guarantee future results. Consult a qualified financial advisor before engaging in live trading.

## License

See repository documentation for copyright and usage terms.
