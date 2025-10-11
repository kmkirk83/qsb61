# 🔌 API Integration Guide

Complete guide for integrating your Trading Bot Manager with popular trading platforms and wallet services.

## 🚨 Important Security Notice

**⚠️ CRITICAL**: This application is designed for **configuration and testing purposes**. For production trading:
- Never expose API keys in client-side code
- Implement server-side API proxy with proper authentication
- Use environment variables for sensitive credentials
- Enable IP whitelisting on your exchange accounts

## 📋 Supported Platforms

### 🏦 **Cryptocurrency Exchanges**

#### **Coinbase Pro**
- ✅ **Status**: Configuration Interface Available
- 🔗 **API Documentation**: https://docs.pro.coinbase.com/
- 🔐 **Authentication**: API Key + Secret + Passphrase
- 🌐 **CORS Support**: ❌ (Requires server-side proxy)

**Required Permissions:**
- View (Read account information)
- Trade (Place and cancel orders)

**Setup Steps:**
1. Go to Coinbase Pro → Settings → API
2. Create new API key with View + Trade permissions
3. Note the API Key, Secret, and Passphrase
4. Configure in the app's API Integration tab

---

#### **Binance**
- ✅ **Status**: Configuration Interface Available  
- 🔗 **API Documentation**: https://binance-docs.github.io/apidocs/
- 🔐 **Authentication**: API Key + Secret Key
- 🌐 **CORS Support**: ❌ (Requires server-side proxy)

**Required Permissions:**
- Enable Reading
- Enable Spot & Margin Trading
- Restrict access to trusted IPs (Recommended)

**Setup Steps:**
1. Go to Binance → Account → API Management
2. Create API key with required permissions
3. Configure IP restrictions for security
4. Add credentials to the app

---

#### **Kraken**
- ✅ **Status**: Configuration Interface Available
- 🔗 **API Documentation**: https://docs.kraken.com/rest/
- 🔐 **Authentication**: API Key + Private Key + Optional 2FA
- 🌐 **CORS Support**: ❌ (Requires server-side proxy)

**Required Permissions:**
- Query Funds
- Query Open/Closed Orders
- Create & Cancel Orders

---

### 📱 **Trading Apps & Platforms**

#### **Robinhood**
- ⚠️ **Status**: Unofficial API (Use at own risk)
- 🔗 **Documentation**: No official API available
- 🔐 **Authentication**: Username + Password + MFA
- ⚠️ **Warning**: Robinhood doesn't provide official API access

**Limitations:**
- Violates Terms of Service
- Account suspension risk
- Unreliable third-party libraries

---

#### **TradingView**
- ✅ **Status**: Webhook Integration Available
- 🔗 **API Documentation**: https://www.tradingview.com/support/solutions/43000529348/
- 🔐 **Authentication**: Webhook URL + Secret Key
- 🌐 **CORS Support**: ✅ (Webhook-based)

**Setup Requirements:**
- TradingView Pro/Pro+/Premium subscription
- Server endpoint to receive webhooks
- Alert message configuration

---

## 🔧 **Implementation Guide**

### **Client-Side Configuration (Current)**

The current implementation provides:
- ✅ Secure credential storage (localStorage)
- ✅ Platform-specific configuration forms
- ✅ Connection testing with mock responses
- ✅ Input validation and error handling
- ✅ User-friendly interface

```javascript
// Example: Accessing saved credentials
const apiConfigs = JSON.parse(localStorage.getItem('apiConfigs') || '{}');
const coinbaseConfig = apiConfigs.coinbase;
```

### **Server-Side Implementation (Required for Production)**

For live trading, you'll need a backend server:

#### **Node.js Express Example**

```javascript
// server.js
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();

// Coinbase Pro API Proxy
app.post('/api/coinbase/orders', async (req, res) => {
    const { apiKey, apiSecret, passphrase } = req.body.credentials;
    const orderData = req.body.order;
    
    // Generate signature for Coinbase Pro
    const timestamp = Math.floor(Date.now() / 1000);
    const message = timestamp + 'POST' + '/orders' + JSON.stringify(orderData);
    const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('base64');
    
    try {
        const response = await axios.post('https://api.pro.coinbase.com/orders', orderData, {
            headers: {
                'CB-ACCESS-KEY': apiKey,
                'CB-ACCESS-SIGN': signature,
                'CB-ACCESS-TIMESTAMP': timestamp,
                'CB-ACCESS-PASSPHRASE': passphrase,
                'Content-Type': 'application/json'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

#### **Python Flask Example**

```python
from flask import Flask, request, jsonify
import hashlib
import hmac
import base64
import time
import requests

app = Flask(__name__)

@app.route('/api/binance/order', methods=['POST'])
def create_binance_order():
    credentials = request.json['credentials']
    order_data = request.json['order']
    
    # Add timestamp and signature
    order_data['timestamp'] = int(time.time() * 1000)
    query_string = '&'.join([f"{k}={v}" for k, v in order_data.items()])
    
    signature = hmac.new(
        credentials['apiSecret'].encode(),
        query_string.encode(),
        hashlib.sha256
    ).hexdigest()
    
    order_data['signature'] = signature
    
    response = requests.post(
        'https://api.binance.com/api/v3/order',
        data=order_data,
        headers={'X-MBX-APIKEY': credentials['apiKey']}
    )
    
    return jsonify(response.json())
```

---

## 🔒 **Security Best Practices**

### **API Key Security**
1. **Never hardcode** API keys in client-side code
2. **Use environment variables** on the server
3. **Enable IP whitelisting** on exchange accounts
4. **Rotate keys regularly** (monthly/quarterly)
5. **Use read-only keys** for monitoring, separate keys for trading

### **Network Security**
```javascript
// Example: Secure server configuration
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet()); // Security headers
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
}));
```

### **Authentication Flow**
```javascript
// Recommended: JWT-based authentication
const jwt = require('jsonwebtoken');

// Middleware to verify JWT tokens
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.sendStatus(401);
    }
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
```

---

## 💰 **Wallet Integration**

### **Supported Blockchain Networks**

#### **Bitcoin (BTC)**
- 📡 **API**: BlockCypher, Blockchain.info, Blockstream
- 🔗 **Endpoints**: 
  - Balance: `https://blockstream.info/api/address/{address}`
  - Transactions: `https://blockstream.info/api/address/{address}/txs`

```javascript
// Example: Fetch Bitcoin balance
async function getBitcoinBalance(address) {
    const response = await fetch(`https://blockstream.info/api/address/${address}`);
    const data = await response.json();
    return data.chain_stats.funded_txo_sum / 100000000; // Convert satoshis to BTC
}
```

#### **Ethereum (ETH)**
- 📡 **API**: Etherscan, Infura, Alchemy
- 🔗 **Endpoints**:
  - Balance: `https://api.etherscan.io/api?module=account&action=balance&address={address}&tag=latest&apikey={key}`
  - Tokens: `https://api.etherscan.io/api?module=account&action=tokentx&address={address}&apikey={key}`

```javascript
// Example: Fetch Ethereum balance
async function getEthereumBalance(address, apiKey) {
    const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`
    );
    const data = await response.json();
    return parseInt(data.result) / Math.pow(10, 18); // Convert wei to ETH
}
```

---

## 📊 **Real-Time Data Integration**

### **WebSocket Connections**

#### **Binance WebSocket**
```javascript
// Real-time price updates
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('BTC/USDT Price:', data.c);
};
```

#### **Coinbase Pro WebSocket**
```javascript
// Real-time order book updates
const ws = new WebSocket('wss://ws-feed.pro.coinbase.com');

ws.onopen = function() {
    ws.send(JSON.stringify({
        type: 'subscribe',
        channels: [{ name: 'ticker', product_ids: ['BTC-USD'] }]
    }));
};
```

---

## 🛠 **Development Setup**

### **Environment Variables**
Create a `.env` file:
```bash
# Exchange API Keys
COINBASE_API_KEY=your_coinbase_key
COINBASE_API_SECRET=your_coinbase_secret
COINBASE_PASSPHRASE=your_coinbase_passphrase

BINANCE_API_KEY=your_binance_key
BINANCE_API_SECRET=your_binance_secret

# Blockchain API Keys
ETHERSCAN_API_KEY=your_etherscan_key
BLOCKCYPHER_TOKEN=your_blockcypher_token

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### **Docker Configuration**
```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🧪 **Testing & Validation**

### **Sandbox/Testnet Environments**

| Platform | Testnet URL | Notes |
|----------|-------------|--------|
| Coinbase Pro | `https://api-public.sandbox.pro.coinbase.com` | Separate sandbox account required |
| Binance | `https://testnet.binance.vision` | Free testnet with fake funds |
| Kraken | No testnet | Use small amounts for testing |

### **Integration Testing**
```javascript
// Example test suite
describe('API Integration', () => {
    test('should connect to Coinbase Pro sandbox', async () => {
        const config = {
            apiKey: process.env.COINBASE_SANDBOX_KEY,
            apiSecret: process.env.COINBASE_SANDBOX_SECRET,
            passphrase: process.env.COINBASE_SANDBOX_PASSPHRASE,
            sandbox: true
        };
        
        const result = await testCoinbaseConnection(config);
        expect(result.status).toBe('success');
    });
});
```

---

## 🚀 **Deployment Checklist**

### **Pre-Production**
- [ ] Set up server-side API proxy
- [ ] Configure environment variables
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up rate limiting
- [ ] Implement proper error handling
- [ ] Configure logging and monitoring
- [ ] Test with small amounts first

### **Production Security**
- [ ] Enable IP whitelisting
- [ ] Use read-only keys for monitoring
- [ ] Set up 2FA on all exchange accounts
- [ ] Implement key rotation schedule
- [ ] Monitor for unusual activity
- [ ] Set up alerts for failed authentications

---

## ❓ **Troubleshooting**

### **Common Issues**

#### **CORS Errors**
```
Access to fetch at 'https://api.binance.com' from origin 'http://localhost' has been blocked by CORS policy
```
**Solution**: Implement server-side proxy for API calls

#### **Authentication Failures**
```
{"code":-1022,"msg":"Signature for this request is not valid."}
```
**Solution**: Check timestamp synchronization and signature generation

#### **Rate Limiting**
```
{"error":"Too Many Requests"}
```
**Solution**: Implement exponential backoff and request queuing

### **Debug Mode**
```javascript
// Enable debug logging
localStorage.setItem('apiDebug', 'true');

// View stored credentials (development only)
console.log(JSON.parse(localStorage.getItem('apiConfigs')));
```

---

## 📞 **Support & Resources**

### **Official Documentation**
- [Coinbase Pro API](https://docs.pro.coinbase.com/)
- [Binance API](https://binance-docs.github.io/apidocs/)
- [Kraken API](https://docs.kraken.com/rest/)
- [TradingView Webhooks](https://www.tradingview.com/support/solutions/43000529348/)

### **Community Resources**
- [CryptoCurrency APIs Reddit](https://www.reddit.com/r/CryptoCurrency/)
- [Stack Overflow Trading Tags](https://stackoverflow.com/questions/tagged/trading-api)
- [GitHub Trading Bot Examples](https://github.com/topics/trading-bot)

---

**⚠️ Disclaimer**: This guide is for educational purposes. Trading cryptocurrencies involves substantial risk. Never trade with funds you cannot afford to lose. Always test thoroughly before using real funds.