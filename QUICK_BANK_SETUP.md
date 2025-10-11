# 🏦 Quick Bank Setup - 5 Minutes to Start Getting Paid

## ⚡ **Super Quick Method**

### **Step 1: Enable Admin Mode (30 seconds)**
1. Open your website (`index.html`)
2. Click the **gear icon (⚙️)** next to "Upgrade for Unlimited"
3. Click **"Enable admin setup mode"**
4. Page reloads with admin access

### **Step 2: Add Your Bank Info (2 minutes)**
1. Click **"Setup Bank Account"** button (bottom left of screen)
2. Fill in the form:
   - **Your full name** 
   - **Bank name** (Chase, Bank of America, etc.)
   - **Routing number** (9 digits from your check)
   - **Account number**
   - **Account type** (Checking/Savings)
3. Click **"Save Bank Account"**

### **Step 3: Setup Stripe (3 minutes)**
1. Click **"Setup Stripe Account"** in the success message
2. Sign up at stripe.com with your email
3. Enter the SAME bank details you just saved
4. Get verified (usually instant)

### **Step 4: Add Stripe Keys (1 minute)**
1. Get your API keys from Stripe Dashboard
2. Update your website code:
   ```javascript
   // In js/payment-processor.js, replace this line:
   this.stripePublishableKey = 'pk_test_YOUR_ACTUAL_STRIPE_KEY_HERE';
   ```

### **Step 5: Test & Go Live (1 minute)**
1. Test with Stripe test card: 4242 4242 4242 4242
2. Switch to live mode in Stripe
3. Update with live API keys
4. **Start getting paid!** 💰

---

## 🎯 **Even Quicker: What You Need**

### **Bank Info You Need:**
- Full name on account
- Bank name
- 9-digit routing number
- Account number
- Account type (checking/savings)

### **Where to Find Routing Number:**
- **Check**: Bottom left numbers (first 9 digits)
- **Online banking**: Account details section
- **Call bank**: They'll tell you instantly
- **Google**: "Chase routing number" + your state

### **Common Routing Numbers:**
- Chase: 021000021 (most states)
- Bank of America: 121000358 (most states)  
- Wells Fargo: 121042882 (most states)
- Citi: 021000089 (most states)

*Note: Use your state-specific routing number*

---

## 💡 **Pro Tips**

1. **Use checking account** (faster processing than savings)
2. **Business account preferred** (higher limits)
3. **Double-check routing number** (most common error)
4. **Keep bank account active** (don't close it)
5. **Start with test mode** (use fake card numbers first)

---

## 🚨 **If Something Goes Wrong**

### **Can't find admin button?**
- Press F12, type: `localStorage.setItem('quantumspark_setup_mode', 'admin')`
- Reload page

### **Bank account not working?**
- Check routing number is correct for your state
- Call your bank to verify account details
- Make sure account is in your name

### **Stripe verification stuck?**
- Upload clear photo of ID
- Make sure all info matches exactly
- Contact Stripe support (very helpful)

---

## 🎉 **That's It!**

Once done, customers can pay with:
- Credit/debit cards
- Apple Pay
- Google Pay  
- PayPal (if you add it)

**Money goes directly to your bank account automatically!**

**Expected first payment in your bank: 7 business days after setup**  
**Regular payments: 1-2 business days after customer pays**