# Manual Deployment Instructions

## Issue Found

The Firebase CLI commands are running but not showing output in PowerShell. Let's deploy manually so you can see what's happening.

## Step-by-Step Deployment

### Step 1: Open PowerShell

Open a **new** PowerShell window (close and reopen if needed).

### Step 2: Navigate to Project

```bash
cd C:\Users\bophe\BibleCommunity
```

### Step 3: Verify Project is Set

```bash
firebase use
```

**Expected output**: `Using project bible-community-b5afa`

If it says "No project selected", run:
```bash
firebase use bible-community-b5afa
```

### Step 4: Deploy Function

```bash
firebase deploy --only functions
```

**Watch for output** - you should see:
- "Deploying functions..."
- "functions[sendPrayerReminderEmails(us-central1)] Successful create operation."
- Or error messages if something fails

### Step 5: Verify Deployment

After deployment completes, check Firebase Console:

1. Go to: https://console.firebase.google.com/
2. Select project: `bible-community-b5afa`
3. Click **"Functions"** in left sidebar
4. Look for: **`sendPrayerReminderEmails`**

---

## If Deployment Fails

### Common Errors:

1. **"No project selected"**
   - Run: `firebase use bible-community-b5afa`

2. **"Permission denied"**
   - Make sure you're logged in: `firebase login`
   - Verify you have access to the project

3. **"Function deployment failed"**
   - Check the error message
   - Verify `functions/index.js` has no syntax errors
   - Make sure `functions/package.json` includes `nodemailer`

4. **"Missing dependencies"**
   - Run: `cd functions && npm install`
   - Then try deploying again

---

## Alternative: Check Current Functions

To see what functions are currently deployed:

```bash
firebase functions:list
```

You should see:
- `ext-firestore-send-email-processqueue` (Trigger Email extension)
- `sendPrayerReminderEmails` (your new function - after deployment)

---

## After Successful Deployment

1. **Create a test reminder** in your app (2-3 minutes from now)
2. **Wait for scheduled time**
3. **Check Firebase Console** → **Functions** → **sendPrayerReminderEmails** → **Logs**
4. **Check your email inbox**

---

**Run these commands manually in PowerShell and share any error messages you see!**

