# 🏦 Complete Stripe Setup Guide - Receive Payments on Your Website

## 📋 **Quick Setup Overview**

**Total Time: 10-15 minutes**  
**Result: Start receiving payments immediately**

### **Step 1: Add Bank Account via Website** ⏱️ 2 minutes
### **Step 2: Create Stripe Account** ⏱️ 5 minutes  
### **Step 3: Configure Stripe Settings** ⏱️ 3 minutes
### **Step 4: Add API Keys to Website** ⏱️ 2 minutes
### **Step 5: Test & Go Live** ⏱️ 3 minutes

---

## 🚀 **Step 1: Add Your Bank Account via Website**

### **Quick Method (Recommended)**

1. **Open your website** (`index.html`)
2. **Click the gear icon (⚙️)** next to "Upgrade for Unlimited" 
3. **Click "Enable admin setup mode"** when prompted
4. **Page will reload** - you now have admin access
5. **Click "Setup Bank Account"** button (bottom left)
6. **Fill in your bank details:**
   - Account Holder Name (your full name or business name)
   - Bank Name (Chase, Bank of America, Wells Fargo, etc.)
   - Routing Number (9 digits - find on check or bank website)
   - Account Number (your account number)
   - Account Type (Checking or Savings)
7. **Click "Save Bank Account"**

### **Manual Method**
If the button doesn't work, add this info manually:
- Open browser console (F12)
- Run: `localStorage.setItem('quantumspark_setup_mode', 'admin')`
- Reload page
- Follow steps 5-7 above

---

## 🏗️ **Step 2: Create Stripe Account**

### **A. Sign Up for Stripe**
1. **Go to [stripe.com](https://stripe.com)**
2. **Click "Start now" or "Sign up"**
3. **Enter your email and create password**
4. **Choose account type:**
   - **Individual**: If you're a sole proprietor
   - **Company**: If you have a business (recommended for higher limits)

### **B. Complete Business Information**
1. **Business details:**
   - Business name: "Your Name" or "Your Business Name"
   - Industry: "Financial Services" or "Software"
   - Website: Your website URL (optional initially)
   
2. **Personal information:**
   - Full legal name
   - Date of birth
   - Social Security Number (SSN) or Tax ID
   - Phone number
   - Address

3. **Business verification:**
   - Upload ID (driver's license or passport)
   - Bank account verification (use the account you added to your website)

### **C. Account Verification**
- **Instant verification**: Most accounts approved within minutes
- **Additional verification**: May take 1-2 business days for some accounts
- **You can start testing immediately** even during verification

---

## ⚙️ **Step 3: Configure Stripe Payouts**

### **A. Add Your Bank Account in Stripe**
1. **Login to [dashboard.stripe.com](https://dashboard.stripe.com)**
2. **Go to Settings → Payouts**
3. **Click "Add bank account"**
4. **Enter the SAME bank details** you added to your website:
   - Routing number
   - Account number
   - Account holder name
5. **Verify bank account** (Stripe will send micro-deposits)

### **B. Set Payout Schedule**
1. **Go to Settings → Payouts**
2. **Choose payout frequency:**
   - **Daily**: Get paid every business day (recommended)
   - **Weekly**: Get paid once per week
   - **Monthly**: Get paid once per month
3. **Save settings**

---

## 🔑 **Step 4: Get Your Stripe API Keys**

### **A. Find Your API Keys**
1. **Go to [dashboard.stripe.com](https://dashboard.stripe.com)**
2. **Click "Developers" in left sidebar**
3. **Click "API keys"**
4. **You'll see two keys:**
   - **Publishable key**: Starts with `pk_test_...` (for testing) or `pk_live_...` (for live)
   - **Secret key**: Starts with `sk_test_...` (for testing) or `sk_live_...` (for live)

### **B. Add Keys to Your Website**

#### **Method 1: Via Admin Panel (If Available)**
1. **Access your website as admin**
2. **Go to Admin Panel → System Settings** (if available)
3. **Enter your Stripe keys**
4. **Save settings**

#### **Method 2: Direct Code Update (Recommended)**
1. **Open `js/payment-processor.js`**
2. **Find this line:**
   ```javascript
   this.stripePublishableKey = 'pk_test_YOUR_STRIPE_KEY_HERE';
   ```
3. **Replace with your actual key:**
   ```javascript
   this.stripePublishableKey = 'pk_test_51ABC123...'; // Your actual key
   ```

#### **Method 3: Browser Console (Quick Test)**
1. **Open your website**
2. **Press F12 to open console**
3. **Run this command:**
   ```javascript
   localStorage.setItem('quantumspark_stripe_publishable', 'pk_test_YOUR_ACTUAL_KEY');
   ```
4. **Reload page to activate**

---

## 🧪 **Step 5: Test Your Payment System**

### **A. Test Mode Setup**
1. **Use test API keys** (start with `pk_test_` and `sk_test_`)
2. **Open your website**
3. **Try to upgrade to Pro plan**
4. **Use Stripe test card numbers:**
   - **Successful payment**: 4242 4242 4242 4242
   - **Expiry**: Any future date (12/25)
   - **CVC**: Any 3 digits (123)
   - **ZIP**: Any 5 digits (12345)

### **B. Test Payment Flow**
1. **Click "Upgrade Now" on your site**
2. **Select Pro ($29.99/month)**
3. **Enter test card details**
4. **Complete payment**
5. **Check Stripe Dashboard** for test payment

### **C. Verify Everything Works**
✅ Payment form loads  
✅ Test payment processes successfully  
✅ User gets upgraded to Pro features  
✅ Payment appears in Stripe Dashboard  

---

## 🎯 **Step 6: Go Live & Start Earning**

### **A. Switch to Live Mode**
1. **Go to Stripe Dashboard**
2. **Toggle "Test mode" to OFF** (top right)
3. **Get your LIVE API keys:**
   - Live publishable key: `pk_live_...`
   - Live secret key: `sk_live_...`

### **B. Update Website with Live Keys**
1. **Replace test keys with live keys** in your code
2. **Test with a small real payment** ($1 test)
3. **Verify payment appears in your bank account** (1-2 business days)

### **C. Launch Your Platform**
🚀 **You're now ready to receive real payments!**

---

## 💰 **Payment Processing Details**

### **How Payments Work**
1. **Customer pays** → Stripe processes payment
2. **Stripe holds funds** for 2-7 days (standard processing)
3. **Funds transferred** to your bank account automatically
4. **You receive** 97.1% of payment (Stripe keeps 2.9% + $0.30 per transaction)

### **Example Revenue**
- **Customer pays $29.99** for Pro plan
- **Stripe fee**: $1.17 (2.9% + $0.30)
- **You receive**: $28.82 in your bank account

### **Payout Timeline**
- **First payout**: 7 business days after first payment
- **Regular payouts**: Daily, weekly, or monthly (your choice)
- **International**: May take longer for international accounts

---

## 🔧 **Troubleshooting Common Issues**

### **"Payment form not loading"**
- **Check API keys** are correct and properly formatted
- **Verify internet connection**
- **Check browser console** for error messages
- **Try different browser**

### **"Bank account verification failed"**
- **Double-check routing/account numbers**
- **Contact your bank** to confirm account details
- **Ensure account is in your name** (matches Stripe account)

### **"Payments not appearing in bank"**
- **Check payout schedule** in Stripe Dashboard
- **Verify bank account** is properly connected
- **First payout takes 7 business days**
- **Check Stripe balance** in Dashboard

### **"Account under review"**
- **Complete all verification** requirements
- **Upload requested documents**
- **Contact Stripe support** if stuck
- **Usually resolves within 1-2 business days**

---

## 📞 **Getting Help**

### **Stripe Support**
- **Help Center**: [support.stripe.com](https://support.stripe.com)
- **Live Chat**: Available in Stripe Dashboard
- **Email Support**: support@stripe.com
- **Phone**: 1-888-926-2289

### **Common Resources**
- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **API Reference**: [stripe.com/docs/api](https://stripe.com/docs/api)
- **Test Card Numbers**: [stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 🎉 **Congratulations!**

Once complete, you'll have:

✅ **Professional payment processing** via Stripe  
✅ **Automatic bank deposits** from customer payments  
✅ **Secure payment handling** with industry-standard security  
✅ **Global payment support** (170+ countries)  
✅ **Real-time payment tracking** via Stripe Dashboard  
✅ **Automatic recurring billing** for subscriptions  

**Your Quantum Spark Bot™ platform is now ready to generate revenue from paying customers worldwide!** 🚀💰