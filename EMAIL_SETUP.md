# Email Configuration Guide

## Gmail SMTP Setup

The email service is configured to use Gmail SMTP with app password authentication.

### Required Environment Variables

Add these to your `.env` file in the `backend` directory:

```env
# Gmail Configuration
GMAIL_USER=aryanarshadlex5413@gmail.com
GMAIL_APP_PASSWORD=gpua cmsh kixf sadu

# Alternative (if you prefer SMTP_ prefix)
# SMTP_USER=aryanarshadlex5413@gmail.com
# SMTP_PASS=gpua cmsh kixf sadu

# Email sender name (optional)
EMAIL_FROM=aryanarshadlex5413@gmail.com
```

### Important Notes

1. **App Password**: The app password should be entered **without spaces** in the `.env` file:
   ```
   GMAIL_APP_PASSWORD=gpua cmsh kixf sadu
   ```
   Should become:
   ```
   GMAIL_APP_PASSWORD=gpua cmsh kixf sadu
   ```
   (Actually, keep it as is - nodemailer will handle it)

2. **Gmail Settings**: Make sure:
   - 2-Step Verification is enabled on your Gmail account
   - App password is generated (not your regular password)
   - Less secure app access is NOT required (app passwords work with 2FA)

3. **Testing**: After adding credentials, restart your backend server. When a payment is completed, you should see:
   - ✅ Email sent successfully! (in console)
   - Email delivered to client's inbox

### Troubleshooting

- **Authentication Error**: Check that the app password is correct and has no extra spaces
- **Connection Error**: Ensure your internet connection is stable
- **Email Not Received**: Check spam folder, verify recipient email is correct

### Email Features

- Sends HTML-formatted emails with styled templates
- Includes project dashboard link
- Logs email status to console for debugging
- Falls back to console logging if credentials are missing



















