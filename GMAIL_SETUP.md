# Gmail Setup Instructions for TasteJourney

## Issue: "Invalid login: Username and Password not accepted"

This error occurs because Gmail requires specific security settings for third-party apps like Nodemailer.

## Solution Steps:

### 1. Enable 2-Factor Authentication (2FA)
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2FA if not already enabled

### 2. Generate App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** → **App passwords**
3. Select **Mail** as the app
4. Select **Other (custom name)** as the device
5. Enter "TasteJourney API" as the name
6. Click **Generate**
7. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### 3. Update Environment Variables
Replace the password in `.env.local`:

```env
GMAIL_USER=delwerhossain006@gmail.com
GMAIL_PASS=xxxxxxxxxxxxxxxx  # 16-character app password (no spaces)
```

### 4. Alternative: OAuth2 Setup (Advanced)
If app passwords don't work, you'll need OAuth2:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth2 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback`
6. Download credentials JSON file

### 5. Test Email Functionality
After updating credentials:

```bash
curl -X POST http://localhost:3000/api/test-email
```

## Current Status:
- ✅ Nodemailer import fixed (`createTransport` vs `createTransporter`)
- ✅ ESM compatibility configured in Next.js
- ✅ SMTP settings optimized for Gmail
- ❌ **Gmail authentication failing - needs new app password**

## Troubleshooting:

### If still failing:
1. **Check Gmail Security**: Ensure no recent security alerts
2. **Verify 2FA**: Must be enabled for app passwords
3. **Try OAuth2**: More secure but complex setup
4. **Alternative Email**: Use different SMTP provider (SendGrid, Mailgun, etc.)

### Immediate Fix:
**Generate a new app password** following steps 1-3 above. The current password may be expired or incorrect.