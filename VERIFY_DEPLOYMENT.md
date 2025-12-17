# Verify Function Deployment

## Commands Executed

✅ `firebase login` - Success!  
✅ `firebase use bible-community-b5afa` - Completed  
✅ `firebase deploy --only functions` - Completed  

## Verify Deployment

### Option 1: Check Firebase Console

1. **Go to**: https://console.firebase.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Click "Functions"** in left sidebar
4. **Look for**: `sendPrayerReminderEmails` function
5. **Check status**: Should show "Active" or "Deployed"

### Option 2: Check via CLI

Run this command in PowerShell:

```bash
firebase functions:list
```

You should see `sendPrayerReminderEmails` listed.

### Option 3: Check Function Logs

1. **Go to Firebase Console** → **Functions**
2. **Click on** `sendPrayerReminderEmails`
3. **Click "Logs" tab**
4. **You should see logs** from when the function runs

## If Function is Not Deployed

If you don't see the function, try deploying again manually:

```bash
cd C:\Users\bophe\BibleCommunity
firebase deploy --only functions
```

Watch for any error messages during deployment.

## Test the Function

Once deployed, test it:

1. **Create a reminder** in your app:
   - Go to **Prayer Time** screen
   - Create reminder for **2-3 minutes from now**
   - Set recurrence to "Daily"
   - Make sure it's **Active**
   - Save

2. **Wait for the scheduled time**

3. **Check function logs**:
   - Firebase Console → Functions → `sendPrayerReminderEmails` → Logs
   - Look for: "Email sent successfully" or error messages

4. **Check your email inbox** (`bophelompopo22@gmail.com`)

## Expected Log Messages

When the function runs, you should see:

```
Checking reminders at XX:XX UTC, Day: X, Date: YYYY-MM-DD
Email sent for reminder [reminder-id] to [email]
Email sent successfully: [message-id]
Sent 1 reminder email(s)
```

## Troubleshooting

### If function doesn't appear:

1. **Check for errors** during deployment
2. **Verify** `functions/index.js` exists and is correct
3. **Try deploying again**: `firebase deploy --only functions`

### If emails don't send:

1. **Check function logs** for error messages
2. **Verify Gmail App Password** is correct in the code
3. **Check** that reminders are being created in Firestore
4. **Verify** reminder time matches current time (accounting for timezone)

---

**Let me know what you see in the Firebase Console!**

