# Email Notifications Deployment Guide

## Step-by-Step Deployment Instructions

### Step 1: Install Firebase Extensions (Trigger Email)

**This is REQUIRED before deploying functions!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bible-community-b5afa**
3. Click **Extensions** in the left sidebar
4. Click **Browse Extensions** or search for **"Trigger Email"**
5. Click on **"Trigger Email"** extension
6. Click **Install**
7. Follow the setup wizard:
   - **Collection path**: `mail` (default)
   - **SMTP connection URI**: You'll need to set this up
     - For Gmail: `smtps://your-email@gmail.com:your-app-password@smtp.gmail.com:465`
     - Or use SendGrid: `smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465`
   - **Email documents**: Leave default settings
8. Click **Install** to complete

**Note**: If you don't have SMTP credentials yet, you can:

- Use Gmail with an App Password (see below)
- Sign up for SendGrid (free tier: 100 emails/day)
- Use another SMTP provider

### Step 2: Set Up Email Service (Choose One)

#### Option A: Gmail (Easiest for Testing)

1. Go to your Google Account settings
2. Enable **2-Step Verification**
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Use this format for SMTP URI:
   ```
   smtps://your-email@gmail.com:your-app-password@smtp.gmail.com:465
   ```

#### Option B: SendGrid (Recommended for Production)

1. Sign up at [sendgrid.com](https://sendgrid.com) (free tier available)
2. Create an API key in SendGrid dashboard
3. Use this format for SMTP URI:
   ```
   smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
   ```

### Step 3: Deploy Firebase Functions

Open PowerShell/Terminal in your project directory and run:

```bash
# Make sure you're in the project root
cd C:\Users\bophe\BibleCommunity

# Login to Firebase (if not already logged in)
firebase login

# Set your Firebase project
firebase use bible-community-b5afa

# Deploy functions
firebase deploy --only functions
```

### Step 4: Verify Deployment

1. Go to Firebase Console → Functions
2. You should see `sendPrayerReminderEmails` function listed
3. Check the logs to ensure it's running

### Step 5: Test Email Notifications

1. Create a test reminder in your app for 1-2 minutes from now
2. Wait and check your email
3. Check Firebase Console → Functions → Logs for any errors

## Troubleshooting

### Function Not Deploying

- Make sure you're logged in: `firebase login`
- Check your project: `firebase use bible-community-b5afa`
- Verify `firebase.json` exists in project root

### Emails Not Sending

- Check Firebase Console → Extensions → Trigger Email → Logs
- Verify SMTP URI is correct in extension settings
- Check Firebase Console → Functions → Logs for errors
- Make sure the `mail` collection exists in Firestore

### Function Errors

- Check Firebase Console → Functions → Logs
- Verify all dependencies are installed: `cd functions && npm install`
- Make sure Firestore is enabled in your Firebase project

## Important Notes

- **Trigger Email Extension MUST be installed** before emails will work
- The function runs every minute to check for reminders
- Emails are sent via the `mail` collection in Firestore
- Each reminder can only trigger once per day (prevents duplicates)

## Next Steps After Deployment

1. Test with a reminder set for 1-2 minutes from now
2. Monitor Firebase Console → Functions → Logs
3. Check your email inbox
4. If everything works, you're all set! 🎉

## Cost Considerations

- **Firebase Functions**: Free tier = 2M invocations/month (plenty for reminders)
- **Trigger Email Extension**: Uses Firebase Functions pricing (same free tier)
- **SendGrid**: Free tier = 100 emails/day
- **Gmail**: Free, but limited to personal use
