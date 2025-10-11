# 🚀 Cloudflare D1 Deployment Guide

Complete guide for deploying the Quantum Spark Bot™ to Cloudflare with D1 database integration.

## 📋 Prerequisites

### Required Accounts & Tools
- **Cloudflare Account**: Free tier supports D1 database
- **Wrangler CLI**: Cloudflare's command-line tool
- **Node.js**: Version 18+ for development
- **Git**: For version control and deployment

### Installation Commands
```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler auth login

# Verify login
wrangler whoami
```

## 🗄️ Database Setup

### Step 1: Create D1 Database
```bash
# Create the D1 database
wrangler d1 create quantum-spark-bot

# Copy the database ID from the output
# Example output:
# ✅ Successfully created DB 'trading-bot-manager'
# Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 2: Configure wrangler.toml
Create `wrangler.toml` in your project root:

```toml
name = "quantum-spark-bot-api"
main = "cloudflare-worker.js"
compatibility_date = "2024-01-15"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "quantum-spark-bot-api"

[env.development] 
name = "trading-bot-manager-api-dev"

[[d1_databases]]
binding = "DB"
database_name = "quantum-spark-bot"
database_id = "your-database-id-here"  # Replace with your actual database ID

[build]
command = ""

[vars]
ENVIRONMENT = "production"
APP_NAME = "Quantum Spark Bot™"
COPYRIGHT_YEAR = "2024"
```

### Step 3: Initialize Database Schema
```bash
# Execute the SQL schema file
wrangler d1 execute quantum-spark-bot --file=./cloudflare-d1-setup.sql

# Verify tables were created
wrangler d1 execute quantum-spark-bot --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### Step 4: Seed Initial Data (Optional)
```bash
# Insert test data
wrangler d1 execute quantum-spark-bot --command="
INSERT INTO users (username, email, password_hash, subscription_tier, subscription_status, subscription_end, is_admin) 
VALUES ('admin', 'admin@yoursite.com', 'admin_lollipop123_hash', 'enterprise', 'active', '2025-12-31 23:59:59', 1);
"

# Verify data
wrangler d1 execute quantum-spark-bot --command="SELECT username, subscription_tier FROM users;"
```

## 🔧 Worker Configuration

### Step 1: Prepare Worker Files
Ensure these files are in your project:
- `cloudflare-worker.js` (Main worker code)
- `wrangler.toml` (Configuration)
- `cloudflare-d1-setup.sql` (Database schema)

### Step 2: Environment Variables
Add any sensitive variables to Cloudflare dashboard:

```bash
# Set environment variables (optional)
wrangler secret put API_SECRET_KEY
# Enter your secret when prompted

wrangler secret put ENCRYPTION_KEY  
# Enter encryption key for sensitive data
```

### Step 3: Deploy Worker
```bash
# Deploy to development
wrangler deploy --env development

# Deploy to production
wrangler deploy --env production

# View deployment logs
wrangler tail
```

## 🌐 Frontend Configuration

### Step 1: Update API Endpoints
Update your frontend JavaScript to use the deployed API:

```javascript
// In js/cloudflare-d1-integration.js, update the constructor:
class CloudflareD1Database {
    constructor(databaseUrl = 'https://your-worker.your-subdomain.workers.dev/api/db') {
        this.baseUrl = databaseUrl;
        // ... rest of constructor
    }
}
```

### Step 2: Configure CORS (Production)
In `cloudflare-worker.js`, update CORS settings for production:

```javascript
this.corsHeaders = {
    'Access-Control-Allow-Origin': 'https://your-domain.com', // Replace with your domain
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
};
```

### Step 3: Deploy Frontend
Deploy your frontend files to Cloudflare Pages:

```bash
# Initialize Pages project
wrangler pages project create quantum-spark-bot

# Deploy frontend
wrangler pages deploy . --project-name=quantum-spark-bot
```

## 🔐 Security Configuration

### Step 1: Custom Domain (Recommended)
```bash
# Add custom domain to Workers
wrangler route create "api.yourdomain.com/*" --zone-id=your-zone-id

# Add custom domain to Pages
# Use Cloudflare Dashboard: Pages → Custom domains
```

### Step 2: Rate Limiting
Add to your `wrangler.toml`:

```toml
[[rules]]
type = "rate_limit"
matches = "api/*"
threshold = 100
period = 60
action = "challenge"
```

### Step 3: IP Access Rules (Optional)
```bash
# Block specific countries or IP ranges via Cloudflare Dashboard
# Security → WAF → Tools → IP Access Rules
```

## 📊 Database Management

### Useful D1 Commands
```bash
# Execute query
wrangler d1 execute quantum-spark-bot --command="SELECT COUNT(*) FROM users;"

# Import data from file
wrangler d1 execute quantum-spark-bot --file=./data-import.sql

# Export database (backup)
wrangler d1 export trading-bot-manager --output=backup-$(date +%Y%m%d).sql

# List all databases
wrangler d1 list

# Database info
wrangler d1 info trading-bot-manager
```

### Monitoring Queries
```sql
-- Check active users
SELECT COUNT(*) as active_users FROM users WHERE last_login > datetime('now', '-7 days');

-- Revenue summary
SELECT 
    subscription_tier, 
    COUNT(*) as users, 
    sp.price,
    (COUNT(*) * sp.price) as revenue
FROM users u 
JOIN subscription_plans sp ON u.subscription_tier = sp.name 
WHERE u.subscription_status = 'active' 
GROUP BY subscription_tier;

-- Recent registrations
SELECT username, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- System health
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM user_sessions WHERE expires_at > datetime('now')) as active_sessions,
    (SELECT COUNT(*) FROM bot_configurations) as total_bots;
```

## 🔄 CI/CD Pipeline

### GitHub Actions Deployment
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Wrangler
        run: npm install -g wrangler
        
      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: '.'
          command: deploy --env production
          
      - name: Deploy Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: quantum-spark-bot
          directory: .
```

### Required Secrets
Add these to GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Workers and Pages permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## 📈 Performance Optimization

### Database Indexing
```sql
-- Add custom indexes for better performance
CREATE INDEX idx_users_login_tier ON users(last_login, subscription_tier);
CREATE INDEX idx_sessions_active ON user_sessions(expires_at) WHERE expires_at > datetime('now');
CREATE INDEX idx_audit_recent ON audit_logs(timestamp) WHERE timestamp > datetime('now', '-30 days');
```

### Caching Strategy
```javascript
// In cloudflare-worker.js, add caching headers
return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        ...this.corsHeaders
    }
});
```

### Worker Limits & Scaling
- **Free Tier**: 100,000 requests/day
- **Paid Tier**: 10M+ requests/month
- **CPU Time**: 10ms (free), 50ms (paid)
- **Memory**: 128MB limit
- **D1 Operations**: 100K/day (free), 25M/month (paid)

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database exists
wrangler d1 list

# Test connection
wrangler d1 execute quantum-spark-bot --command="SELECT 1;"

# Verify binding in wrangler.toml
```

#### 2. CORS Errors
```javascript
// Update CORS headers in worker
'Access-Control-Allow-Origin': '*', // For development only
'Access-Control-Allow-Origin': 'https://yourdomain.com', // For production
```

#### 3. Authentication Issues
```bash
# Re-authenticate
wrangler auth login

# Check permissions
wrangler whoami
```

#### 4. Deployment Failures
```bash
# Check syntax
node -c cloudflare-worker.js

# View detailed logs
wrangler deploy --verbose

# Test locally
wrangler dev
```

### Performance Monitoring
```bash
# View analytics
wrangler analytics --since="24h"

# Monitor logs
wrangler tail --format=pretty

# Database metrics
wrangler d1 metrics trading-bot-manager --since="24h"
```

## 🔒 Production Checklist

### Security
- [ ] Update CORS origins to your domain
- [ ] Enable Cloudflare security features (DDoS protection, WAF)
- [ ] Set up custom domain with SSL
- [ ] Configure rate limiting
- [ ] Review and limit database permissions
- [ ] Enable audit logging
- [ ] Set up monitoring alerts

### Performance  
- [ ] Add database indexes for common queries
- [ ] Configure caching headers
- [ ] Optimize SQL queries
- [ ] Set up CDN for static assets
- [ ] Monitor Worker CPU usage

### Maintenance
- [ ] Set up automated backups
- [ ] Configure log retention policies
- [ ] Plan database maintenance windows
- [ ] Monitor storage usage
- [ ] Set up uptime monitoring

## 📞 Support Resources

### Cloudflare Documentation
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Pages Documentation](https://developers.cloudflare.com/pages/)

### Community Support
- [Cloudflare Community](https://community.cloudflare.com/)
- [Discord Server](https://discord.cloudflare.com/)
- [GitHub Issues](https://github.com/cloudflare/workers-sdk/issues)

---

**🎯 Your Quantum Spark Bot™ is now ready for production deployment on Cloudflare's global network with D1 database integration!**