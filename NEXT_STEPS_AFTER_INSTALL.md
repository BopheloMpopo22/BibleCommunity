# Next Steps After Trigger Email Extension Installation

## ✅ Extension Installed Successfully!

Now let's configure and test the email notification system.

---

## Step 1: Verify SMTP Configuration

The Trigger Email extension needs SMTP settings configured:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Click "Extensions"** in left sidebar
4. **Click on "Trigger Email"** extension
5. **Click "..." menu** → **"View in Cloud Console"** or **"Configure"**
6. **Verify SMTP settings**:
   - **SMTP Connection URI**: Should be your Gmail SMTP URI
     - Format: `smtps://USERNAME:PASSWORD@smtp.gmail.com:465`
     - Example: `smtps://bophelompopo22@gmail.com:YOUR_APP_PASSWORD@smtp.gmail.com:465`
   - **Default FROM address**: `bophelompopo22@gmail.com`

**If SMTP is not configured:**

- You'll need to create a Gmail App Password:
  1. Go to Google Account → Security
  2. Enable 2-Step Verification
  3. Create App Password for "Mail"
  4. Use that password in the SMTP URI

---

## Step 2: Update Firestore Rules

We need to allow the `mail` collection (for Trigger Email) and `prayer_reminders` collection.

**The rules have been updated automatically** - you just need to deploy them:

```bash
firebase deploy --only firestore:rules
```

Or update manually in Firebase Console:

1. Go to **Firestore Database** → **Rules**
2. Add these rules (they should already be added):
   - Allow Cloud Functions to write to `mail` collection
   - Allow authenticated users to read/write `prayer_reminders`

---

## Step 3: Deploy Cloud Function (Optional)

The Cloud Function (`sendPrayerReminderEmails`) is optional - the Trigger Email extension handles emails automatically.

**If you want scheduled reminders**, deploy the function:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Note**: The Cloud Function runs every minute to check for reminders and creates documents in the `mail` collection, which triggers the email extension.

---

## Step 4: Test Email Notifications

### Test 1: Create a Test Reminder

1. **Open your app** → **Prayer Time** screen
2. **Create a new reminder**:
   - Set time to **2 minutes from now** (e.g., if it's 3:00 PM, set to 3:02 PM)
   - Set recurrence to **"Daily"** or **"One-time"**
   - Make sure it's **Active** (toggle ON)
3. **Save the reminder**

### Test 2: Check Firestore

1. **Go to Firebase Console** → **Firestore Database**
2. **Check `prayer_reminders` collection**:
   - You should see your reminder document
   - Verify it has: `email`, `time`, `isActive: true`, `timezone`
3. **Wait for the scheduled time** (or check Cloud Function logs)

### Test 3: Check Email

1. **Wait for the reminder time** (or check Cloud Function logs)
2. **Check your email inbox** (`bophelompopo22@gmail.com`)
3. **You should receive an email** with:
   - Subject: "Prayer Reminder" (or your custom title)
   - Body: HTML formatted reminder message

---

## Step 5: Monitor Logs

### Check Cloud Function Logs

1. **Go to Firebase Console** → **Functions**
2. **Click on `sendPrayerReminderEmails`**
3. **View logs** to see:
   - When reminders are checked
   - When emails are sent
   - Any errors

### Check Trigger Email Extension Logs

1. **Go to Firebase Console** → **Extensions**
2. **Click on "Trigger Email"**
3. **View logs** to see:
   - When emails are processed
   - SMTP connection status
   - Email delivery status

---

## Step 6: Verify Everything Works

### Checklist:

- [ ] SMTP is configured in Trigger Email extension
- [ ] Firestore rules allow `mail` and `prayer_reminders` collections
- [ ] Cloud Function is deployed (optional, for scheduled reminders)
- [ ] Created a test reminder in the app
- [ ] Reminder appears in Firestore `prayer_reminders` collection
- [ ] Email is received at the scheduled time
- [ ] No errors in Cloud Function logs
- [ ] No errors in Trigger Email extension logs

---

## Troubleshooting

### Emails Not Sending?

1. **Check SMTP configuration**:

   - Verify SMTP URI is correct
   - Verify Gmail App Password is correct
   - Check if 2-Step Verification is enabled

2. **Check Firestore rules**:

   - Ensure `mail` collection allows writes from Cloud Functions
   - Ensure `prayer_reminders` collection allows reads/writes

3. **Check Cloud Function logs**:

   - Look for errors in function execution
   - Verify reminders are being found and processed

4. **Check Trigger Email extension logs**:
   - Look for SMTP connection errors
   - Verify emails are being processed

### Reminders Not Creating?

1. **Check user authentication**:

   - User must be logged in
   - User must have an email address

2. **Check Firestore rules**:

   - Ensure authenticated users can write to `prayer_reminders`

3. **Check app logs**:
   - Look for errors when creating reminders

---

## How It Works

1. **User creates reminder** → Saved to `prayer_reminders` collection in Firestore
2. **Cloud Function runs every minute** → Checks for reminders due now
3. **When reminder is due** → Function creates document in `mail` collection
4. **Trigger Email extension** → Detects new `mail` document
5. **Email is sent** → Via SMTP to user's email address

---

## Next Steps

Once everything is working:

1. **Test with multiple reminders** (different times, recurrences)
2. **Test with different users** (if you have multiple test accounts)
3. **Monitor email delivery** (check spam folder if needed)
4. **Adjust email template** (if you want to customize the HTML)

---

## Need Help?

If you encounter issues:

1. Check the logs (Cloud Function and Trigger Email extension)
2. Verify SMTP configuration
3. Verify Firestore rules
4. Check that reminders are being created correctly
