# Firebase Functions for Prayer Reminder Email Notifications

This directory contains Firebase Cloud Functions that send email notifications for prayer reminders.

## Setup Instructions

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Functions (if not already done)

```bash
firebase init functions
```

- Select your Firebase project
- Choose JavaScript
- Install dependencies: Yes

### 4. Install Dependencies

```bash
cd functions
npm install
```

### 5. Configure Email Service

Choose one of the following options:

#### Option A: SendGrid (Recommended)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key in SendGrid dashboard
3. Set the API key:
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
   ```
4. Install SendGrid package:
   ```bash
   cd functions
   npm install @sendgrid/mail
   ```
5. Uncomment the SendGrid code in `functions/index.js` (Option 1)
6. Update the `from` email address to your verified sender

#### Option B: Firebase Extensions (Easiest)

1. Go to Firebase Console → Extensions
2. Install "Trigger Email" extension
3. Uncomment the Firebase Extensions code in `functions/index.js` (Option 3)
4. No additional configuration needed!

#### Option C: Nodemailer with SMTP

1. Install Nodemailer:
   ```bash
   cd functions
   npm install nodemailer
   ```
2. Configure SMTP credentials:
   ```bash
   firebase functions:config:set email.user="your-email@gmail.com"
   firebase functions:config:set email.password="your-app-password"
   ```
3. Uncomment the Nodemailer code in `functions/index.js` (Option 2)
4. Update SMTP settings for your email provider

### 6. Deploy Functions

```bash
firebase deploy --only functions
```

## How It Works

1. The function `sendPrayerReminderEmails` runs every minute
2. It checks all active prayer reminders in Firestore
3. For each reminder that matches the current time:
   - Converts the reminder time to UTC based on user's timezone
   - Checks if the recurrence pattern matches (daily, weekly, custom, one-time)
   - Verifies the reminder hasn't been sent today
   - Sends an email notification
   - Updates the `lastTriggered` timestamp

## Testing

To test locally:

```bash
firebase emulators:start --only functions
```

## Monitoring

View function logs:

```bash
firebase functions:log
```

Or check the Firebase Console → Functions → Logs

## Troubleshooting

- **Emails not sending**: Check that your email service is properly configured
- **Wrong time**: Verify timezone conversion logic
- **Function not running**: Check Firebase Console → Functions → Logs for errors
- **Permission errors**: Ensure Firebase Admin SDK is properly initialized

## Cost Considerations

- Firebase Functions: Free tier includes 2 million invocations/month
- SendGrid: Free tier includes 100 emails/day
- Firebase Extensions: Uses Firebase Functions pricing

## Security Notes

- Never commit API keys or credentials to git
- Use Firebase Functions config for sensitive data
- Verify sender email addresses in your email service
- Consider rate limiting for production use
