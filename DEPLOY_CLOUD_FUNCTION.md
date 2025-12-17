# Deploy Cloud Function for Prayer Reminders

## Option 1: Install Firebase CLI and Deploy (Recommended)

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate.

### Step 3: Deploy the Function

```bash
firebase deploy --only functions
```

---

## Option 2: Deploy via Firebase Console (Easier)

Since you already published the rules via the console, you can also deploy the function there:

### Step 1: Go to Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select project: `bible-community-b5afa`
3. Click **"Functions"** in the left sidebar

### Step 2: Deploy Function

1. Click **"Get Started"** (if first time)
2. Or click **"Add Function"** if you already have functions
3. However, **this method requires manual code entry**

**Better approach**: Use Firebase CLI (Option 1) or continue with the instructions below.

---

## Option 3: Test First Without Deploying

You can test if the email system works by manually creating a test email:

### Test Email Sending (Manual Test)

1. **Go to Firebase Console** → **Firestore Database**
2. **Create a new document** in the `mail` collection:
   - Click **"Start collection"** → Name: `mail`
   - Document ID: Auto-generate
   - Add fields:
     - `to` (string): `bophelompopo22@gmail.com`
     - `message` (map):
       - `subject` (string): `Test Prayer Reminder`
       - `html` (string): `<h1>Test Email</h1><p>This is a test email from Trigger Email extension.</p>`
3. **Click "Save"**
4. **Check your email inbox** - you should receive the email within a few seconds

If this works, the Trigger Email extension is configured correctly!

---

## What the Cloud Function Does

The Cloud Function (`sendPrayerReminderEmails`) runs **every minute** and:

1. Checks all active reminders in `prayer_reminders` collection
2. Finds reminders that are due now (based on time and timezone)
3. Creates documents in the `mail` collection
4. Trigger Email extension sends the emails automatically

**Without the Cloud Function**: Reminders won't be sent automatically. You'd have to manually create documents in the `mail` collection.

**With the Cloud Function**: Reminders are sent automatically at the scheduled times.

---

## Recommended Next Steps

1. **First**: Test email sending manually (Option 3) to verify Trigger Email extension works
2. **Then**: Install Firebase CLI and deploy the function (Option 1) for automatic reminders

---

## Troubleshooting

### If Firebase CLI installation fails:

- Make sure Node.js is installed: `node --version`
- Try: `npm install -g firebase-tools --force`

### If deployment fails:

- Make sure you're logged in: `firebase login`
- Make sure you're in the project directory
- Check that `functions/package.json` exists
