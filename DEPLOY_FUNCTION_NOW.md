# Deploy Cloud Function - Step by Step

## ✅ Step 1: Nodemailer Installed

Nodemailer has been installed successfully in the `functions` directory.

## Step 2: Install Firebase CLI (If Not Already Installed)

Open PowerShell or Command Prompt and run:

```bash
npm install -g firebase-tools
```

**Note**: This may take a few minutes. If you get permission errors, you might need to run PowerShell as Administrator.

## Step 3: Login to Firebase

```bash
firebase login
```

This will:

1. Open a browser window
2. Ask you to sign in with your Google account
3. Authorize Firebase CLI

## Step 4: Select Your Project

```bash
firebase use bible-community-b5afa
```

Or if prompted, select your project from the list.

## Step 5: Deploy the Function

```bash
firebase deploy --only functions
```

This will:

1. Upload your function code
2. Install dependencies
3. Deploy to Firebase
4. Show you the function URL when done

**Expected output:**

```
✔  functions[sendPrayerReminderEmails(us-central1)] Successful create operation.
Function URL: https://us-central1-bible-community-b5afa.cloudfunctions.net/sendPrayerReminderEmails
```

## Step 6: Verify Deployment

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Click "Functions"** in left sidebar
4. **You should see**: `sendPrayerReminderEmails` function listed

## Troubleshooting

### If `firebase` command not found:

1. **Close and reopen** PowerShell/Command Prompt
2. **Or** add npm global path to PATH:
   - Find npm global path: `npm config get prefix`
   - Add it to your system PATH environment variable

### If login fails:

- Make sure you're using the correct Google account
- Try: `firebase login --no-localhost`

### If deployment fails:

- Check that you're in the project root directory (`BibleCommunity`)
- Verify `functions/index.js` exists
- Check for syntax errors in the function code

## Quick Test After Deployment

1. **Create a reminder** in your app for **2-3 minutes from now**
2. **Wait for the scheduled time**
3. **Check Firebase Console** → **Functions** → **sendPrayerReminderEmails** → **Logs**
4. **You should see**: "Email sent successfully" or error messages
5. **Check your email inbox**

---

## Alternative: Deploy via Firebase Console

If CLI doesn't work, you can also:

1. **Zip the `functions` folder**
2. **Go to Firebase Console** → **Functions**
3. **Click "Deploy from source"** or similar option
4. **Upload the zip file**

However, CLI method is recommended and easier.

---

**Once deployed, your email reminders will work automatically!** 🎉
