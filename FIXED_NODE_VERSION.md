# Fixed Node.js Version Issue

## Problem

Node.js 18 runtime was decommissioned on 2025-10-30. Firebase requires Node.js 20 or higher.

## Solution Applied

✅ Updated `functions/package.json` to use Node.js 20

## Deploy Again

Now run the deployment command again:

```bash
firebase deploy --only functions
```

This should work now!

---

## Expected Output

You should see:

```
✔  functions[sendPrayerReminderEmails(us-central1)] Successful create operation.
Function URL: https://us-central1-bible-community-b5afa.cloudfunctions.net/sendPrayerReminderEmails
```

---

## After Deployment

1. **Check Firebase Console** → **Functions**
2. **You should see**: `sendPrayerReminderEmails` function listed
3. **Test it**: Create a reminder in your app for 2-3 minutes from now
4. **Check logs**: Firebase Console → Functions → sendPrayerReminderEmails → Logs
5. **Check email**: Your inbox should receive the reminder email

---

**Run the deploy command again now!**
