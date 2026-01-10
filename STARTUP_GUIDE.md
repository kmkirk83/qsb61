# Quantum Spark Bot™ - Production PWA Trading Platform

## Quick Start

### Option 1: Using Python HTTP Server (Recommended for Development)

```bash
# Make the start script executable
chmod +x start.sh

# Start the server
./start.sh

# Or run directly:
python3 server.py
```

Then open your browser to: **http://localhost:8080**

### Option 2: Using Supervisor (Background Service)

Create `/etc/supervisor/conf.d/quantum-spark.conf`:

```ini
[program:quantum-spark]
command=python3 /app/server.py
directory=/app
autostart=true
autorestart=true
stderr_logfile=/var/log/quantum-spark.err.log
stdout_logfile=/var/log/quantum-spark.out.log
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start quantum-spark
```

### Option 3: Using Nginx (Production)

1. Copy files to web root:
```bash
sudo cp -r /app/* /var/www/html/
```

2. Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/default
```

3. Restart Nginx:
```bash
sudo systemctl restart nginx
```

## Application Structure

### Main Entry Points
- **index.html** - Main freemium trading platform
- **index-production.html** - Production-optimized version
- **admin-panel.html** - Admin dashboard
- **app.html** - Legacy trading interface

### JavaScript Modules (/app/js/)

#### Core System
- **auth.js** - Authentication & session management
- **database-connector.js** - Database abstraction (LocalStorage/D1)
- **cloudflare-d1-integration.js** - Cloudflare D1 integration
- **app.js** - Core trading bot logic

#### Features
- **subscription-manager.js** - Tier-based access control
- **payment-processor.js** - Stripe/PayPal integration
- **api-integration.js** - Trading platform APIs & wallets
- **legal-protection.js** - Legal disclaimers & compliance

#### Production
- **production-core.js** - Production system initialization
- **security-manager.js** - Security & threat detection
- **mobile-optimization.js** - Mobile responsive features
- **chatbot.js** - AI customer support

#### Admin
- **admin-panel.js** - Admin dashboard controller
- **growth-analytics.js** - Analytics engine
- **profitability-optimization-engine.js** - Revenue optimization

#### Growth (Stubs)
- **conversion-optimizer.js** - Freemium conversion
- **advanced-conversion-optimizer.js** - Advanced triggers
- **viral-growth-engine.js** - Referral system
- **customer-success-automation.js** - Customer success

## Features Implemented

### ✅ Authentication System
- User registration and login
- Guest mode (2-hour sessions)
- Session management
- Admin access control

### ✅ Subscription Management
- 4 tiers: Guest, Free, Pro, Enterprise
- Feature limits per tier
- Usage tracking
- Upgrade prompts

### ✅ Trading Bot Configuration
- Risk management settings
- Strategy selection
- Real-time risk calculations
- Configuration saving/loading
- Trading simulation

### ✅ API Integrations
- Coinbase Pro, Binance, Kraken, TradingView, Robinhood
- Credential storage
- Connection testing (mock)
- Status monitoring

### ✅ Wallet Management
- Multi-blockchain support (BTC, ETH, BNB, ADA, SOL, MATIC)
- Address validation
- Balance tracking (mock)
- Portfolio overview

### ✅ Payment Processing
- Stripe integration (demo mode)
- PayPal integration (demo mode)
- Subscription management
- Upgrade flows

### ✅ Admin Dashboard
- User management (CRUD)
- Analytics overview
- Revenue tracking
- CSV export
- Real-time updates

### ✅ Production Features
- Error logging
- Security monitoring
- Mobile optimization
- AI chatbot
- PWA support

## Default Credentials

### Admin Account
- **Email:** admin@quantumsparkbot.com
- **Password:** admin123

### Guest Mode
- No login required
- Click "Continue as Guest" on homepage
- 2-hour session limit

## Subscription Tiers

| Feature | Guest | Free | Pro | Enterprise |
|---------|-------|------|-----|------------|
| Bots | 0 | 1 | 5 | Unlimited |
| API Connections | 0 | 1 | 5 | Unlimited |
| Wallets | 0 | 2 | 10 | Unlimited |
| Save Configs | ❌ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ✅ | ✅ |
| Support | None | Community | Email | Priority |
| Price | Free | Free | $29.99/mo | $99.99/mo |

## Development Notes

### Payment Integration
Currently in **demo mode**. To enable real payments:

1. Replace Stripe key in `/app/js/payment-processor.js`:
```javascript
const stripeKey = 'pk_live_YOUR_ACTUAL_KEY';
```

2. Replace PayPal client ID in HTML files:
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID"></script>
```

3. Implement backend endpoints for payment processing

### Cloudflare D1 Integration
Currently uses LocalStorage. To enable D1:

1. Deploy `cloudflare-worker.js` to Cloudflare Workers
2. Set up D1 database using `cloudflare-d1-setup.sql`
3. Update API endpoint in `/app/js/cloudflare-d1-integration.js`

### Real Trading APIs
Currently uses mock data. To enable real trading:

1. Implement server-side proxy (required for CORS)
2. Add proper API authentication
3. Implement error handling and rate limiting
4. Add proper credential encryption

## Security Considerations

⚠️ **Important:** This is a demonstration application. For production use:

1. Implement proper password hashing (bcrypt)
2. Use HTTPS exclusively
3. Add rate limiting
4. Implement proper CSRF protection
5. Encrypt sensitive data
6. Use environment variables for secrets
7. Implement proper session management
8. Add input validation and sanitization
9. Implement proper API authentication
10. Regular security audits

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (Limited support)

## Mobile Support

- ✅ Responsive design
- ✅ Touch-optimized
- ✅ PWA installable
- ✅ Offline capable (with service workers)
- ✅ Android APK build scripts included

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
sudo lsof -i :8080

# Try a different port
PORT=8081 python3 server.py
```

### JavaScript errors
```bash
# Check browser console (F12)
# Ensure all JS files are loaded
ls -la /app/js/
```

### Styles not loading
```bash
# Verify Tailwind CDN is accessible
curl -I https://cdn.tailwindcss.com
```

## Support

For issues or questions:
1. Check browser console for errors
2. Review `/var/log/quantum-spark.err.log` if using supervisor
3. Ensure all dependencies are installed

## License

Quantum Spark Bot™ - Proprietary Software
© 2024 All Rights Reserved
